// Performance audit: weight, image sizing, layout shift, blocking assets.

import { finding, SEVERITY } from '../lib/rules.mjs';

export const id = 'perf';
export const label = 'Performance';

const IMAGE_BUDGET = 2_500_000;
const IMAGE_FAIL = 4_500_000;
const SINGLE_WARN = 500_000;
const SINGLE_FAIL = 1_200_000;

export async function audit(ctx) {
  const { facts } = ctx;
  const findings = [];
  const imageResources = facts.resources.filter(resource => /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(resource.name) || resource.type === 'img');
  const total = facts.resources.reduce((sum, resource) => sum + (resource.transfer || resource.encoded || 0), 0);
  const imageTotal = imageResources.reduce((sum, resource) => sum + (resource.transfer || resource.encoded || 0), 0);

  if (total > IMAGE_FAIL) {
    findings.push(finding('PERF-01', `The page transfers ${(total / 1e6).toFixed(2)} MB, over the 4.5 MB ceiling.`, {
      severity: SEVERITY.fail,
      selector: 'body',
      fix: 'Compress images to WebP/AVIF, remove unused fonts and split large scripts.',
      where: `${ctx.width}x${ctx.height}`
    }));
  } else if (total > IMAGE_BUDGET) {
    findings.push(finding('PERF-01', `The page transfers ${(total / 1e6).toFixed(2)} MB.`, {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Aim for under 2.5 MB on a first load.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (imageTotal > IMAGE_FAIL) {
    findings.push(finding('PERF-01', `Images alone transfer ${(imageTotal / 1e6).toFixed(2)} MB.`, {
      severity: SEVERITY.fail,
      selector: 'img',
      fix: 'Resize images to their rendered size and export WebP or AVIF.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  for (const resource of imageResources) {
    const size = resource.transfer || resource.encoded || 0;
    if (size > SINGLE_FAIL) {
      findings.push(finding('PERF-01', `One image is ${(size / 1e6).toFixed(2)} MB.`, {
        severity: SEVERITY.fail,
        selector: 'img',
        detail: resource.name.slice(0, 180),
        fix: 'Re-encode below 1 MB; hero images should be under 500 KB.',
        where: `${ctx.width}x${ctx.height}`
      }));
    } else if (size > SINGLE_WARN) {
      findings.push(finding('PERF-01', `One image is ${Math.round(size / 1000)} KB.`, {
        severity: SEVERITY.warn,
        selector: 'img',
        detail: resource.name.slice(0, 180),
        fix: 'Aim for under 500 KB per photographic asset.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // Oversized intrinsic images.
  for (const image of facts.images.filter(img => img.displayed && img.naturalWidth > 0)) {
    if (image.naturalWidth > 800 && image.naturalWidth > image.rect.width * 2.5 && image.rect.width > 0) {
      findings.push(finding('PERF-01', `An image is ${image.naturalWidth}px wide but renders at ${Math.round(image.rect.width)}px.`, {
        severity: SEVERITY.warn,
        selector: image.selector,
        detail: image.src.slice(0, 160),
        fix: 'Serve a 1x/2x srcset sized to the slot.',
        where: `${ctx.width}x${ctx.height}`
      }));
    }
  }

  // PERF-02 - layout shift and long tasks.
  const perf = facts.perf || {};
  if (perf.cls > 0.1) {
    findings.push(finding('PERF-02', `Cumulative layout shift is ${perf.cls}.`, {
      severity: SEVERITY.fail,
      selector: 'body',
      fix: 'Reserve width and height on images, embeds and late-loading banners.',
      where: `${ctx.width}x${ctx.height}`
    }));
  } else if (perf.cls > 0.05) {
    findings.push(finding('PERF-02', `Cumulative layout shift is ${perf.cls}.`, {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Set explicit media dimensions and font-display: swap with a matched fallback.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  const longTasks = perf.longTasks || [];
  if (longTasks.some(task => task.duration > 200)) {
    findings.push(finding('PERF-02', 'A main-thread task blocked for more than 200ms.', {
      severity: SEVERITY.warn,
      selector: 'body',
      detail: longTasks.map(task => `${task.duration}ms`).join(', '),
      fix: 'Break up long scripts and defer non-critical work.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (perf.lcp > 4000) {
    findings.push(finding('PERF-02', `Largest contentful paint is ${perf.lcp}ms.`, {
      severity: SEVERITY.warn,
      selector: 'img, h1',
      fix: 'Preload the hero image and reduce render-blocking work.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  // PERF-03 - render-blocking assets.
  const blocking = await ctx.page.evaluate(() => {
    const head = document.head;
    const scripts = [...head.querySelectorAll('script[src]')].filter(script => !script.defer && !script.async && script.type !== 'module');
    const styles = [...document.querySelectorAll('link[rel="stylesheet"]')];
    return {
      scripts: scripts.map(script => script.src.split('/').pop()),
      styles: styles.map(link => link.href.split('/').pop()).slice(0, 12),
      fonts: [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')].length
    };
  }).catch(() => ({ scripts: [], styles: [], fonts: 0 }));
  if (blocking.scripts.length > 0) {
    findings.push(finding('PERF-03', `${blocking.scripts.length} blocking script(s) in the document head.`, {
      severity: SEVERITY.warn,
      selector: 'head script',
      detail: blocking.scripts.join(', '),
      fix: 'Add defer, async, or type="module" to non-critical scripts.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }
  if (blocking.styles.length + blocking.fonts > 7) {
    findings.push(finding('PERF-03', `${blocking.styles.length} stylesheets and ${blocking.fonts} font requests load before paint.`, {
      severity: SEVERITY.warn,
      selector: 'head link',
      fix: 'Combine stylesheets and load one font request with only used weights.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  if (facts.document.nodes > 4000) {
    findings.push(finding('PERF-01', `The DOM holds ${facts.document.nodes} nodes.`, {
      severity: SEVERITY.warn,
      selector: 'body',
      fix: 'Reduce wrapper depth and virtualize long lists.',
      where: `${ctx.width}x${ctx.height}`
    }));
  }

  return findings;
}

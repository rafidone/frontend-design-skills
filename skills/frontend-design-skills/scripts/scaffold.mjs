#!/usr/bin/env node
// Generate a runnable project from the starter system, the assigned palette and
// the assigned type pairing. Static HTML is the reference implementation; every
// framework adapter renders the same markup against the same token source.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assign, loadLibraries } from './assign.mjs';
import { creditsPage } from './assets.mjs';
import { readJson, writeJson, ensureDir, escapeHtml } from './lib/json.mjs';
import { parseColor, hueSaturation, contrastRatio } from './lib/color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const STARTER = path.join(skillRoot, 'assets/starter');

export const STACKS = ['html', 'react', 'next', 'vue', 'svelte', 'astro', 'tailwind'];

const STACK_LABEL = {
  html: 'Static HTML and CSS',
  react: 'React with Vite',
  next: 'Next.js App Router (static export)',
  vue: 'Vue 3 with Vite',
  svelte: 'Svelte with Vite',
  astro: 'Astro (static)',
  tailwind: 'Tailwind CSS v4 with Vite'
};

function readStarter(file) {
  return fs.readFileSync(path.join(STARTER, file), 'utf8');
}

function listFiles(root, base = root) {
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full));
  }
  return out;
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyTree(source, target, filter = () => true) {
  if (!fs.existsSync(source)) return;
  for (const rel of listFiles(source)) {
    if (!filter(rel)) continue;
    copyFile(path.join(source, rel), path.join(target, rel));
  }
}

function mix(a, b, weight) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  const w = Math.max(0, Math.min(1, weight));
  const channel = (x, y) => Math.round(x * w + y * (1 - w)).toString(16).padStart(2, '0');
  return `#${channel(ca.r, cb.r)}${channel(ca.g, cb.g)}${channel(ca.b, cb.b)}`;
}

function shade(hex, amount) {
  const c = parseColor(hex);
  if (!c) return hex;
  const target = amount < 0 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
  return mix(
    `#${[c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('')}`,
    `#${[target.r, target.g, target.b].map(v => v.toString(16).padStart(2, '0')).join('')}`,
    1 - Math.min(1, Math.abs(amount))
  );
}

function rootBlock(css) {
  const start = css.indexOf(':root');
  if (start === -1) return null;
  const open = css.indexOf('{', start);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return { start, open, end: i };
    }
  }
  return null;
}

function setVars(block, vars) {
  let out = block;
  for (const [name, value] of Object.entries(vars)) {
    const pattern = new RegExp(`(${name}\\s*:\\s*)[^;]+;`);
    if (pattern.test(out)) out = out.replace(pattern, `$1${value};`);
    else out = out.replace(/\n}\s*$/, `\n  ${name}: ${value};\n}`);
  }
  return out;
}

export function patchTokens(css, palette, pair) {
  const bounds = rootBlock(css);
  if (!bounds) throw new Error('tokens.css has no :root block');
  const accent = palette.accent;
  const accentInk = palette.accentInk;
  const bg = palette.bg;
  const ink = palette.ink;
  const surface = palette.surface || mix(bg, ink, 0.92);
  const muted = palette.muted || mix(ink, bg, 0.55);
  const inkSoft = mix(ink, bg, 0.78);
  const line = mix(ink, bg, 0.16);
  const lineStrong = mix(ink, bg, 0.32);
  const dark = String(palette.mode || '').toLowerCase() === 'dark' ||
    (contrastRatio(ink, bg) !== null && (parseColor(bg)?.r || 255) < 90);

  const sizes = pair?.display?.scale || {};
  const h1 = Number(sizes.h1) || 76;
  const h2 = Number(sizes.h2) || 48;
  const h3 = Number(sizes.h3) || 26;
  const display = pair?.display?.family || 'Fraunces';
  const text = pair?.text?.family || 'DM Sans';
  const mono = pair?.mono?.family || 'SFMono-Regular';
  const fallback = pair?.fallback || {};
  const fontStack = (family, fallbackStack) => {
    const safeFallback = fallbackStack || 'ui-sans-serif, system-ui, sans-serif';
    return `"${family}", ${safeFallback}`;
  };

  const vars = {
    '--font-sans': fontStack(text, fallback.text),
    '--font-display': fontStack(display, fallback.display),
    '--font-mono': fontStack(mono, fallback.mono || 'ui-monospace, SFMono-Regular, monospace'),
    '--text-display': `clamp(3.25rem, 1.35rem + ${Math.max(4, Math.round(h1 / 15))}vw, ${(h1 / 16).toFixed(3)}rem)`,
    '--text-3xl': `clamp(2.25rem, 1.4rem + ${Math.max(2, Math.round(h2 / 18))}vw, ${(h2 / 16).toFixed(3)}rem)`,
    '--text-2xl': `clamp(1.8rem, 1.2rem + ${Math.max(1, Math.round(h3 / 22))}vw, ${((h3 * 1.35) / 16).toFixed(3)}rem)`,
    '--tracking-tight': pair?.display?.tracking || '-0.035em',
    '--leading-tight': pair?.display?.lineHeight || '0.98',
    '--paper': bg,
    '--surface': surface,
    '--surface-2': mix(ink, surface, 0.06),
    '--surface-3': mix(ink, surface, 0.12),
    '--ink': ink,
    '--ink-soft': inkSoft,
    '--muted': muted,
    '--line': line,
    '--line-strong': lineStrong,
    '--brand': accent,
    '--brand-strong': shade(accent, dark ? 0.2 : -0.22),
    '--brand-soft': mix(accent, bg, 0.14),
    '--accent': accent,
    '--accent-strong': shade(accent, dark ? 0.18 : -0.2),
    '--accent-soft': mix(accent, bg, 0.16),
    '--focus': accent,
    '--white': accentInk,
    '--black': ink
  };

  let block = css.slice(bounds.start, bounds.end + 1);
  block = setVars(block, vars);
  let out = css.slice(0, bounds.start) + block + css.slice(bounds.end + 1);
  out = out.replace(/color-scheme:\s*(light|dark);/i, `color-scheme: ${dark ? 'dark' : 'light'};`);
  return out;
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function replaceDescription(html, description) {
  if (/<meta\s+name="description"[^>]*>/i.test(html)) {
    return html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  }
  return html.replace(/<meta\s+charset="utf-8">/i, `<meta charset="utf-8">\n  <meta name="description" content="${escapeHtml(description)}">`);
}

function replaceFonts(html, pair) {
  const href = pair?.googleFonts || '';
  if (!href) return html;
  return html.replace(/<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"\s+rel="stylesheet">/i, `<link href="${escapeHtml(href)}" rel="stylesheet">`);
}

function replaceBrand(html, name, slug) {
  const safe = escapeHtml(name);
  let out = html.replaceAll('Morrow', safe);
  out = out.replaceAll('morrow.example', `${slug}.example`);
  const initial = safe.trim().slice(0, 1).toUpperCase();
  out = out.replace(
    /(<span class="brand__mark" aria-hidden="true">)[^<]*(<\/span>)/g,
    (_match, open, close) => `${open}${initial}${close}`
  );
  return out;
}

function replaceCredits(html, pair) {
  if (!pair?.display?.family || !pair?.text?.family) return html;
  const families = pair.mono?.family
    ? `${pair.display.family}, ${pair.text.family} and ${pair.mono.family}`
    : `${pair.display.family} and ${pair.text.family}`;
  return html.replace(/Typefaces: Fraunces and DM Sans/, `Typefaces: ${escapeHtml(families)}`);
}

function bodyOnly(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].replace(/<script\b[\s\S]*?<\/script>/gi, '').trim() : html;
}

function slugify(value) {
  const slug = String(value || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42);
  return slug || 'site';
}

function paletteFor(paletteId, pairId) {
  const { palettes, typePairs } = loadLibraries();
  const palette = palettes.find(item => item.id === paletteId);
  const pair = typePairs.find(item => item.id === pairId);
  return { palettes, typePairs, palette, pair };
}

function selectPhoto(manifest, niche) {
  const items = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const preferred = items.find(asset => Array.isArray(asset.tags) && asset.tags.includes(niche) && !asset.placeholder);
  return preferred || items.find(asset => !asset.placeholder) || null;
}

function copySharedAssets(target, options = {}) {
  const iconRoot = path.join(skillRoot, 'assets/icons');
  const photoRoot = path.join(skillRoot, 'assets/photos');
  const dataRoot = path.join(skillRoot, 'assets/mock-data');
  const diagramRoot = path.join(skillRoot, 'assets/diagrams');
  const publicRoot = options.publicRoot || target;

  if (fs.existsSync(iconRoot)) {
    copyTree(iconRoot, path.join(publicRoot, 'assets/icons'), rel => /^(ui|brand)\//.test(rel) || rel === 'manifest.json');
  }
  if (fs.existsSync(dataRoot)) {
    copyTree(dataRoot, path.join(publicRoot, 'assets/data'), rel => rel.endsWith('.json'));
  }
  if (fs.existsSync(diagramRoot)) {
    copyTree(diagramRoot, path.join(publicRoot, 'assets/diagrams'), rel => rel.endsWith('.html'));
  }

  const manifest = readJson(path.join(photoRoot, 'manifest.json'), { assets: [] });
  const picked = selectPhoto(manifest, options.niche);
  if (picked) {
    const source = path.join(photoRoot, picked.path);
    if (fs.existsSync(source)) {
      copyFile(source, path.join(publicRoot, 'assets/photos', picked.path));
      const siteManifest = {
        version: 1,
        note: 'Local copies of the library photographs selected for this build. Verify with assets.mjs verify.',
        assets: [{ ...picked, path: `assets/photos/${picked.path}` }]
      };
      const siteManifestPath = path.join(publicRoot, 'assets/photos/manifest.json');
      writeJson(siteManifestPath, siteManifest);
      fs.writeFileSync(
        path.join(publicRoot, 'credits.html'),
        `${creditsPage(siteManifestPath, { site: options.name || 'this site' })}\n`
      );
    }
  }
}

function readmeFor({ stack, name, niche, direction, commands }) {
  return `# ${name}

Generated by \`frontend-design-skills\` for the **${STACK_LABEL[stack]}** stack.

## Direction

- Niche: ${niche}
- Palette: \`${direction.palette}\`
- Type pairing: \`${direction.typePair}\`
- Hero archetype: \`${direction.hero}\`
- Hero layout: \`${direction.heroLayout}\`
- Motion tier: \`${direction.motionTier}\`
- Composition: \`${direction.composition}\`

The lock lives in \`.frontend-design-skills/art-direction.json\`. Do not introduce a
second palette, a second type system or a second component library.

## Run

${commands.run}

## Build

${commands.build}

## Verify

Serve the built output over HTTP, then run the gate from this project directory:

\`\`\`bash
node /path/to/frontend-design-skills/scripts/verify.mjs . --full --kind ${niche}
\`\`\`

Screenshots, \`report.json\`, \`report.html\` and \`report.md\` are written under
\`.frontend-design-skills/runs/\`.

## Assets

Icons, mock data and diagrams are local under \`assets/\`. Photographs keep their
source, licence and checksum in \`assets/photos/manifest.json\`, with a matching
\`credits.html\`. Run the asset check from this project directory:

\`\`\`bash
node /path/to/frontend-design-skills/scripts/assets.mjs verify --manifest assets/photos/manifest.json
\`\`\`

## Notes

- The page is static at runtime. The framework adapter must keep the same tokens,
  container and component names as the HTML reference.
- Replace the demo copy and demo interactions with the client's real content
  before delivery.
- Delete unused photographs and mock data rather than shipping a larger bundle.
`;
}

function heroLayoutFor(hero) {
  const key = String(hero || 'split').toLowerCase();
  if (['film', 'photo', 'collage'].includes(key)) return 'media';
  return 'split';
}

function applyHero(html, hero, options = {}) {
  const layout = heroLayoutFor(hero);
  if (layout !== 'media') return html;
  const key = String(hero).toLowerCase() === 'collage' ? 'photo' : String(hero).toLowerCase();
  let out = html.replace(
    '<section class="hero" id="top"',
    `<section class="hero hero--media hero--${key}" id="top"`
  );

  // A media hero without media is just a dark empty band. Pick the local photo
  // that matches the niche and place it behind the copy. The manifest copy step
  // later writes the same image into the project.
  const manifest = readJson(path.join(skillRoot, 'assets/photos/manifest.json'), { assets: [] });
  const picked = selectPhoto(manifest, options.niche);
  if (picked && !out.includes('class="hero-photo"')) {
    const figure = `      <figure class="hero-photo">
        <img src="assets/photos/${picked.path}" width="${picked.width}" height="${picked.height}" alt="${escapeHtml(picked.alt || picked.title || '')}" data-source="library" data-subject="${escapeHtml(picked.subject || '')}" loading="eager">
      </figure>

`;
    const marker = `<section class="hero hero--media hero--${key}" id="top" data-budget="1" aria-labelledby="hero-title">\n`;
    if (out.includes(marker)) out = out.replace(marker, marker + figure, 1);
  }
  return out;
}

const PAGE = {
  html: ({ title, description, pair, brand, slug, hero, niche }) => {
    let html = readStarter('index.html');
    html = replaceTitle(html, title);
    html = replaceDescription(html, description);
    html = replaceFonts(html, pair);
    html = replaceBrand(html, brand, slug);
    html = replaceCredits(html, pair);
    html = applyHero(html, hero, { niche });
    return html;
  }
};

function contentFor(starterHtml, { title, description, fonts, brand, slug, hero, niche }) {
  let html = replaceTitle(starterHtml, title);
  html = replaceDescription(html, description);
  html = replaceFonts(html, fonts);
  html = replaceBrand(html, brand, slug);
  html = replaceCredits(html, fonts);
  html = applyHero(html, hero, { niche });
  return bodyOnly(html);
}

function writeStaticStyles(target, palette, pair) {
  const styles = path.join(target, 'styles');
  ensureDir(styles);
  copyTree(path.join(STARTER, 'styles'), styles, rel => rel.endsWith('.css'));
  const tokensFile = path.join(styles, 'tokens.css');
  fs.writeFileSync(tokensFile, patchTokens(fs.readFileSync(tokensFile, 'utf8'), palette, pair));
}

function writeStaticScripts(target) {
  copyTree(path.join(STARTER, 'scripts'), path.join(target, 'scripts'), rel => rel.endsWith('.js'));
}

function writeFrameworkStyles(target, palette, pair, sheetDir = 'styles') {
  const styles = path.join(target, sheetDir);
  ensureDir(styles);
  copyTree(path.join(STARTER, 'styles'), styles, rel => rel.endsWith('.css'));
  const tokensFile = path.join(styles, 'tokens.css');
  fs.writeFileSync(tokensFile, patchTokens(fs.readFileSync(tokensFile, 'utf8'), palette, pair));
}

function htmlShell({ title, description, pair, root = 'src/main' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${escapeHtml(pair.googleFonts || '')}" rel="stylesheet">
  <script>document.documentElement.classList.add("has-js");</script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${root}"></script>
</body>
</html>
`;
}

function pageModule(content) {
  return `// Static page markup shared by the framework adapter. The content is local,
// trusted, and contains no user input; edits belong in this file.
export const pageContent = ${JSON.stringify(content)};
`;
}

function packageJson(name, dependencies, devDependencies, scripts, type = 'module') {
  return JSON.stringify({ name, version: '0.1.0', private: true, type, scripts, dependencies, devDependencies }, null, 2) + '\n';
}

function writeViteConfig(target, pluginImport, plugins, extra = '') {
  fs.writeFileSync(path.join(target, 'vite.config.js'), `${pluginImport}
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [${plugins}],${extra}
});
`);
}

function writeHtmlStack(target, context) {
  writeStaticStyles(target, context.palette, context.pair);
  writeStaticScripts(target);
  fs.writeFileSync(path.join(target, 'index.html'), PAGE.html(context));
  copySharedAssets(target, { niche: context.niche, publicRoot: target });
  return {
    run: '```bash\npython3 -m http.server 4173 --directory .\n# open http://127.0.0.1:4173\n```',
    build: 'There is no build step. The files are already the production output.'
  };
}

function writeReactStack(target, context) {
  writeFrameworkStyles(target, context.palette, context.pair, 'src/styles');
  copyTree(path.join(STARTER, 'scripts'), path.join(target, 'public/scripts'), rel => rel.endsWith('.js'));
  ensureDir(path.join(target, 'src'));
  fs.writeFileSync(path.join(target, 'src/page-content.js'), pageModule(context.content));
  fs.writeFileSync(path.join(target, 'index.html'), htmlShell(context));
  fs.writeFileSync(path.join(target, 'src/main.jsx'), `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/motion.css';
import './styles/app.css';

document.documentElement.classList.add('has-js');
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
`);
  fs.writeFileSync(path.join(target, 'src/App.jsx'), `import { pageContent } from './page-content.js';

export default function App() {
  return <div className="framework-root" dangerouslySetInnerHTML={{ __html: pageContent }} />;
}
`);
  fs.writeFileSync(path.join(target, 'src/styles/app.css'), `/* Adapter-only rules. The visual system still comes from tokens and components. */
.framework-root { display: contents; }
`);
  fs.writeFileSync(path.join(target, 'package.json'), packageJson(slugify(context.name), {
    react: '^19.0.0',
    'react-dom': '^19.0.0'
  }, {
    '@vitejs/plugin-react': '^4.3.4',
    vite: '^6.0.0'
  }, { dev: 'vite', build: 'vite build', preview: 'vite preview' }));
  writeViteConfig(target, "import react from '@vitejs/plugin-react';", 'react()');
  copySharedAssets(target, { niche: context.niche, publicRoot: path.join(target, 'public') });
  return {
    run: '```bash\nnpm install\nnpm run dev\n```',
    build: '```bash\nnpm install\nnpm run build\npython3 -m http.server 4173 --directory dist\n```'
  };
}

function writeNextStack(target, context) {
  writeFrameworkStyles(target, context.palette, context.pair, 'src/styles');
  copyTree(path.join(STARTER, 'scripts'), path.join(target, 'public/scripts'), rel => rel.endsWith('.js'));
  ensureDir(path.join(target, 'app'));
  ensureDir(path.join(target, 'src'));
  fs.writeFileSync(path.join(target, 'src/page-content.js'), pageModule(context.content));
  fs.writeFileSync(path.join(target, 'app/globals.css'), `@import "../src/styles/tokens.css";
@import "../src/styles/base.css";
@import "../src/styles/layout.css";
@import "../src/styles/components.css";
@import "../src/styles/motion.css";

.framework-root { display: contents; }
`);
  fs.writeFileSync(path.join(target, 'app/layout.jsx'), `import './globals.css';

export const metadata = {
  title: ${JSON.stringify(context.title)},
  description: ${JSON.stringify(context.description)}
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href=${JSON.stringify(context.pair.googleFonts || '')} rel="stylesheet" />
      </head>
      <body>
        {children}
        <script src="/scripts/system.js" defer />
        <script src="/scripts/motion.js" defer />
        <script src="/scripts/forms.js" defer />
      </body>
    </html>
  );
}
`);
  fs.writeFileSync(path.join(target, 'app/page.jsx'), `import { pageContent } from '../src/page-content.js';

export default function Page() {
  return <div className="framework-root" dangerouslySetInnerHTML={{ __html: pageContent }} />;
}
`);
  fs.writeFileSync(path.join(target, 'next.config.mjs'), `const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true
};

export default nextConfig;
`);
  fs.writeFileSync(path.join(target, 'package.json'), packageJson(slugify(context.name), {
    next: '^15.1.0',
    react: '^19.0.0',
    'react-dom': '^19.0.0'
  }, {}, { dev: 'next dev', build: 'next build', start: 'next start' }));
  copySharedAssets(target, { niche: context.niche, publicRoot: path.join(target, 'public') });
  return {
    run: '```bash\nnpm install\nnpm run dev\n```',
    build: '```bash\nnpm install\nnpm run build\npython3 -m http.server 4173 --directory out\n```'
  };
}

function writeVueStack(target, context) {
  writeFrameworkStyles(target, context.palette, context.pair, 'src/styles');
  copyTree(path.join(STARTER, 'scripts'), path.join(target, 'public/scripts'), rel => rel.endsWith('.js'));
  ensureDir(path.join(target, 'src'));
  fs.writeFileSync(path.join(target, 'src/page-content.js'), pageModule(context.content));
  fs.writeFileSync(path.join(target, 'index.html'), htmlShell(context));
  fs.writeFileSync(path.join(target, 'src/main.js'), `import { createApp } from 'vue';
import App from './App.vue';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/motion.css';

document.documentElement.classList.add('has-js');
createApp(App).mount('#root');
`);
  fs.writeFileSync(path.join(target, 'src/App.vue'), `<script setup>
import { pageContent } from './page-content.js';
</script>

<template>
  <div class="framework-root" v-html="pageContent"></div>
</template>

<style>
.framework-root { display: contents; }
</style>
`);
  fs.writeFileSync(path.join(target, 'package.json'), packageJson(slugify(context.name), {
    vue: '^3.5.13'
  }, {
    '@vitejs/plugin-vue': '^5.2.1',
    vite: '^6.0.0'
  }, { dev: 'vite', build: 'vite build', preview: 'vite preview' }));
  writeViteConfig(target, "import vue from '@vitejs/plugin-vue';", 'vue()');
  copySharedAssets(target, { niche: context.niche, publicRoot: path.join(target, 'public') });
  return {
    run: '```bash\nnpm install\nnpm run dev\n```',
    build: '```bash\nnpm install\nnpm run build\npython3 -m http.server 4173 --directory dist\n```'
  };
}

function writeSvelteStack(target, context) {
  writeFrameworkStyles(target, context.palette, context.pair, 'src/styles');
  copyTree(path.join(STARTER, 'scripts'), path.join(target, 'public/scripts'), rel => rel.endsWith('.js'));
  ensureDir(path.join(target, 'src'));
  fs.writeFileSync(path.join(target, 'src/page-content.js'), pageModule(context.content));
  fs.writeFileSync(path.join(target, 'index.html'), htmlShell(context));
  fs.writeFileSync(path.join(target, 'src/main.js'), `import { mount } from 'svelte';
import App from './App.svelte';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/motion.css';

document.documentElement.classList.add('has-js');
const app = mount(App, { target: document.getElementById('root') });
export default app;
`);
  fs.writeFileSync(path.join(target, 'src/App.svelte'), `<script>
  import { pageContent } from './page-content.js';
</script>

<div class="framework-root">{@html pageContent}</div>

<style>
  :global(.framework-root) { display: contents; }
</style>
`);
  fs.writeFileSync(path.join(target, 'svelte.config.js'), `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default { preprocess: vitePreprocess() };
`);
  fs.writeFileSync(path.join(target, 'package.json'), packageJson(slugify(context.name), {
    svelte: '^5.16.0'
  }, {
    '@sveltejs/vite-plugin-svelte': '^5.0.3',
    vite: '^6.0.0'
  }, { dev: 'vite', build: 'vite build', preview: 'vite preview' }));
  writeViteConfig(target, "import { svelte } from '@sveltejs/vite-plugin-svelte';", 'svelte()');
  copySharedAssets(target, { niche: context.niche, publicRoot: path.join(target, 'public') });
  return {
    run: '```bash\nnpm install\nnpm run dev\n```',
    build: '```bash\nnpm install\nnpm run build\npython3 -m http.server 4173 --directory dist\n```'
  };
}

function writeAstroStack(target, context) {
  writeFrameworkStyles(target, context.palette, context.pair, 'src/styles');
  copyTree(path.join(STARTER, 'scripts'), path.join(target, 'public/scripts'), rel => rel.endsWith('.js'));
  ensureDir(path.join(target, 'src/layouts'));
  ensureDir(path.join(target, 'src/pages'));
  fs.writeFileSync(path.join(target, 'src/page-content.js'), pageModule(context.content));
  fs.writeFileSync(path.join(target, 'src/layouts/Base.astro'), `---
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/motion.css';

const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href={${JSON.stringify(context.pair.googleFonts || '')}} rel="stylesheet" />
    <script is:inline>document.documentElement.classList.add('has-js');</script>
  </head>
  <body>
    <slot />
    <script is:inline src="/scripts/system.js"></script>
    <script is:inline src="/scripts/motion.js"></script>
    <script is:inline src="/scripts/forms.js"></script>
  </body>
</html>
`);
  fs.writeFileSync(path.join(target, 'src/pages/index.astro'), `---
import Base from '../layouts/Base.astro';
import { pageContent } from '../page-content.js';
---
<Base title=${JSON.stringify(context.title)} description=${JSON.stringify(context.description)}>
  <div class="framework-root" set:html={pageContent} />
</Base>

<style>
  .framework-root { display: contents; }
</style>
`);
  fs.writeFileSync(path.join(target, 'astro.config.mjs'), `import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: { format: 'directory' }
});
`);
  fs.writeFileSync(path.join(target, 'package.json'), packageJson(slugify(context.name), {
    astro: '^5.1.0'
  }, {}, { dev: 'astro dev', build: 'astro build', preview: 'astro preview' }));
  copySharedAssets(target, { niche: context.niche, publicRoot: path.join(target, 'public') });
  return {
    run: '```bash\nnpm install\nnpm run dev\n```',
    build: '```bash\nnpm install\nnpm run build\npython3 -m http.server 4173 --directory dist\n```'
  };
}

function writeTailwindStack(target, context) {
  const { palette, pair } = context;
  ensureDir(path.join(target, 'src'));
  fs.writeFileSync(path.join(target, 'src/app.css'), `@import "tailwindcss";

@theme {
  --color-paper: ${palette.bg};
  --color-surface: ${palette.surface};
  --color-ink: ${palette.ink};
  --color-muted: ${palette.muted};
  --color-line: ${mix(palette.ink, palette.bg, 0.16)};
  --color-accent: ${palette.accent};
  --color-accent-ink: ${palette.accentInk};
  --font-sans: "${pair.text?.family || 'DM Sans'}", ui-sans-serif, system-ui, sans-serif;
  --font-display: "${pair.display?.family || 'Fraunces'}", Georgia, serif;
  --font-mono: "${pair.mono?.family || 'SFMono-Regular'}", ui-monospace, monospace;
  --radius-card: 1rem;
}

@layer base {
  html { color-scheme: ${String(palette.mode || '').toLowerCase() === 'dark' ? 'dark' : 'light'}; }
  body { background: var(--color-paper); color: var(--color-ink); font-family: var(--font-sans); }
  :focus-visible { outline: 3px solid var(--color-accent); outline-offset: 3px; }
}

@layer components {
  .wrap { width: min(calc(100% - 3rem), 80rem); margin-inline: auto; }
  .display { font-family: var(--font-display); letter-spacing: -0.035em; line-height: 0.98; }
  .display-hero { font-size: clamp(3.25rem, 8vw, 7rem); }
  .measure { max-width: 62ch; }
  .measure-tight { max-width: 34ch; }
  .measure-heading { max-width: 20ch; }
  .button-primary {
    display: inline-flex; min-height: 3rem; align-items: center; justify-content: center;
    border-radius: 999px; background: var(--color-ink); padding: 0.8rem 1.35rem;
    color: var(--color-paper); font-size: 0.875rem; font-weight: 600; text-decoration: none;
  }
  .button-primary:hover { background: var(--color-accent); color: var(--color-accent-ink); }
  .button-secondary {
    display: inline-flex; min-height: 3rem; align-items: center; justify-content: center;
    border: 1px solid var(--color-line); border-radius: 999px; padding: 0.8rem 1.35rem;
    color: var(--color-ink); font-size: 0.875rem; font-weight: 600; text-decoration: none;
  }
  .card { border: 1px solid var(--color-line); border-radius: var(--radius-card); background: var(--color-surface); padding: 1.5rem; }
  .kicker { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-muted); }
}
`);

  const tailwindMedia = heroLayoutFor(context.hero) === 'media';
  const tailwindPhoto = tailwindMedia
    ? selectPhoto(readJson(path.join(skillRoot, 'assets/photos/manifest.json'), { assets: [] }), context.niche)
    : null;
  const tailwindHeroKey = String(context.hero).toLowerCase() === 'collage' ? 'photo' : String(context.hero).toLowerCase();
  const heroClasses = tailwindMedia
    ? `hero hero--media hero--${tailwindHeroKey} relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-black pb-16 pt-32 text-white`
    : 'hero flex min-h-svh flex-col justify-center pb-16 pt-32';
  const heroMedia = tailwindMedia && tailwindPhoto
    ? `      <img class="absolute inset-0 -z-20 h-full w-full object-cover opacity-60" src="/assets/photos/${tailwindPhoto.path}" width="${tailwindPhoto.width}" height="${tailwindPhoto.height}" alt="${escapeHtml(tailwindPhoto.alt || '')}" data-source="library" data-subject="${escapeHtml(tailwindPhoto.subject || '')}" loading="eager">
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/55 to-black/20" aria-hidden="true"></div>
`
    : '';
  const heroCopyClasses = tailwindMedia ? 'lg:col-span-8' : 'lg:col-span-7';
  const heroKickerClass = tailwindMedia ? 'kicker text-white/75' : 'kicker';
  const heroLedeClass = tailwindMedia ? 'measure mt-6 text-lg text-white/80' : 'measure mt-6 text-lg text-muted';
  const heroSecondaryClass = tailwindMedia ? 'button-secondary border-white/40 text-white' : 'button-secondary';
  const heroAside = tailwindMedia
    ? ''
    : `        <div class="lg:col-span-5">
          <div class="card">
            <p class="kicker">This week</p>
            <ol class="mt-5 grid gap-4">
              <li class="flex gap-3 border-b border-line pb-4"><span class="font-mono text-xs text-muted">MON</span><span>Scope the decision</span></li>
              <li class="flex gap-3 border-b border-line pb-4"><span class="font-mono text-xs text-muted">WED</span><span>Build the interface</span></li>
              <li class="flex gap-3"><span class="font-mono text-xs text-muted">FRI</span><span>Verify and hand off</span></li>
            </ol>
          </div>
        </div>
`;

  fs.writeFileSync(path.join(target, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(context.description)}">
  <title>${escapeHtml(context.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${escapeHtml(pair.googleFonts || '')}" rel="stylesheet">
  <link rel="stylesheet" href="/src/app.css">
</head>
<body class="antialiased">
  <a class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-paper" href="#main">Skip to content</a>

  <header class="absolute inset-x-0 top-0 z-40">
    <nav class="wrap flex min-h-20 items-center gap-4 border-b border-line" aria-label="Primary">
      <a class="display text-xl" href="#top">${escapeHtml(context.name)}</a>
      <ul class="ml-auto hidden items-center gap-6 md:flex">
        <li><a class="text-sm text-muted hover:text-ink" href="#work">Work</a></li>
        <li><a class="text-sm text-muted hover:text-ink" href="#method">Method</a></li>
        <li><a class="text-sm text-muted hover:text-ink" href="#contact">Contact</a></li>
      </ul>
      <a class="button-primary ml-auto md:ml-4" href="#contact">Start a project</a>
    </nav>
  </header>

  <main id="main">
    <section id="top" class="${heroClasses}" data-fdm-hero>
${heroMedia}      <div class="wrap relative z-10 grid gap-12 lg:grid-cols-12 lg:items-center">
        <div class="${heroCopyClasses}">
          <p class="${heroKickerClass}">${escapeHtml(pair.name || pair.display?.family || 'Interface system')} · ${escapeHtml(palette.name)}</p>
          <h1 class="display display-hero mt-5">${escapeHtml(context.name)} makes the next step obvious.</h1>
          <p class="${heroLedeClass}">A focused working page built from the assigned palette and type pairing. Replace this sentence with the client's real offer, audience and primary action.</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a class="button-primary" href="#contact">Book a working session</a>
            <a class="${heroSecondaryClass}" href="#work">See the method</a>
          </div>
        </div>
${heroAside}      </div>
    </section>

    <section id="work" class="border-t border-line py-24" data-fdm-section aria-labelledby="work-title">
      <div class="wrap">
        <h2 id="work-title" class="display measure-heading text-4xl">Three moves, one system.</h2>
        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <article class="card"><p class="kicker">01 · Direction</p><h3 class="mt-4 text-2xl">Lock one visual idea.</h3><p class="mt-3 text-muted">Palette, type roles and spacing are decided before the first section is built.</p></article>
          <article class="card"><p class="kicker">02 · Structure</p><h3 class="mt-4 text-2xl">Give each section one job.</h3><p class="mt-3 text-muted">Every block owns a single idea, a real visual and a screen budget.</p></article>
          <article class="card"><p class="kicker">03 · Evidence</p><h3 class="mt-4 text-2xl">Check it in the browser.</h3><p class="mt-3 text-muted">Layout, type, contrast, motion and copy are measured at every viewport.</p></article>
        </div>
      </div>
    </section>

    <section id="method" class="border-t border-line py-24" data-fdm-section aria-labelledby="method-title">
      <div class="wrap grid gap-10 lg:grid-cols-12">
        <div class="lg:col-span-5"><h2 id="method-title" class="display text-4xl">Start with the constraint.</h2></div>
        <div class="lg:col-span-7"><p class="measure text-lg">A good page is not a pile of components. It is a clear offer, a real visual argument and a reading rhythm that survives a phone. The system is small on purpose: one container, one grid, one button family and one section heading.</p><a class="button-primary mt-8" href="#contact">Send the brief</a></div>
      </div>
    </section>

    <section id="contact" class="border-t border-line py-24" data-fdm-section aria-labelledby="contact-title">
      <div class="wrap">
        <h2 id="contact-title" class="display measure-heading text-4xl">Bring the part that feels stuck.</h2>
        <p class="measure mt-5 text-lg text-muted">A short note is enough. Include the audience, the deadline and the decision you need to make.</p>
        <a class="button-primary mt-8" href="mailto:hello@${slugify(context.name)}.example">Email the studio</a>
      </div>
    </section>
  </main>

  <footer class="border-t border-line py-10">
    <div class="wrap flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
      <p>© 2026 ${escapeHtml(context.name)}. Demo content.</p>
      <p>Built with frontend-design-skills.</p>
    </div>
  </footer>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`);
  fs.writeFileSync(path.join(target, 'src/main.js'), `/* Progressive enhancement only: the page reads without JavaScript. */
const toggle = document.querySelector('[data-nav-toggle]');
const menu = document.querySelector('[data-nav-menu]');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.toggleAttribute('data-open', !open);
  });
}
`);
  fs.writeFileSync(path.join(target, 'vite.config.js'), `import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({ plugins: [tailwindcss()] });
`);
  fs.writeFileSync(path.join(target, 'package.json'), packageJson(slugify(context.name), {}, {
    '@tailwindcss/vite': '^4.0.0',
    tailwindcss: '^4.0.0',
    vite: '^6.0.0'
  }, { dev: 'vite', build: 'vite build', preview: 'vite preview' }));
  copySharedAssets(target, { niche: context.niche, publicRoot: path.join(target, 'public') });
  return {
    run: '```bash\nnpm install\nnpm run dev\n```',
    build: '```bash\nnpm install\nnpm run build\npython3 -m http.server 4173 --directory dist\n```'
  };
}

const WRITERS = {
  html: writeHtmlStack,
  react: writeReactStack,
  next: writeNextStack,
  vue: writeVueStack,
  svelte: writeSvelteStack,
  astro: writeAstroStack,
  tailwind: writeTailwindStack
};

export function scaffold(options = {}) {
  const stack = String(options.stack || 'html').toLowerCase();
  if (!STACKS.includes(stack)) throw new Error(`unknown stack "${stack}". Use one of: ${STACKS.join(', ')}`);
  const niche = options.niche || 'software';
  const target = path.resolve(options.dir || './site');
  const force = Boolean(options.force);

  if (fs.existsSync(target) && fs.readdirSync(target).length && !force) {
    throw new Error(`target is not empty: ${target}. Use --force to write into it.`);
  }
  ensureDir(target);

  const direction = assign({
    niche,
    seed: options.seed || `${path.basename(target)}-${Date.now()}`,
    motion: options.motion,
    useHistory: false
  });
  const { palettes, typePairs } = loadLibraries();
  const palette = options.palette
    ? palettes.find(item => item.id === options.palette)
    : direction.paletteData;
  const pair = options.typePair
    ? typePairs.find(item => item.id === options.typePair)
    : direction.typePairData;
  if (!palette) throw new Error(`unknown palette "${options.palette}"`);
  if (!pair) throw new Error(`unknown type pairing "${options.typePair}"`);

  const hero = options.hero || direction.hero;
  // A palette or type override must also update the lock, the rationale and the
  // generated README. Otherwise the project contradicts its own art direction.
  const resolved = {
    ...direction,
    palette: palette.id,
    typePair: pair.id,
    hero,
    heroLayout: heroLayoutFor(hero),
    paletteData: palette,
    typePairData: pair
  };
  if (options.palette || options.typePair || options.hero) {
    resolved.rationale = `${palette.name}: ${palette.note} ${pair.name}: ${pair.suits} Hero "${hero}" with a ${direction.density} density, ${direction.motionTier} motion tier and a ${direction.composition} composition.`;
  }

  const name = String(options.name || 'Morrow Studio').trim() || 'Morrow Studio';
  const slug = slugify(options.slug || name);
  const title = options.title || `${name} — A working page`;
  const description = options.description || `${name} is a working page built with one locked palette, one type pairing and browser-verified layout, copy and accessibility.`;
  const starterHtml = readStarter('index.html');
  const context = {
    stack, niche, target, direction: resolved, palette, pair, name, slug, title, description, brand: name, hero: resolved.hero,
    content: contentFor(starterHtml, { title, description, fonts: pair, brand: name, slug, hero: resolved.hero, niche })
  };

  const commands = WRITERS[stack](target, context);

  writeJson(path.join(target, '.frontend-design-skills/art-direction.json'), {
    skill: 'frontend-design-skills',
    version: 1,
    stack,
    niche,
    palette: palette.id,
    typePair: pair.id,
    hero,
    heroLayout: resolved.heroLayout,
    motionTier: resolved.motionTier,
    density: resolved.density,
    composition: resolved.composition,
    effects: resolved.effects,
    rationale: resolved.rationale,
    seed: options.seed || resolved.seed,
    assignedAt: new Date().toISOString(),
    paletteData: palette,
    typePairData: pair
  });
  fs.writeFileSync(path.join(target, 'README.md'), readmeFor({ stack, name, niche, direction: resolved, commands }));
  fs.writeFileSync(path.join(target, '.gitignore'), 'node_modules/\ndist/\nout/\n.next/\n.frontend-design-skills/*\n!.frontend-design-skills/art-direction.json\n!.frontend-design-skills/waivers.json\n!.frontend-design-skills/runs/\n');

  return { target, stack, niche, palette: palette.id, typePair: pair.id, name, direction: resolved, commands };
}

export function parseArgs(argv) {
  const args = {
    stack: 'html', dir: './site', niche: 'software', seed: '', name: '', slug: '',
    title: '', description: '', palette: '', typePair: '', hero: '', motion: '',
    force: false, json: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--stack' || a === '--framework') args.stack = argv[++i];
    else if (a === '--dir' || a === '--out') args.dir = argv[++i];
    else if (a === '--niche' || a === '--kind') args.niche = argv[++i];
    else if (a === '--seed') args.seed = argv[++i];
    else if (a === '--name') args.name = argv[++i];
    else if (a === '--slug') args.slug = argv[++i];
    else if (a === '--title') args.title = argv[++i];
    else if (a === '--description') args.description = argv[++i];
    else if (a === '--palette') args.palette = argv[++i];
    else if (a === '--type-pair') args.typePair = argv[++i];
    else if (a === '--hero') args.hero = argv[++i];
    else if (a === '--motion') args.motion = argv[++i];
    else if (a === '--force') args.force = true;
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`usage: scaffold.mjs --stack <${STACKS.join('|')}> --dir ./site [--niche software]
       [--seed text] [--name "Studio"] [--palette id] [--type-pair id]
       [--hero split] [--motion T0|T1|T2] [--force] [--json]`);
    process.exit(0);
  }
  try {
    const result = scaffold(args);
    if (args.json) {
      console.log(JSON.stringify({
        target: result.target,
        stack: result.stack,
        niche: result.niche,
        palette: result.palette,
        typePair: result.typePair,
        name: result.name
      }, null, 2));
    } else {
      console.log(`frontend-design-skills scaffold`);
      console.log(`target:    ${result.target}`);
      console.log(`stack:     ${STACK_LABEL[result.stack]}`);
      console.log(`niche:     ${result.niche}`);
      console.log(`palette:   ${result.palette}`);
      console.log(`type pair: ${result.typePair}`);
      console.log(`direction: ${path.join(result.target, '.frontend-design-skills/art-direction.json')}`);
      console.log('');
      console.log(result.commands.run.replace(/```bash\n|```/g, '').trim());
    }
  } catch (error) {
    console.error(`scaffold: ${error.message}`);
    process.exit(1);
  }
}

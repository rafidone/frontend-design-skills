// Colour helpers shared by the assignment validator, asset checks and unit tests.

export function parseColor(value) {
  if (!value) return null;
  const input = String(value).trim();
  const hex = input.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let raw = hex[1];
    if (raw.length === 3 || raw.length === 4) raw = raw.split('').map(c => c + c).join('');
    if (raw.length !== 6 && raw.length !== 8) return null;
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
      a: raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1
    };
  }
  const rgb = input.match(/rgba?\(([^)]+)\)/i);
  if (!rgb) return null;
  const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

export function relativeLuminance(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  if (!c) return null;
  const channel = value => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

export function hueSaturation(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  if (!c) return null;
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  const light = (max + min) / 2;
  if (delta < 0.02) return { hue: 0, saturation: 0, light };
  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  const saturation = delta / (1 - Math.abs(2 * light - 1) || 1);
  return { hue: Math.round(hue), saturation: Math.round(saturation * 100) / 100, light: Math.round(light * 100) / 100 };
}

export function isViolet(color) {
  const hsl = hueSaturation(color);
  if (!hsl) return false;
  // The violet and lavender band starts just above indigo. A blue accent sits
  // around hue 220-245, while lavender tints commonly land at 250-265.
  return hsl.hue >= 250 && hsl.hue <= 340 && hsl.saturation >= 0.2 && hsl.light >= 0.15 && hsl.light <= 0.93;
}

export function generateScale(hex) {
  const base = parseColor(hex);
  if (!base) return null;
  const hsl = hueSaturation(base);
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return Object.fromEntries(steps.map(step => [step, `hsl(${hsl.hue} ${Math.round(hsl.saturation * 100)}% ${Math.max(5, Math.min(97, 96 - step * 0.1))}%)`]));
}

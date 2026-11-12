import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Optional image statistics. ffmpeg is not required for the audits, but when it
// exists this gives a reliable answer for "is this visual actually blank?".
export function ffmpegAvailable() {
  return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}

export function pngStats(buffer) {
  if (!ffmpegAvailable() || !buffer?.length) return null;
  const tmp = path.join(os.tmpdir(), `fdm-${process.pid}-${Date.now()}.png`);
  fs.writeFileSync(tmp, buffer);
  try {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-i', tmp, '-vf', 'scale=48:48', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 8 * 1024 * 1024 });
    if (r.status !== 0 || !r.stdout?.length) return null;
    const data = r.stdout;
    let n = 0, sum = 0, sum2 = 0;
    const colors = new Set();
    for (let i = 0; i + 2 < data.length; i += 3) {
      const r0 = data[i], g0 = data[i + 1], b0 = data[i + 2];
      const y = 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0;
      sum += y; sum2 += y * y; n++;
      colors.add(`${r0 >> 4},${g0 >> 4},${b0 >> 4}`);
    }
    const mean = sum / Math.max(1, n);
    const variance = Math.max(0, sum2 / Math.max(1, n) - mean * mean);
    return { mean: Math.round(mean), variance: Math.round(variance), colors: colors.size, samples: n };
  } finally {
    try { fs.rmSync(tmp, { force: true }); } catch { /* ignore */ }
  }
}

export function isLikelyBlank(stats) {
  if (!stats) return false;
  return stats.colors <= 2 || stats.variance < 6;
}

// Minimal WebP header reader. Kept dependency-free so manifest verification
// works on a fresh machine with no image tooling installed.
export function webpSize(buffer) {
  if (!buffer || buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { width, height, format: 'webp', variant: 'VP8X' };
  }
  if (chunk === 'VP8 ') {
    const width = (buffer[26] | (buffer[27] << 8)) & 0x3fff;
    const height = (buffer[28] | (buffer[29] << 8)) & 0x3fff;
    return { width, height, format: 'webp', variant: 'VP8' };
  }
  if (chunk === 'VP8L') {
    if (buffer[20] !== 0x2f) return null;
    const b = buffer;
    const width = 1 + (((b[22] & 0x3f) << 8) | b[21]);
    const height = 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6));
    return { width, height, format: 'webp', variant: 'VP8L' };
  }
  return null;
}

export function imageSize(buffer, extension = '') {
  const ext = String(extension).toLowerCase().replace(/^\./, '');
  if (ext === 'webp') return webpSize(buffer);
  if (ext === 'png' && buffer?.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), format: 'png' };
  }
  if ((ext === 'jpg' || ext === 'jpeg') && buffer) {
    for (let i = 2; i + 9 < buffer.length; i++) {
      if (buffer[i] !== 0xff) continue;
      const marker = buffer[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5), format: 'jpeg' };
      }
    }
  }
  return null;
}

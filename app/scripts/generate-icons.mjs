/**
 * generate-icons.mjs — Render the app icons from the vector sources in brand/.
 *
 * Usage: node scripts/generate-icons.mjs   (requires the "sharp" devDependency)
 *
 * Sources:  brand/icon.svg           → public/icons/icon-192.png, icon-512.png
 *           brand/icon-maskable.svg  → public/icons/icon-maskable-512.png
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const jobs = [
  { src: 'brand/icon.svg', out: 'public/icons/icon-192.png', size: 192 },
  { src: 'brand/icon.svg', out: 'public/icons/icon-512.png', size: 512 },
  { src: 'brand/icon-maskable.svg', out: 'public/icons/icon-maskable-512.png', size: 512 },
];

for (const { src, out, size } of jobs) {
  // Render oversized (density 288 ≈ 4×) then downscale: crisper edges.
  await sharp(path.join(root, src), { density: 288 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, out));
  console.log(`✓ ${out}`);
}

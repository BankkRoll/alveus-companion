/**
 * Generates PNG icons for the Chrome extension from the SVG source.
 * Run with: node scripts/generate-icons.mjs
 */
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icon.svg");
const outDir = join(root, "public", "icon");

const SIZES = [16, 32, 48, 128];

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

for (const size of SIZES) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `${size}.png`));
  console.log(`Generated icon/${size}.png`);
}

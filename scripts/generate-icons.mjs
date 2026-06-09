import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "public", "icons", "source.png");
const OUT_DIR = join(ROOT, "public", "icons");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const outPath = join(OUT_DIR, `icon-${size}x${size}.png`);
  await sharp(SOURCE).resize(size, size).toFile(outPath);
  console.log(`✓ icon-${size}x${size}.png`);
}

console.log("✅ All icons generated");

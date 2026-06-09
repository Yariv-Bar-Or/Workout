import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");
const OUT_FILE = join(OUT_DIR, "source.png");

mkdirSync(OUT_DIR, { recursive: true });

const SIZE = 1024;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#1a1a1a";
ctx.fillRect(0, 0, SIZE, SIZE);

// Centered emoji
ctx.font = "600px serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillStyle = "#ffffff";
ctx.fillText("🏋️", SIZE / 2, SIZE / 2);

writeFileSync(OUT_FILE, canvas.toBuffer("image/png"));
console.log("✓ source.png written to public/icons/source.png");

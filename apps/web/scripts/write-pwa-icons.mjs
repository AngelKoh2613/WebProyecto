import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const iconsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/icons",
);

const blue = [37, 99, 235, 255];
const white = [248, 250, 252, 255];
const canvas = [244, 247, 251, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function png(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function fill(pixels, size, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(pixels, size, x, y, color);
  }
}

function fillRoundRect(pixels, size, x0, y0, x1, y1, radius, color) {
  const left = Math.round(x0);
  const top = Math.round(y0);
  const right = Math.round(x1);
  const bottom = Math.round(y1);
  const r = Math.round(radius);
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const dx =
        x < left + r ? left + r - x : x >= right - r ? x - (right - r - 1) : 0;
      const dy =
        y < top + r ? top + r - y : y >= bottom - r ? y - (bottom - r - 1) : 0;
      if (dx * dx + dy * dy <= r * r) setPixel(pixels, size, x, y, color);
    }
  }
}

function fillCircle(pixels, size, cx, cy, radius, color) {
  const r = Math.round(radius);
  const centerX = Math.round(cx);
  const centerY = Math.round(cy);
  for (let y = centerY - r; y <= centerY + r; y += 1) {
    for (let x = centerX - r; x <= centerX + r; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= r * r) setPixel(pixels, size, x, y, color);
    }
  }
}

function draw(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  fill(pixels, size, maskable ? blue : canvas);
  const plate = maskable ? size * 0.18 : size * 0.12;
  fillRoundRect(
    pixels,
    size,
    plate,
    plate,
    size - plate,
    size - plate,
    size * 0.18,
    blue,
  );
  fillCircle(pixels, size, size * 0.5, size * 0.38, size * 0.12, white);
  fillCircle(pixels, size, size * 0.5, size * 0.38, size * 0.055, blue);
  fillRoundRect(
    pixels,
    size,
    size * 0.44,
    size * 0.42,
    size * 0.56,
    size * 0.74,
    size * 0.04,
    white,
  );
  return png(size, size, pixels);
}

mkdirSync(iconsDir, { recursive: true });
writeFileSync(path.join(iconsDir, "icon-192.png"), draw(192, false));
writeFileSync(path.join(iconsDir, "icon-512.png"), draw(512, false));
writeFileSync(path.join(iconsDir, "icon-maskable-192.png"), draw(192, true));
writeFileSync(path.join(iconsDir, "icon-maskable-512.png"), draw(512, true));

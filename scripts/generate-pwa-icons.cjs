const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const publicDir = path.join(__dirname, '..', 'public');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function fillRect(pixels, width, x, y, rectWidth, rectHeight, rgba) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let col = x; col < x + rectWidth; col += 1) {
      if (row < 0 || row >= width || col < 0 || col >= width) continue;
      const index = (row * width + col) * 4;
      pixels[index] = rgba[0];
      pixels[index + 1] = rgba[1];
      pixels[index + 2] = rgba[2];
      pixels[index + 3] = rgba[3];
    }
  }
}

function drawCircle(pixels, width, centerX, centerY, radius, rgba) {
  const radiusSquared = radius * radius;
  for (let row = centerY - radius; row <= centerY + radius; row += 1) {
    for (let col = centerX - radius; col <= centerX + radius; col += 1) {
      const dx = col - centerX;
      const dy = row - centerY;
      if (dx * dx + dy * dy > radiusSquared) continue;
      if (row < 0 || row >= width || col < 0 || col >= width) continue;
      const index = (row * width + col) * 4;
      pixels[index] = rgba[0];
      pixels[index + 1] = rgba[1];
      pixels[index + 2] = rgba[2];
      pixels[index + 3] = rgba[3];
    }
  }
}

function edge(pointA, pointB, pointC) {
  return (pointC.x - pointA.x) * (pointB.y - pointA.y) - (pointC.y - pointA.y) * (pointB.x - pointA.x);
}

function drawTriangle(pixels, width, points, rgba) {
  const minX = Math.max(0, Math.floor(Math.min(...points.map((point) => point.x))));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(...points.map((point) => point.x))));
  const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point.y))));
  const maxY = Math.min(width - 1, Math.ceil(Math.max(...points.map((point) => point.y))));
  const area = edge(points[0], points[1], points[2]);

  for (let row = minY; row <= maxY; row += 1) {
    for (let col = minX; col <= maxX; col += 1) {
      const point = { x: col + 0.5, y: row + 0.5 };
      const w0 = edge(points[1], points[2], point);
      const w1 = edge(points[2], points[0], point);
      const w2 = edge(points[0], points[1], point);
      if ((area >= 0 && w0 >= 0 && w1 >= 0 && w2 >= 0) || (area < 0 && w0 <= 0 && w1 <= 0 && w2 <= 0)) {
        const index = (row * width + col) * 4;
        pixels[index] = rgba[0];
        pixels[index + 1] = rgba[1];
        pixels[index + 2] = rgba[2];
        pixels[index + 3] = rgba[3];
      }
    }
  }
}

function drawIcon(size, destination, maskable = false) {
  const pixels = Buffer.alloc(size * size * 4);
  const ink = [23, 40, 36, 255];
  const lime = [201, 246, 111, 255];
  const paper = [243, 241, 234, 255];
  const margin = maskable ? Math.round(size * 0.16) : 0;

  fillRect(pixels, size, 0, 0, size, size, ink);
  drawTriangle(pixels, size, [
    { x: margin + size * 0.14, y: size * 0.68 },
    { x: size * 0.45, y: margin + size * 0.25 },
    { x: size * 0.64, y: size * 0.68 },
  ], lime);
  drawTriangle(pixels, size, [
    { x: size * 0.45, y: size * 0.68 },
    { x: size * 0.62, y: size * 0.45 },
    { x: size - margin - size * 0.16, y: size * 0.68 },
  ], lime);
  drawCircle(pixels, size, Math.round(size * 0.7), Math.round(size * 0.27), Math.round(size * 0.075), paper);

  const scanlines = [];
  for (let row = 0; row < size; row += 1) {
    scanlines.push(Buffer.from([0]));
    scanlines.push(pixels.subarray(row * size * 4, (row + 1) * size * 4));
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(scanlines))),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(publicDir, destination), png);
}

fs.mkdirSync(publicDir, { recursive: true });
drawIcon(192, 'icon-192.png');
drawIcon(512, 'icon-512.png');
drawIcon(512, 'icon-maskable-512.png', true);
drawIcon(180, 'apple-touch-icon.png');

console.log('Generated PWA icons');

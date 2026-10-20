const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, colorFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }
  const idat = zlib.deflateSync(raw);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', iend),
  ]);
}

// Distance from point (px, py) to line segment (ax, ay) -> (bx, by)
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const qx = px - projX;
  const qy = py - projY;
  return Math.sqrt(qx * qx + qy * qy);
}

// Minimalist, Clean, High-End Fintech Monogram Icon (Nubank / Revolut / Brex aesthetic)
function renderModernFinanceIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates: center is (0, 0), spans from -1 to 1
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Background Gradient: Deep Luxury Midnight Navy (#080d1a to #131d33)
  const bgT = (ny + 1) * 0.5;
  let bgR = Math.round(8 + bgT * 11);
  let bgG = Math.round(13 + bgT * 16);
  let bgB = Math.round(26 + bgT * 25);
  let bgA = 255;

  // Subtle radial center ambient glow
  const radialDist = Math.sqrt(nx * nx + (ny + 0.1) * (ny + 0.1));
  if (radialDist < 0.85) {
    const glow = (1 - radialDist / 0.85) * 0.15;
    bgR = Math.min(255, Math.round(bgR + 37 * glow * 255 / 100));
    bgG = Math.min(255, Math.round(bgG + 99 * glow * 255 / 100));
    bgB = Math.min(255, Math.round(bgB + 235 * glow * 255 / 100));
  }

  // Squircle corner check for non-maskable icons
  if (!isMaskable) {
    const absX = Math.abs(nx);
    const absY = Math.abs(ny);
    // Smooth superellipse formula: |x|^4.2 + |y|^4.2 <= 0.88^4.2
    const p = 4.2;
    const squircle = Math.pow(absX, p) + Math.pow(absY, p);
    if (squircle > 0.65) {
      // Antialiased edge
      const edge = (squircle - 0.65) / 0.08;
      if (edge >= 1.0) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
      bgA = Math.round(255 * (1 - edge));
    }
  }

  // Scale emblem inside safe zone (0.65 for maskable, 0.76 for standard)
  const scale = isMaskable ? 0.62 : 0.74;
  const ex = nx / scale;
  const ey = ny / scale;

  // Modern Geometric Fintech Emblem:
  // Stylized continuous "M" chevron ribbons with upward financial growth momentum:
  // Leg 1: Left pillar (-0.46, 0.38) -> (-0.46, -0.25)
  // Leg 2: Downward inner slope (-0.46, -0.25) -> (0.0, 0.22)
  // Leg 3: Upward inner slope (0.0, 0.22) -> (0.46, -0.25)
  // Leg 4: Right growth pillar (0.46, -0.25) -> (0.46, 0.38)
  // Plus upward arrow peak / spark node at (0.46, -0.42)
  const thickness = 0.125;

  const d1 = distToSegment(ex, ey, -0.42, 0.38, -0.42, -0.22);
  const d2 = distToSegment(ex, ey, -0.42, -0.22, 0.0, 0.18);
  const d3 = distToSegment(ex, ey, 0.0, 0.18, 0.42, -0.22);
  const d4 = distToSegment(ex, ey, 0.42, -0.22, 0.42, 0.38);

  const minDist = Math.min(d1, d2, d3, d4);

  // Spark / Dot indicator (Growth node in upper right)
  const dotX = ex - 0.42;
  const dotY = ey - (-0.42);
  const dotDist = Math.sqrt(dotX * dotX + dotY * dotY);

  if (minDist <= thickness || dotDist <= 0.09) {
    let emblemR = 37;
    let emblemG = 99;
    let emblemB = 235;

    // Gradient progression across horizontal axis:
    // Left side: Rich Electric Blue (#2563EB -> #38BDF8)
    // Middle: Vibrant Cyan (#06B6D4)
    // Right side: Prosperous Emerald (#10B981)
    const t = (ex + 0.45) / 0.9;
    if (t < 0.5) {
      const subT = t / 0.5;
      emblemR = Math.round(37 + subT * (14 - 37));
      emblemG = Math.round(99 + subT * (165 - 99));
      emblemB = Math.round(235 + subT * (233 - 235));
    } else {
      const subT = (t - 0.5) / 0.5;
      emblemR = Math.round(14 + subT * (16 - 14));
      emblemG = Math.round(165 + subT * (185 - 165));
      emblemB = Math.round(233 + subT * (129 - 233));
    }

    if (dotDist <= 0.09) {
      // Emerald spark with white core
      if (dotDist <= 0.05) {
        emblemR = 255;
        emblemG = 255;
        emblemB = 255;
      } else {
        emblemR = 52;
        emblemG = 211;
        emblemB = 153; // #34d399
      }
    }

    // Smooth Anti-Aliasing on emblem edges
    const delta = (dotDist <= 0.09) ? (dotDist - (0.09 - 0.02)) / 0.02 : (minDist - (thickness - 0.02)) / 0.02;
    if (delta > 0 && delta <= 1.0) {
      const blend = 1 - delta;
      return [
        Math.round(emblemR * blend + bgR * (1 - blend)),
        Math.round(emblemG * blend + bgG * (1 - blend)),
        Math.round(emblemB * blend + bgB * (1 - blend)),
        bgA
      ];
    }

    return [emblemR, emblemG, emblemB, bgA];
  }

  // Subtle circular progress arc in background (like Apple / Nubank credit/savings gauge)
  const ringDist = Math.abs(Math.sqrt(ex * ex + ey * ey) - 0.72);
  if (ringDist <= 0.015 && ey >= -0.2) {
    const alpha = (1 - ringDist / 0.015) * 0.18;
    return [
      Math.min(255, Math.round(bgR + 96 * alpha)),
      Math.min(255, Math.round(bgG + 165 * alpha)),
      Math.min(255, Math.round(bgB + 250 * alpha)),
      bgA
    ];
  }

  return [bgR, bgG, bgB, bgA];
}

// Generate Pristine SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080d1a"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#17233d"/>
    </linearGradient>

    <!-- Financial Ribbon Gradient: Blue -> Cyan -> Emerald -->
    <linearGradient id="finRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="35%" stop-color="#38bdf8"/>
      <stop offset="70%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>

    <!-- Glowing Spark Gradient -->
    <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </radialGradient>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Squircle Base Canvas -->
  <rect width="512" height="512" rx="116" fill="url(#bgGrad)"/>
  <rect width="508" height="508" x="2" y="2" rx="114" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2"/>

  <!-- Subtle Financial Aura Track -->
  <circle cx="256" cy="265" r="172" fill="none" stroke="rgba(56, 189, 248, 0.07)" stroke-width="6" stroke-dasharray="8 8"/>

  <g filter="url(#dropShadow)">
    <!-- Main Geometric 'M' Prosperity Wave -->
    <path
      d="M 152 350 L 152 205 L 256 305 L 360 205 L 360 350"
      fill="none"
      stroke="url(#finRibbon)"
      stroke-width="44"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#softGlow)"
    />

    <!-- Upward Growth Apex Node -->
    <circle cx="360" cy="148" r="22" fill="url(#sparkGlow)"/>
    <circle cx="360" cy="148" r="10" fill="#ffffff"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Generated clean modern icon.svg');

// Generate 192x192 PNG
const png192 = createPng(192, 192, (x, y, w, h) => renderModernFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('Generated pwa-192x192.png');

// Generate 512x512 PNG
const png512 = createPng(512, 512, (x, y, w, h) => renderModernFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('Generated pwa-512x512.png');

// Generate Maskable 512x512 PNG (Android adaptive icon with safe zone)
const pngMaskable = createPng(512, 512, (x, y, w, h) => renderModernFinanceIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);
console.log('Generated pwa-maskable-512x512.png');

// Generate Apple Touch Icon 180x180 PNG
const pngApple = createPng(180, 180, (x, y, w, h) => renderModernFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
console.log('Generated apple-touch-icon.png');

// Generate Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);
console.log('Generated favicon.ico');

console.log('All clean modern PWA icons successfully regenerated!');

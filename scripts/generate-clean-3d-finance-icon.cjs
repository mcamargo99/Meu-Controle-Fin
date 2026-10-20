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
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0;
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
  const qx = px - (ax + t * dx);
  const qy = py - (ay + t * dy);
  return Math.sqrt(qx * qx + qy * qy);
}

// Distance to an arc/curve
function distToDollar(px, py) {
  // Center spine (vertical line)
  const dSpine = distToSegment(px, py, 0.0, -0.52, 0.0, 0.52);

  // Upper loop of $ (from top right, curving left to center)
  // Approximated with 4 high-precision segments
  const d1 = distToSegment(px, py, 0.22, -0.38, 0.0, -0.42);
  const d2 = distToSegment(px, py, 0.0, -0.42, -0.22, -0.34);
  const d3 = distToSegment(px, py, -0.22, -0.34, -0.22, -0.16);
  const d4 = distToSegment(px, py, -0.22, -0.16, 0.0, -0.04);
  
  // Lower loop of $ (from center, curving right to bottom left)
  const d5 = distToSegment(px, py, 0.0, -0.04, 0.22, 0.08);
  const d6 = distToSegment(px, py, 0.22, 0.08, 0.22, 0.28);
  const d7 = distToSegment(px, py, 0.22, 0.28, 0.0, 0.38);
  const d8 = distToSegment(px, py, 0.0, 0.38, -0.22, 0.32);

  const dCurve = Math.min(d1, d2, d3, d4, d5, d6, d7, d8);
  return { dSpine, dCurve, min: Math.min(dSpine * 1.05, dCurve) };
}

function renderPureFinanceIcon(x, y, w, h, isMaskable = false) {
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Obsidian Dark Gradient
  const rDist = Math.sqrt(nx * nx + ny * ny);
  const grad = (ny + 1) * 0.5;
  let bgR = Math.round(8 + grad * 8);
  let bgG = Math.round(11 + grad * 12);
  let bgB = Math.round(10 + grad * 10);
  let bgA = 255;

  // Subtle emerald radial glow in center
  if (rDist < 0.85) {
    const gFactor = Math.pow(1 - rDist / 0.85, 2) * 0.35;
    bgR = Math.min(255, Math.round(bgR + 10 * gFactor));
    bgG = Math.min(255, Math.round(bgG + 210 * gFactor));
    bgB = Math.min(255, Math.round(bgB + 130 * gFactor));
  }

  // Squircle for standard icons
  if (!isMaskable) {
    const p = 4.3;
    const squircle = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);
    if (squircle > 0.65) {
      const edge = (squircle - 0.65) / 0.08;
      if (edge >= 1.0) return [0, 0, 0, 0];
      bgA = Math.round(255 * (1 - edge));
    }
  }

  const scale = isMaskable ? 0.64 : 0.76;
  const ex = nx / scale;
  const ey = ny / scale;

  // 1. Outer 3D Financial Medallion Orbit Ring
  const distOrigin = Math.sqrt(ex * ex + ey * ey);
  if (distOrigin >= 0.74 && distOrigin <= 0.82) {
    const t = (distOrigin - 0.74) / 0.08;
    const ringAlpha = Math.sin(t * Math.PI);
    // 3D light from top-left
    const angle = Math.atan2(ey, ex);
    const light = Math.max(0, -Math.cos(angle - (-2.3)));
    const highlight = Math.pow(light, 4) * 0.7;

    return [
      Math.min(255, Math.round(bgR + (20 + highlight * 220) * ringAlpha)),
      Math.min(255, Math.round(bgG + (190 + highlight * 65) * ringAlpha)),
      Math.min(255, Math.round(bgB + (120 + highlight * 120) * ringAlpha)),
      bgA
    ];
  }

  // 2. Primary 3D Currency Sculptural Emblem
  const { dSpine, dCurve, min: dTotal } = distToDollar(ex, ey);
  const thickness = 0.095;

  if (dTotal <= thickness) {
    // 3D Hemisphere Normal for Specular & Diffuse Light
    const u = Math.min(1.0, dTotal / thickness);
    const z = Math.sqrt(Math.max(0, 1 - u * u));

    // Directional light from top-left (-0.45, -0.6, 0.7)
    const lx = -0.45;
    const ly = -0.60;
    const lz = 0.70;

    // Diffuse
    const diff = Math.max(0.25, z * lz - (ex / 0.4) * lx * 0.3 - (ey / 0.4) * ly * 0.3);

    // Specular (glossy polished glass / emerald sheen)
    const spec = Math.pow(Math.max(0, z * 0.85 - (ex * lx + ey * ly) * 0.5), 14) * 210;

    // Rich money green gradient from top to bottom
    const yProg = (ey + 0.5) / 1.0;
    const baseR = Math.round(0 + yProg * 10);
    const baseG = Math.round(245 - yProg * 50); // Vibrant neon mint at top, deep emerald at bottom
    const baseB = Math.round(140 - yProg * 60);

    let r = Math.min(255, Math.round(baseR * diff + spec));
    let g = Math.min(255, Math.round(baseG * diff + spec));
    let b = Math.min(255, Math.round(baseB * diff + spec));

    // Edge anti-aliasing
    const edgeDist = (dTotal - (thickness - 0.012)) / 0.012;
    if (edgeDist > 0 && edgeDist <= 1.0) {
      const blend = 1 - edgeDist;
      return [
        Math.round(r * blend + bgR * (1 - blend)),
        Math.round(g * blend + bgG * (1 - blend)),
        Math.round(b * blend + bgB * (1 - blend)),
        bgA
      ];
    }

    return [r, g, b, bgA];
  }

  // Soft 3D drop shadow beneath the currency symbol
  const { min: dShadow } = distToDollar(ex, ey - 0.05);
  if (dShadow <= thickness + 0.06) {
    const sFactor = (1 - (dShadow - thickness) / 0.06) * 0.55;
    return [
      Math.max(0, Math.round(bgR * (1 - sFactor))),
      Math.max(0, Math.round(bgG * (1 - sFactor))),
      Math.max(0, Math.round(bgB * (1 - sFactor))),
      bgA
    ];
  }

  return [bgR, bgG, bgB, bgA];
}

// Generate High-Fidelity 3D Vector SVG
const svgPureFinance = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Obsidian Matte Background -->
    <radialGradient id="bgObsidian" cx="50%" cy="32%" r="78%">
      <stop offset="0%" stop-color="#141c19"/>
      <stop offset="40%" stop-color="#0a0f0d"/>
      <stop offset="100%" stop-color="#040605"/>
    </radialGradient>

    <!-- Beveled Edge Gradient for 3D Border -->
    <linearGradient id="bevelRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(16, 185, 129, 0.5)"/>
      <stop offset="35%" stop-color="rgba(255, 255, 255, 0.09)"/>
      <stop offset="100%" stop-color="rgba(0, 230, 118, 0.12)"/>
    </linearGradient>

    <!-- 3D Emerald Money Gradient -->
    <linearGradient id="emeraldCurrency" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#69f0ae"/>
      <stop offset="20%" stop-color="#00e676"/>
      <stop offset="55%" stop-color="#10b981"/>
      <stop offset="85%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>

    <!-- 3D Specular Highlight Overlay -->
    <linearGradient id="specularLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </linearGradient>

    <!-- 3D Realistic Occlusion Drop Shadow -->
    <filter id="shadow3D" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.55"/>
    </filter>

    <!-- Neon Emerald Aura Glow -->
    <filter id="emeraldAura" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComponentTransfer in="blur" result="boost">
        <feFuncA type="linear" slope="0.55"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="boost"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Base 3D Squircle -->
  <rect width="512" height="512" rx="116" fill="url(#bgObsidian)"/>
  <rect width="506" height="506" x="3" y="3" rx="113" fill="none" stroke="url(#bevelRim)" stroke-width="2.5"/>

  <!-- Subtle Precision Currency Ring in Background -->
  <circle cx="256" cy="256" r="182" fill="none" stroke="rgba(16, 185, 129, 0.16)" stroke-width="4" stroke-dasharray="8 6"/>
  <circle cx="256" cy="256" r="182" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>

  <!-- 3D Sculptural Currency Emblem ($) with Growth Surge -->
  <g filter="url(#shadow3D)">
    <!-- Ambient Neon Glow -->
    <g filter="url(#emeraldAura)" opacity="0.4">
      <!-- Vertical Spines -->
      <line x1="256" y1="112" x2="256" y2="400" stroke="#00e676" stroke-width="38" stroke-linecap="round"/>
      <!-- Dollar Ribbon S -->
      <path
        d="M 334 196 C 334 150, 298 140, 256 140 C 200 140, 178 168, 178 206 C 178 266, 334 246, 334 306 C 334 350, 298 372, 256 372 C 206 372, 176 348, 176 316"
        fill="none"
        stroke="#00e676"
        stroke-width="50"
        stroke-linecap="round"
      />
    </g>

    <!-- 1. Vertical 3D Spine (Financial Pillar of Wealth) -->
    <line x1="256" y1="112" x2="256" y2="400" stroke="url(#emeraldCurrency)" stroke-width="34" stroke-linecap="round"/>
    <line x1="256" y1="112" x2="256" y2="400" stroke="url(#specularLight)" stroke-width="14" stroke-linecap="round" opacity="0.6"/>

    <!-- 2. Sculptural 3D S Ribbon Currency Body -->
    <path
      d="M 334 196 C 334 150, 298 140, 256 140 C 200 140, 178 168, 178 206 C 178 266, 334 246, 334 306 C 334 350, 298 372, 256 372 C 206 372, 176 348, 176 316"
      fill="none"
      stroke="url(#emeraldCurrency)"
      stroke-width="46"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- 3. Specular 3D Ridge Highlight (Glossy Top Light) -->
    <path
      d="M 334 196 C 334 150, 298 140, 256 140 C 200 140, 178 168, 178 206 C 178 266, 334 246, 334 306 C 334 350, 298 372, 256 372 C 206 372, 176 348, 176 316"
      fill="none"
      stroke="url(#specularLight)"
      stroke-width="16"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.65"
    />

    <!-- 4. Ascending Financial Growth Wedge (Top Right Accent) -->
    <polygon points="340,116 384,116 384,160" fill="url(#emeraldCurrency)"/>
    <polygon points="340,116 384,116 384,160" fill="url(#specularLight)" opacity="0.5"/>
    <circle cx="384" cy="116" r="6" fill="#ffffff" filter="url(#emeraldAura)"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgPureFinance, 'utf8');
console.log('Generated pure 3D finance icon.svg');

// Generate 192x192 PNG
const png192 = createPng(192, 192, (x, y, w, h) => renderPureFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('Generated pure 3D pwa-192x192.png');

// Generate 512x512 PNG
const png512 = createPng(512, 512, (x, y, w, h) => renderPureFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('Generated pure 3D pwa-512x512.png');

// Generate Maskable 512x512 PNG
const pngMaskable = createPng(512, 512, (x, y, w, h) => renderPureFinanceIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);
console.log('Generated pure 3D pwa-maskable-512x512.png');

// Generate Apple Touch Icon 180x180 PNG
const pngApple = createPng(180, 180, (x, y, w, h) => renderPureFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
console.log('Generated pure 3D apple-touch-icon.png');

// Generate Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);
console.log('Generated pure 3D favicon.ico');

console.log('Pure 3D Financial Icons successfully generated!');

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

// Distance from point to line segment
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

// 3D Phong Shading for Emerald Green & Obsidian Black Theme
function render3DFinanceIcon(x, y, w, h, isMaskable = false) {
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Background: Deep Obsidian / Jet Black with subtle radial gradient and emerald ambient glow
  const rDist = Math.sqrt(nx * nx + ny * ny);
  const bgGrad = (ny + 1) * 0.5;
  let bgR = Math.round(7 + bgGrad * 8);    // ~7 to 15
  let bgG = Math.round(10 + bgGrad * 12);  // ~10 to 22
  let bgB = Math.round(9 + bgGrad * 10);   // ~9 to 19
  let bgA = 255;

  // Subtle emerald ambient glow in bottom-center
  const glowDist = Math.sqrt(nx * nx + (ny - 0.2) * (ny - 0.2));
  if (glowDist < 0.9) {
    const glow = (1 - glowDist / 0.9) * 0.25;
    bgR = Math.min(255, Math.round(bgR + 16 * glow));
    bgG = Math.min(255, Math.round(bgG + 185 * glow));
    bgB = Math.min(255, Math.round(bgB + 129 * glow));
  }

  // Squircle for non-maskable icons
  if (!isMaskable) {
    const p = 4.2;
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

  // 1. 3D Floating Coin / Medallion Rim (Subtle outer money track)
  const coinDist = Math.sqrt(ex * ex + ey * ey);
  if (coinDist >= 0.72 && coinDist <= 0.84) {
    const rimT = (coinDist - 0.72) / 0.12;
    const rimAlpha = Math.sin(rimT * Math.PI) * 0.4;
    // Rim specular light from top-left
    const angle = Math.atan2(ey, ex);
    const lightAlign = Math.max(0, -Math.cos(angle - (-2.2)));
    const highlight = Math.pow(lightAlign, 3) * 0.6;
    
    return [
      Math.min(255, Math.round(bgR + (16 + highlight * 200) * rimAlpha)),
      Math.min(255, Math.round(bgG + (185 + highlight * 70) * rimAlpha)),
      Math.min(255, Math.round(bgB + (129 + highlight * 100) * rimAlpha)),
      bgA
    ];
  }

  // 2. 3D Primary Money Emblem: Dimensional 3D Stylized Financial Growth Symbol ($ / Arrow Ribbon)
  // Consisting of:
  // - Left pillar: vertical segment
  // - Diagonal chevron surge upwards to the right
  // - Top currency horizontal crossbar
  // - Center dollar spine & upward 3D arrowhead
  const dSpine = distToSegment(ex, ey, 0.0, -0.48, 0.0, 0.48); // vertical spine
  const dUpperCurve = distToSegment(ex, ey, 0.28, -0.26, -0.28, -0.26); // upper bar
  const dLowerCurve = distToSegment(ex, ey, -0.28, 0.22, 0.28, 0.22); // lower bar
  
  // 3D Diamond / Arrowhead on top right (representing financial ascent)
  const dUpDiag1 = distToSegment(ex, ey, -0.32, 0.15, 0.0, -0.22);
  const dUpDiag2 = distToSegment(ex, ey, 0.0, -0.22, 0.38, -0.42);
  
  // Distance to 3D primary geometry
  const dRibbon1 = distToSegment(ex, ey, -0.36, 0.35, -0.36, -0.15); // left pillar
  const dRibbon2 = distToSegment(ex, ey, -0.36, -0.15, 0.0, 0.22);   // down slope
  const dRibbon3 = distToSegment(ex, ey, 0.0, 0.22, 0.36, -0.25);    // up surge
  const dRibbon4 = distToSegment(ex, ey, 0.36, -0.25, 0.36, 0.35);   // right pillar

  const mDist = Math.min(dRibbon1, dRibbon2, dRibbon3, dRibbon4);
  const sDist = Math.min(dSpine, dUpperCurve, dLowerCurve);
  
  // 3D Emerald Star / Spark Node at growth peak (0.36, -0.42)
  const sparkX = ex - 0.36;
  const sparkY = ey - (-0.42);
  const sparkDist = Math.sqrt(sparkX * sparkX + sparkY * sparkY);

  const thickness = 0.12;

  if (mDist <= thickness || sparkDist <= 0.09) {
    // 3D Bevel & Normal Vector calculation
    // Distance from center of tube to edge: 0 is center (high z), 1 is edge (z = 0)
    const u = Math.min(1.0, mDist / thickness);
    const z = Math.sqrt(Math.max(0, 1 - u * u)); // Hemisphere cross-section for 3D look

    // Normal lighting: Light from top-left (-0.5, -0.6, 0.8)
    const lx = -0.45;
    const ly = -0.55;
    const lz = 0.70;
    
    // Gradient along horizontal progress:
    // Left: Mint Green (#00E676 / #10B981)
    // Middle: Vibrant Neon Emerald (#00FF87)
    // Right: Radiant Gold-Emerald Money Sheen
    const prog = (ex + 0.4) / 0.8;
    let baseR = 0;
    let baseG = Math.round(200 + prog * 55);
    let baseB = Math.round(110 - prog * 50);

    // Diffuse 3D light
    const diff = Math.max(0.2, (z * lz - (ex / 0.5) * lx * 0.4 - (ey / 0.5) * ly * 0.4));
    
    // Specular 3D highlight (glossy glass/metal reflection)
    const spec = Math.pow(Math.max(0, z * 0.85 - (ex * lx + ey * ly) * 0.5), 12) * 180;

    let r = Math.min(255, Math.round(baseR * diff + spec));
    let g = Math.min(255, Math.round(baseG * diff + spec));
    let b = Math.min(255, Math.round(baseB * diff + spec));

    // Glowing Node at apex
    if (sparkDist <= 0.09) {
      if (sparkDist <= 0.04) {
        r = 255;
        g = 255;
        b = 255; // Pure white core
      } else {
        r = 0;
        g = 255;
        b = 150; // Neon mint glow
      }
    }

    // Anti-Aliasing on outer border
    const edgeDist = (sparkDist <= 0.09) ? (sparkDist - (0.09 - 0.015)) / 0.015 : (mDist - (thickness - 0.015)) / 0.015;
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

  // Soft 3D drop shadow beneath the emblem onto the obsidian base
  const shadowDist = Math.min(
    distToSegment(ex, ey - 0.06, -0.36, 0.35, -0.36, -0.15),
    distToSegment(ex, ey - 0.06, -0.36, -0.15, 0.0, 0.22),
    distToSegment(ex, ey - 0.06, 0.0, 0.22, 0.36, -0.25),
    distToSegment(ex, ey - 0.06, 0.36, -0.25, 0.36, 0.35)
  );
  if (shadowDist <= thickness + 0.07) {
    const sFactor = (1 - (shadowDist - thickness) / 0.07) * 0.55;
    return [
      Math.max(0, Math.round(bgR * (1 - sFactor))),
      Math.max(0, Math.round(bgG * (1 - sFactor))),
      Math.max(0, Math.round(bgB * (1 - sFactor))),
      bgA
    ];
  }

  return [bgR, bgG, bgB, bgA];
}

// Generate High-Res 3D SVG with Photorealistic Gradients and Filters
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Obsidian Canvas Gradient -->
    <radialGradient id="obsidianBg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#161e1b"/>
      <stop offset="45%" stop-color="#0c1110"/>
      <stop offset="100%" stop-color="#050707"/>
    </radialGradient>

    <!-- Beveled Edge Gradient for 3D Border -->
    <linearGradient id="bevelBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(16, 185, 129, 0.45)"/>
      <stop offset="40%" stop-color="rgba(255, 255, 255, 0.08)"/>
      <stop offset="100%" stop-color="rgba(0, 230, 118, 0.15)"/>
    </linearGradient>

    <!-- 3D Glossy Emerald Money Ribbon Gradient -->
    <linearGradient id="emerald3D" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="25%" stop-color="#059669"/>
      <stop offset="55%" stop-color="#10b981"/>
      <stop offset="85%" stop-color="#00e676"/>
      <stop offset="100%" stop-color="#69f0ae"/>
    </linearGradient>

    <!-- Metallic Specular Sheen Overlay -->
    <linearGradient id="specularSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
    </linearGradient>

    <!-- Glowing Apex Spark -->
    <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#00e676"/>
      <stop offset="75%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </radialGradient>

    <!-- 3D Deep Occlusion Drop Shadow -->
    <filter id="shadow3D" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
    </filter>

    <!-- Neon Emerald Aura Glow -->
    <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feComponentTransfer in="blur" result="boost">
        <feFuncA type="linear" slope="0.5"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="boost"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Obsidian 3D Squircle Base -->
  <rect width="512" height="512" rx="116" fill="url(#obsidianBg)"/>
  <rect width="506" height="506" x="3" y="3" rx="113" fill="none" stroke="url(#bevelBorder)" stroke-width="2.5"/>

  <!-- Subtle 3D Coin Currency Orbit Ring -->
  <circle cx="256" cy="265" r="176" fill="none" stroke="rgba(16, 185, 129, 0.12)" stroke-width="5" stroke-dasharray="10 8"/>
  <circle cx="256" cy="265" r="176" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>

  <!-- 3D Financial Growth Monogram Ribbon -->
  <g filter="url(#shadow3D)">
    <!-- Soft Glow Backdrop -->
    <path
      d="M 152 352 L 152 205 L 256 308 L 360 205 L 360 352"
      fill="none"
      stroke="#10b981"
      stroke-width="52"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.35"
      filter="url(#emeraldGlow)"
    />

    <!-- Main Dimensional Emerald Structure -->
    <path
      d="M 152 352 L 152 205 L 256 308 L 360 205 L 360 352"
      fill="none"
      stroke="url(#emerald3D)"
      stroke-width="46"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- 3D Top Chamfer / Highlight Spine -->
    <path
      d="M 152 352 L 152 205 L 256 308 L 360 205 L 360 352"
      fill="none"
      stroke="url(#specularSheen)"
      stroke-width="20"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.55"
    />

    <!-- Glowing Ascent Apex Node (Money Spark) -->
    <circle cx="360" cy="144" r="24" fill="url(#sparkGlow)" filter="url(#emeraldGlow)"/>
    <circle cx="360" cy="144" r="11" fill="#ffffff"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Generated 3D obsidian & emerald icon.svg');

// Generate 192x192 PNG
const png192 = createPng(192, 192, (x, y, w, h) => render3DFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('Generated 3D pwa-192x192.png');

// Generate 512x512 PNG
const png512 = createPng(512, 512, (x, y, w, h) => render3DFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('Generated 3D pwa-512x512.png');

// Generate Maskable 512x512 PNG
const pngMaskable = createPng(512, 512, (x, y, w, h) => render3DFinanceIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);
console.log('Generated 3D pwa-maskable-512x512.png');

// Generate Apple Touch Icon 180x180 PNG
const pngApple = createPng(180, 180, (x, y, w, h) => render3DFinanceIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
console.log('Generated 3D apple-touch-icon.png');

// Generate Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);
console.log('Generated 3D favicon.ico');

console.log('All 3D Black & Emerald Green icons successfully generated!');

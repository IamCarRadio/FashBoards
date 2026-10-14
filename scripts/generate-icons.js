// scripts/generate-icons.js
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write high quality SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0E1A" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="pulse" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#22D3EE" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  
  <!-- Subtle circular grid -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="rgba(99,102,241,0.15)" stroke-width="1.5" stroke-dasharray="6 6" />
  <circle cx="256" cy="256" r="100" fill="none" stroke="rgba(34,211,238,0.15)" stroke-width="1.5" />
  
  <!-- Clinic Cross & EKG Pulse Wave -->
  <!-- Cross backglow -->
  <path d="M236 120 h40 v86 h86 v40 h-86 v86 h-40 v-86 h-86 v-40 h86 z" fill="rgba(99,102,241,0.12)" />
  
  <!-- Glowing ECG Pulse line through center -->
  <path d="M80 256 L180 256 L210 180 L235 320 L270 140 L300 360 L330 220 L350 256 L432 256" 
        fill="none" 
        stroke="url(#pulse)" 
        stroke-width="18" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        filter="url(#glow)" />
        
  <!-- Glowing nodes on heartbeat line -->
  <circle cx="270" cy="140" r="10" fill="#22D3EE" filter="url(#glow)" />
  <circle cx="300" cy="360" r="8" fill="#6366F1" filter="url(#glow)" />
  <circle cx="350" cy="256" r="6" fill="#10B981" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon.trim());

// Function to generate raw PNG with uncompressed or zlib compressed scanlines
function createPNG(width, height, isMaskable = false) {
  // RGBA buffer
  const buffer = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    buffer[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark navy background #0A0E1A
      let r = 10;
      let g = 14;
      let b = 26;
      let a = 255;

      // Pulse color blend #6366F1 to #22D3EE
      const t = Math.max(0, Math.min(1, x / width));
      const pr = Math.round(99 + (34 - 99) * t);
      const pg = Math.round(102 + (211 - 102) * t);
      const pb = Math.round(241 + (238 - 241) * t);

      // Center glowing circle
      if (dist < radius) {
        const glow = 1 - (dist / radius);
        r = Math.min(255, Math.round(r + pr * glow * 0.45));
        g = Math.min(255, Math.round(g + pg * glow * 0.45));
        b = Math.min(255, Math.round(b + pb * glow * 0.45));
      }

      // ECG wave line function
      const normX = (x / width) * 10 - 5;
      let waveY = 0;
      if (normX >= -3 && normX <= 3) {
        waveY = Math.sin(normX * 3) * Math.exp(-normX * normX * 0.25) * (height * 0.28);
      }
      const distToWave = Math.abs((y - cy) - waveY);
      if (distToWave < height * 0.035) {
        const waveAlpha = 1 - (distToWave / (height * 0.035));
        r = Math.round(r * (1 - waveAlpha) + pr * waveAlpha);
        g = Math.round(g * (1 - waveAlpha) + pg * waveAlpha);
        b = Math.round(b * (1 - waveAlpha) + pb * waveAlpha);
      }

      // Clinic cross motif in center
      const crossW = width * 0.06;
      const crossH = height * 0.22;
      const inV = Math.abs(x - cx) < crossW && Math.abs(y - cy) < crossH;
      const inH = Math.abs(y - cy) < crossW && Math.abs(x - cx) < crossH;
      if (inV || inH) {
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 60);
        b = Math.min(255, b + 100);
      }

      buffer[offset++] = r;
      buffer[offset++] = g;
      buffer[offset++] = b;
      buffer[offset++] = a;
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(buffer);

  // Build PNG chunks
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32, false));

console.log('Successfully generated all PWA icons & manifest assets!');

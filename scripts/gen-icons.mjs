import sharp from 'sharp';
import { writeFileSync } from 'fs';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="doc" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>

  <!-- Document shadow -->
  <rect x="302" y="176" width="440" height="572" rx="40" fill="#000" opacity="0.35"/>

  <!-- Document body -->
  <rect x="288" y="160" width="440" height="572" rx="40" fill="url(#doc)" stroke="#334155" stroke-width="1.5"/>

  <!-- Corner fold clip -->
  <polygon points="628,160 728,260 628,260" fill="#0F172A"/>
  <line x1="628" y1="160" x2="728" y2="260" stroke="#334155" stroke-width="1.5"/>

  <!-- Blue header bar -->
  <rect x="328" y="204" width="260" height="28" rx="8" fill="#3B82F6"/>
  <rect x="328" y="204" width="160" height="28" rx="8" fill="#60A5FA"/>

  <!-- Horizontal rule -->
  <rect x="328" y="254" width="360" height="2" rx="1" fill="#334155"/>

  <!-- Row 1 – item + amount (blue = highlighted) -->
  <rect x="328" y="278" width="196" height="14" rx="5" fill="#93C5FD" opacity="0.8"/>
  <rect x="560" y="278" width="128" height="14" rx="5" fill="#3B82F6"/>

  <!-- Row 2 -->
  <rect x="328" y="312" width="176" height="12" rx="5" fill="#475569"/>
  <rect x="560" y="312" width="100" height="12" rx="5" fill="#475569"/>

  <!-- Row 3 -->
  <rect x="328" y="344" width="210" height="12" rx="5" fill="#475569"/>
  <rect x="560" y="344" width="114" height="12" rx="5" fill="#475569"/>

  <!-- Row 4 -->
  <rect x="328" y="376" width="164" height="12" rx="5" fill="#475569"/>
  <rect x="560" y="376" width="92" height="12" rx="5" fill="#475569"/>

  <!-- Row 5 -->
  <rect x="328" y="408" width="188" height="12" rx="5" fill="#475569"/>
  <rect x="560" y="408" width="106" height="12" rx="5" fill="#475569"/>

  <!-- Horizontal rule -->
  <rect x="328" y="438" width="360" height="2" rx="1" fill="#334155"/>

  <!-- Total label + value badge -->
  <rect x="328" y="460" width="72" height="14" rx="5" fill="#64748B"/>
  <rect x="522" y="454" width="166" height="28" rx="10" fill="#3B82F6"/>

  <!-- Stamp / seal circle -->
  <circle cx="500" cy="622" r="64" fill="#0F172A" opacity="0.7"/>
  <circle cx="500" cy="622" r="54" fill="#1D4ED8"/>
  <circle cx="500" cy="622" r="48" fill="none" stroke="#93C5FD" stroke-width="2.5" stroke-dasharray="6 4"/>
  <!-- Checkmark -->
  <path d="M476 622 L493 640 L526 604" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const svgBuf = Buffer.from(SVG);

async function gen(buf, outPath, size) {
  await sharp(buf, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

await gen(svgBuf, 'assets/images/icon.png', 1024);
await gen(svgBuf, 'assets/images/splash-icon.png', 1024);
await gen(svgBuf, 'assets/images/favicon.png', 64);
await gen(svgBuf, 'public/icon-192.png', 192);
await gen(svgBuf, 'public/icon-512.png', 512);

// Android adaptive icon foreground — document centered on transparent bg, safe zone sized
const FG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="doc" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <!-- Centered & scaled to ~68% of canvas so it fits Android safe zone -->
  <g transform="translate(162,130) scale(0.69)">
    <!-- Shadow -->
    <rect x="302" y="176" width="440" height="572" rx="40" fill="#000" opacity="0.35"/>
    <!-- Body -->
    <rect x="288" y="160" width="440" height="572" rx="40" fill="url(#doc)" stroke="#334155" stroke-width="1.5"/>
    <!-- Corner fold -->
    <polygon points="628,160 728,260 628,260" fill="#0F172A"/>
    <line x1="628" y1="160" x2="728" y2="260" stroke="#334155" stroke-width="1.5"/>
    <!-- Header bar -->
    <rect x="328" y="204" width="260" height="28" rx="8" fill="#3B82F6"/>
    <rect x="328" y="204" width="160" height="28" rx="8" fill="#60A5FA"/>
    <!-- Rule -->
    <rect x="328" y="254" width="360" height="2" rx="1" fill="#334155"/>
    <!-- Rows -->
    <rect x="328" y="278" width="196" height="14" rx="5" fill="#93C5FD" opacity="0.8"/>
    <rect x="560" y="278" width="128" height="14" rx="5" fill="#3B82F6"/>
    <rect x="328" y="312" width="176" height="12" rx="5" fill="#475569"/>
    <rect x="560" y="312" width="100" height="12" rx="5" fill="#475569"/>
    <rect x="328" y="344" width="210" height="12" rx="5" fill="#475569"/>
    <rect x="560" y="344" width="114" height="12" rx="5" fill="#475569"/>
    <rect x="328" y="376" width="164" height="12" rx="5" fill="#475569"/>
    <rect x="560" y="376" width="92" height="12" rx="5" fill="#475569"/>
    <rect x="328" y="408" width="188" height="12" rx="5" fill="#475569"/>
    <rect x="560" y="408" width="106" height="12" rx="5" fill="#475569"/>
    <!-- Rule -->
    <rect x="328" y="438" width="360" height="2" rx="1" fill="#334155"/>
    <!-- Total -->
    <rect x="328" y="460" width="72" height="14" rx="5" fill="#64748B"/>
    <rect x="522" y="454" width="166" height="28" rx="10" fill="#3B82F6"/>
    <!-- Seal -->
    <circle cx="500" cy="622" r="64" fill="#0F172A" opacity="0.7"/>
    <circle cx="500" cy="622" r="54" fill="#1D4ED8"/>
    <circle cx="500" cy="622" r="48" fill="none" stroke="#93C5FD" stroke-width="2.5" stroke-dasharray="6 4"/>
    <path d="M476 622 L493 640 L526 604" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

await gen(Buffer.from(FG_SVG), 'assets/images/android-icon-foreground.png', 1024);

// Monochrome — white document silhouette on transparent
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g transform="translate(242,162) scale(0.53)">
    <rect x="288" y="160" width="440" height="572" rx="40" fill="white"/>
    <polygon points="628,160 728,260 628,260" fill="#888"/>
    <rect x="328" y="204" width="260" height="28" rx="8" fill="#888"/>
    <rect x="328" y="254" width="360" height="2" fill="#888"/>
    <rect x="328" y="278" width="324" height="12" rx="5" fill="#888"/>
    <rect x="328" y="308" width="276" height="10" rx="5" fill="#888"/>
    <rect x="328" y="334" width="310" height="10" rx="5" fill="#888"/>
    <rect x="328" y="360" width="256" height="10" rx="5" fill="#888"/>
    <rect x="328" y="438" width="360" height="2" fill="#888"/>
    <rect x="328" y="460" width="238" height="14" rx="5" fill="#888"/>
    <circle cx="500" cy="622" r="54" fill="#888"/>
    <path d="M476 622 L493 640 L526 604" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

await gen(Buffer.from(MONO_SVG), 'assets/images/android-icon-monochrome.png', 1024);

// Android background — solid dark navy
const BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0F172A"/>
</svg>`;
await gen(Buffer.from(BG_SVG), 'assets/images/android-icon-background.png', 1024);

console.log('Done!');

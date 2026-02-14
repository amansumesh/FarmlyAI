import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [64, 192, 512];
const publicDir = path.join(__dirname, '../public');

console.log('Creating placeholder PWA icons...');

const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#16a34a" rx="${size * 0.125}"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <path d="M${size * 0.25} ${size * 0.0625}c-${size * 0.0688} 0-${size * 0.125} ${size * 0.056}-${size * 0.125} ${size * 0.125}v${size * 0.3125}c0 ${size * 0.0688} ${size * 0.056} ${size * 0.125} ${size * 0.125} ${size * 0.125}s${size * 0.125}-${size * 0.056} ${size * 0.125}-${size * 0.125}V${size * 0.1875}c0-${size * 0.0688}-${size * 0.056}-${size * 0.125}-${size * 0.125}-${size * 0.125}zM${size * 0.1875} ${size * 0.1875}c0-${size * 0.0344} ${size * 0.028}-${size * 0.0625} ${size * 0.0625}-${size * 0.0625}s${size * 0.0625} ${size * 0.028} ${size * 0.0625} ${size * 0.0625}v${size * 0.3125}c0 ${size * 0.0344}-${size * 0.028} ${size * 0.0625}-${size * 0.0625} ${size * 0.0625}s-${size * 0.0625}-${size * 0.028}-${size * 0.0625}-${size * 0.0625}V${size * 0.1875}z" fill="#ffffff"/>
    <path d="M${size * 0.25} 0c-${size * 0.0344} 0-${size * 0.0625} ${size * 0.028}-${size * 0.0625} ${size * 0.0625}v${size * 0.125}h${size * 0.125}V${size * 0.0625}c0-${size * 0.0344}-${size * 0.028}-${size * 0.0625}-${size * 0.0625}-${size * 0.0625}z" fill="#ffffff"/>
    <circle cx="${size * 0.1875}" cy="${size * 0.4375}" r="${size * 0.03125}" fill="#ffffff"/>
    <circle cx="${size * 0.3125}" cy="${size * 0.4375}" r="${size * 0.03125}" fill="#ffffff"/>
  </g>
</svg>`;

sizes.forEach(size => {
  const svgContent = svgTemplate(size);
  const filename = `pwa-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Created ${filename}`);
});

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#16a34a" rx="4"/>
  <g transform="translate(8, 8)">
    <path d="M8 2c-2.2 0-4 1.8-4 4v10c0 2.2 1.8 4 4 4s4-1.8 4-4V6c0-2.2-1.8-4-4-4zM6 6c0-1.1.9-2 2-2s2 .9 2 2v10c0 1.1-.9 2-2 2s-2-.9-2-2V6z" fill="#ffffff"/>
    <path d="M8 0C7.1 0 6 .9 6 2v4h4V2c0-1.1-.9-2-2-2z" fill="#ffffff"/>
    <circle cx="6" cy="14" r="1" fill="#ffffff"/>
    <circle cx="10" cy="14" r="1" fill="#ffffff"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
console.log('✓ Created favicon.svg');

const appleTouchIcon = svgTemplate(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIcon);
console.log('✓ Created apple-touch-icon.svg');

const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://farmly-ai.vercel.app/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
console.log('✓ Created robots.txt');

console.log('\n✅ All placeholder icons generated successfully!');
console.log('\nNote: For production, convert SVG icons to PNG using:');
console.log('  - Online tools like https://svgtopng.com');
console.log('  - Or install sharp: npm i -D sharp');
console.log('  - Then use sharp to convert SVG to PNG programmatically\n');

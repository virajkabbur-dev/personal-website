const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const vendorDir = path.join(root, 'public', 'vendor');

const files = [
  ['node_modules/gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'lenis.min.js'],
  ['node_modules/locomotive-scroll/dist/locomotive-scroll.umd.js', 'locomotive-scroll.umd.js'],
  ['node_modules/locomotive-scroll/dist/locomotive-scroll.css', 'locomotive-scroll.css'],
];

fs.mkdirSync(vendorDir, { recursive: true });

for (const [src, dest] of files) {
  fs.copyFileSync(path.join(root, src), path.join(vendorDir, dest));
}

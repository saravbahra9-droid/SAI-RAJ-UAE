// Bundles src/hero3d/index.js + three.js into one lazy-loaded ES module: assets/js/hero3d.js
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
const out = fileURLToPath(new URL('../assets/js/hero3d.js', import.meta.url));
await build({
  entryPoints: [fileURLToPath(new URL('../src/hero3d/index.js', import.meta.url))],
  bundle: true, format: 'esm', minify: true, target: 'es2020', outfile: out, legalComments: 'none',
  nodePaths: [fileURLToPath(new URL('./node_modules', import.meta.url))],
  banner: { js: '/* Sai Raj hero scene. Built from src/hero3d — includes three.js (MIT). Do not edit by hand. */' }
});
console.log('hero3d.js', (statSync(out).size / 1024).toFixed(0) + ' KB,', (gzipSync(readFileSync(out)).length / 1024).toFixed(0) + ' KB gzip');

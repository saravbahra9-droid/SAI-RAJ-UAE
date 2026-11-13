// Measures the real height of every table row in tools/out/parts.html and writes tools/out/parts-heights.json,
// so tools/build_parts.py can fill each page exactly on its second pass:
//   python3 build_parts.py && node measure-parts.mjs && python3 build_parts.py && node render-pdf.mjs parts
import { chromium } from 'playwright-core';
import { start } from './serve.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const server = await start(4197);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4197/tools/out/parts.html', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const h = await page.evaluate(() => { const mm = 96 / 25.4, out = {};
  for (const e of document.querySelectorAll('[data-k]')) { const s = getComputedStyle(e); out[e.dataset.k] = +((e.getBoundingClientRect().height + parseFloat(s.marginTop) + parseFloat(s.marginBottom)) / mm).toFixed(2); }
  return out; });
writeFileSync(fileURLToPath(new URL('./out/parts-heights.json', import.meta.url)), JSON.stringify(h));
console.log('measured', Object.keys(h).length, 'rows');
await browser.close(); server.close();

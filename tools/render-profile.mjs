// Prints tools/out/profile.html to assets/docs/sai-raj-company-profile-2026.pdf (A4, backgrounds on).
// Fails loudly if anything on a page runs past the footer rule or the page edge.
import { chromium } from 'playwright-core';
import { start } from './serve.mjs';
import { fileURLToPath } from 'node:url';
const server = await start(4196);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4196/tools/out/profile.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const over = await page.evaluate(() => [...document.querySelectorAll('.pg')].flatMap((p, i) => {
  const f = p.querySelector('.pf'), box = p.getBoundingClientRect(), limit = (f ? f.getBoundingClientRect().top : box.bottom) - 6, out = [];
  for (const el of p.querySelectorAll('*')) {
    if (el === f || (f && f.contains(el)) || el.closest('svg') && el.tagName !== 'svg' || el.matches('.cv__img,.cv__foot,.cv__foot *,.bk,.bk *')) continue;
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
    if (r.bottom > limit + 0.5) out.push(`p${i + 1} <${el.tagName.toLowerCase()} class="${el.getAttribute('class') || ''}"> runs ${Math.round(r.bottom - limit)}px past the footer`);
    if (r.right > box.right + 0.5 && !el.matches('.wide')) out.push(`p${i + 1} <${el.tagName.toLowerCase()}> runs ${Math.round(r.right - box.right)}px off the right edge`);
    if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible' && el !== p) out.push(`p${i + 1} <${el.tagName.toLowerCase()} class="${el.getAttribute('class') || ''}"> clips its content`);
  }
  // grid/flex cells that are too small for their text
  for (const el of p.querySelectorAll('.band, .bcard, .lcard, .tl li, .why div, .locs div, .st')) { const r = el.getBoundingClientRect(); for (const c of el.children) { const cr = c.getBoundingClientRect(); if (cr.bottom > r.bottom + 1) out.push(`p${i + 1} .${el.className.split(' ')[0]} content spills ${Math.round(cr.bottom - r.bottom)}px`); } }
  return out.slice(0, 4);
}));
console.log(over.length ? 'OVERFLOW:\n  ' + over.join('\n  ') : 'no page overflows');
await page.pdf({ path: fileURLToPath(new URL('../assets/docs/sai-raj-company-profile-2026.pdf', import.meta.url)), preferCSSPageSize: true, printBackground: true });
await browser.close(); server.close(); console.log('pdf written');
if (over.length) process.exitCode = 1;

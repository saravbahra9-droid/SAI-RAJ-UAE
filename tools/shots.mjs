// Screenshot helper: node shots.mjs <path> <name> <WxH> <scrollYs comma list | "full"> [--dpr=2] [--mobile] [--rm] [--wait=ms] [--q=querystring]
// External hosts are not reachable from the build sandbox, so Shopify CDN images are stubbed with a neutral placeholder
// and Formspree is mocked. Output: /tmp/shots/<name>-<i>.jpg
import { chromium } from 'playwright-core';
import { start } from './serve.mjs';
import { mkdirSync } from 'node:fs';
const [, , path = '/', name = 'shot', size = '1440x900', ys = '0', ...flags] = process.argv;
const flag = k => flags.find(f => f.startsWith('--' + k));
const [W, H] = size.split('x').map(Number);
const dpr = +(flag('dpr') || '--dpr=1').split('=')[1];
const wait = +(flag('wait') || '--wait=900').split('=')[1];
const PLACEHOLDER = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#b8ad96"/><path d="M0 400h800M400 0v800" stroke="#8d8370" stroke-width="6"/><text x="400" y="390" font-family="sans-serif" font-size="34" fill="#5d5647" text-anchor="middle">CDN image (stub)</text></svg>`);
mkdirSync('/tmp/shots', { recursive: true });
const server = await start(4188);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr, isMobile: !!flag('mobile'), hasTouch: !!flag('mobile'),
  reducedMotion: flag('rm') ? 'reduce' : 'no-preference' });
await ctx.route(/cdn\.shopify\.com/, r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: PLACEHOLDER }));
await ctx.route(/formspree\.io/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text()); });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
const qs = (flag('q') || '').replace('--q=', '');
await page.goto('http://127.0.0.1:4188' + path + (qs ? '?' + qs : ''), { waitUntil: 'load' });
await page.waitForTimeout(flag('pre') ? 300 : 3200);     // let the preloader lift and the 3D arrive
if (ys === 'full') {
  await page.screenshot({ path: `/tmp/shots/${name}-full.jpg`, fullPage: true, quality: 70, type: 'jpeg' });
} else {
  let i = 0;
  for (const y of ys.split(',')) {
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const top = y.endsWith('%') ? Math.round(total * parseFloat(y) / 100) : y.endsWith('vh') ? Math.round(H * parseFloat(y)) : +y;
    await page.evaluate(t => window.scrollTo(0, t), top);
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `/tmp/shots/${name}-${i++}.jpg`, quality: 72, type: 'jpeg' });
  }
}
const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
console.log(name, 'scrollWidth', overflow.sw, 'clientWidth', overflow.cw, overflow.sw > overflow.cw ? '<< SIDEWAYS SCROLL' : 'ok');
await browser.close(); server.close();

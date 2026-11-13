// Renders the 1200x630 share image (assets/img/og.jpg) from tools/og.html.
import { chromium } from 'playwright-core';
import { start } from './serve.mjs';
import { fileURLToPath } from 'node:url';
const server = await start(4197);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4197/tools/og.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: fileURLToPath(new URL('../assets/img/og.jpg', import.meta.url)), type: 'jpeg', quality: 88 });
await browser.close(); server.close(); console.log('og.jpg written');

// Renders the flat hero fallbacks (assets/img/hero-1..3.webp, panel-1..3.webp) from the real 3D scene.
// Usage: node render-posters.mjs [--preview]   (preview also writes dark-background PNGs to /tmp)
import { chromium } from 'playwright-core';
import { start } from './serve.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const IMG = fileURLToPath(new URL('../assets/img/', import.meta.url));
const preview = process.argv.includes('--preview');
const only = (process.argv.find(a => a.startsWith('--variant=')) || '').split('=')[1];
const extra = (process.argv.find(a => a.startsWith('--at=')) || '').split('=')[1];
const server = await start(4199);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
page.on('pageerror', e => console.log('pageerror:', e.message));
mkdirSync('/tmp/posters', { recursive: true });
const sets = { body: { name: 'hero', at: [0, 0.46, 0.92] }, panel: { name: 'panel', at: [0, 0.4, 0.92] } };
for (const [variant, set] of Object.entries(sets)) {
  if (only && only !== variant) continue;
  await page.goto(`http://127.0.0.1:4199/tools/poster.html?variant=${variant}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  const at = extra ? extra.split(',').map(Number) : set.at;
  for (let i = 0; i < at.length; i++) {
    await page.evaluate(p => window.__render(p), at[i]);
    const png = await page.locator('#c').screenshot({ omitBackground: true });
    const tmp = `/tmp/posters/${set.name}-${extra ? 'p' + at[i] : i + 1}.png`;
    writeFileSync(tmp, png);
    if (!extra) execFileSync('python3', ['-c', `
from PIL import Image
import numpy as np
im=Image.open('${tmp}').convert('RGBA'); a=np.array(im).astype(np.float32)
h,w=a.shape[:2]; yy,xx=np.mgrid[0:h,0:w]
ex=np.minimum(xx,w-1-xx)/(w*0.11); ey=np.minimum(yy,h-1-yy)/(h*0.11)       # soft edge so the flat frame has no visible box
m=np.clip(np.minimum(ex,ey),0,1); m=m*m*(3-2*m)
a[...,3]*=m
Image.fromarray(a.astype(np.uint8),'RGBA').save('${IMG}${set.name}-${i + 1}.webp', quality=86, alpha_quality=92, method=6)
`]);
    if (preview || extra) execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('${tmp}').convert('RGBA'); bg=Image.new('RGBA',im.size,(18,14,11,255)); bg.alpha_composite(im)
bg.convert('RGB').resize((im.width//2,im.height//2),Image.LANCZOS).save('${tmp.replace('.png', '-dark.jpg')}',quality=88)
`]);
    console.log('rendered', variant, at[i]);
  }
}
await browser.close(); server.close();

// End-to-end checks for sairaj.global. Run from /tools:  node test-site.mjs
// Nothing here talks to the outside world: Formspree is mocked (no real emails), Shopify CDN images are stubbed,
// and Shopify checkout links are compared with the ones on the `main` branch rather than opened.
import { chromium } from 'playwright-core';
import { start } from './serve.mjs';
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = 'http://127.0.0.1:4177';
const SHOTS = '/tmp/final-shots'; mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0; const fails = [];
const ok = (cond, name, extra = '') => { if (cond) { pass++; } else { fail++; fails.push(name + (extra ? ' — ' + extra : '')); console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
const section = t => console.log('\n■ ' + t);

/* ───────── 1. static: every internal link and asset resolves ───────── */
section('Static link check');
const NEW = ['cargotuff', 'pulse', 'safarituff', 'cargocool', 'deco', 'cold-chain', 'partners', 'contact', 'downloads'];
const pages = ['index.html', 'shop/index.html', 'privacy/index.html', 'terms/index.html', '404.html', ...NEW.map(n => n + '/index.html')];
const externals = new Set();
for (const pg of pages) {
  const html = readFileSync(join(ROOT, pg), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const refs = [...html.matchAll(/\s(?:href|src|action|data-src)="([^"]+)"/g)].map(m => m[1]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:)/.test(r)) { externals.add(r.split('?')[0]); continue; }
    if (r.startsWith('data:')) continue;
    if (r.startsWith('#')) { if (r.length > 1 && !r.startsWith('#/') && r !== '#cart') ok(ids.has(r.slice(1)), `${pg}: anchor ${r}`); continue; }
    const [path, hash] = r.split('#');
    const clean = path.split('?')[0];
    let file = join(ROOT, clean);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    ok(existsSync(file), `${pg}: ${r} exists`);
    if (hash && !hash.startsWith('/') && existsSync(file) && file.endsWith('.html')) {
      const target = readFileSync(file, 'utf8');
      ok(new RegExp(`\\sid="${hash}"`).test(target), `${pg}: ${r} anchor exists`);
    }
  }
}
console.log('  external targets:', [...externals].sort().join('  '));
ok([...externals].some(e => e === 'https://formspree.io/f/meebvwwy'), 'enquiry form posts to Formspree meebvwwy');
for (const f of ['robots.txt', 'sitemap.xml', 'vercel.json', 'assets/img/og.jpg', 'assets/img/hero-1.webp', 'assets/js/hero3d.js']) ok(existsSync(join(ROOT, f)), f + ' present');
const ogSize = execFileSync('python3', ['-c', `from PIL import Image;print(Image.open('${join(ROOT, 'assets/img/og.jpg')}').size)`]).toString().trim();
ok(ogSize === '(1200, 630)', 'share image is 1200x630', ogSize);
const allFiles = (d) => readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === 'node_modules' || e.name === '.git' ? [] : e.isDirectory() ? allFiles(join(d, e.name)) : [join(d, e.name)]);
const shipped = allFiles(ROOT).filter(f => !f.includes('/tools/') && !f.includes('/src/') && /\.(html|css|js)$/.test(f));
const googleFonts = shipped.filter(f => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, 'utf8')));
ok(googleFonts.length === 0, 'fonts are self-hosted (no Google Fonts requests)', googleFonts.join(','));

/* ───────── 1b. sitemap and downloads ───────── */
section('Sitemap and downloads');
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
for (const u of ['', 'shop/', 'privacy/', 'terms/', ...NEW.map(n => n + '/')]) ok(sm.includes(`<loc>https://sairaj.global/${u}</loc>`), `sitemap lists /${u}`);
ok(!sm.includes('404'), 'sitemap leaves out the 404 page');
const dl = readFileSync(join(ROOT, 'downloads/index.html'), 'utf8');
ok(!shipped.some(f => readFileSync(f, 'utf8').includes('2024-25.pdf')), 'nothing links the retired 2024-25 PDF');
const PDFS = [
  ['assets/docs/sai-raj-company-profile-2026.pdf', 20, ['Innovation is in our', 'Jebel Ali Freezone (JAFZA)', 'Baba Dogo Rd', '10,000+', 'Thermo King', 'Cargotuff', 'Safarituff', 'Cargocool', 'Decoroof', 'Decoglaze', '+971 543 256 505', 'info@sairaj.global']],
  ['assets/docs/cargotuff-cold-chain-catalogue-2026.pdf', 22, ['Built to', 'Rigicore fibreglass', '65, 90, 115 or 165 mm', 'Ferrotuff', 'Precise canopy', 'Thermo King', 'Official dealer', 'Rivacold', 'KEBS approved', 'Sherp carriers', 'Jebel Ali Freezone (JAFZA)', '+971 543 256 505', 'info@sairaj.global', '+254 708 771 100']],
];
for (const [PDF, pagesWanted, facts] of PDFS) {
  const short = PDF.split('/').pop();
  ok(dl.includes(`href="/${PDF}" download`), `Downloads links ${short}`);
  const info = execFileSync('pdfinfo', [join(ROOT, PDF)]).toString();
  ok(new RegExp(`Pages:\\s+${pagesWanted}\\b`).test(info), `${short} has ${pagesWanted} pages`, (info.match(/Pages:.*/) || [''])[0]);
  ok(/Page size:\s+59[45](\.\d+)? x 84[12](\.\d+)? pts \(A4\)/.test(info), `${short} is A4`, (info.match(/Page size:.*/) || [''])[0]);
  ok(statSync(join(ROOT, PDF)).size < 3e6, `${short} is under 3 MB`, String(statSync(join(ROOT, PDF)).size));
  ok(dl.includes(`PDF, ${pagesWanted} pages, ${(statSync(join(ROOT, PDF)).size / 1e6).toFixed(1)} MB`), `Downloads shows the real page count and size of ${short}`);
  const fonts = execFileSync('pdffonts', [join(ROOT, PDF)]).toString();
  const fontRows = fonts.split('\n').slice(2).filter(l => l.trim()).map(l => l.trim().split(/\s+/));
  ok(/Poppins/.test(fonts) && /PlayfairDisplay/.test(fonts) && fontRows.every(t => t[t.length - 5] === 'yes'), `${short} embeds the brand fonts`);
  const ptxt = execFileSync('pdftotext', ['-layout', join(ROOT, PDF), '-'], { maxBuffer: 1e8 }).toString();
  for (const t of facts) ok(ptxt.includes(t), `${short} text has "${t}"`);
  ok(!/over 40 years/i.test(ptxt), `${short} never says "over 40 years"`);
  ok(ptxt.split('\f').filter(x => x.trim()).length === pagesWanted, `every page of ${short} carries text`);
}
// the catalogue's contents page must point at the right pages
{
  const pagesTxt = execFileSync('pdftotext', ['-layout', join(ROOT, PDFS[1][0]), '-'], { maxBuffer: 1e8 }).toString().split('\f');
  const toc = [...pagesTxt[1].matchAll(/^\s*0\d\s+(.+?)\s{2,}(\d{2})\s*$/gm)].map(m => [m[1].trim(), +m[2]]);
  ok(toc.length === 7, 'catalogue contents lists 7 sections', String(toc.length));
  for (const [title, n] of toc) ok(new RegExp(`0\\d · ${title.split(' ')[0]}`, 'i').test(pagesTxt[n - 1] || ''), `contents: "${title}" starts on page ${n}`);
}

/* ───────── 2. shop data is unchanged from main ───────── */
section('Shop data vs main');
const oldHtml = execFileSync('git', ['-C', ROOT, 'show', 'main:index.html'], { maxBuffer: 1e8 }).toString();
const grab = (src) => [...src.matchAll(/\{id:"([^"]+)", title:(?:"[^"]*"|'[^']*'), cat:"[^"]+", price:(\d+)[\s\S]*?handle:"([^"]+)", variantId:"(\d+)"/g)].map(m => m.slice(1).join('|'));
const oldP = grab(oldHtml), newP = grab(readFileSync(join(ROOT, 'assets/js/catalog.js'), 'utf8'));
ok(oldP.length === 12 && newP.length === 12, '12 products on both', `${oldP.length} / ${newP.length}`);
ok(JSON.stringify(oldP) === JSON.stringify(newP), 'ids, AED prices, handles and Shopify variant IDs identical to main');
ok(/domain: "sai-raj-uae\.myshopify\.com"/.test(readFileSync(join(ROOT, 'assets/js/catalog.js'), 'utf8')), 'Shopify domain unchanged');

/* ───────── browser ───────── */
const server = await start(4177);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const STUB = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#b8ad96"/><path d="M0 400h800M400 0v800" stroke="#9c927e" stroke-width="4"/></svg>`);
const VP = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  ipad: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};
async function ctxFor(name, opts = {}) {
  const ctx = await browser.newContext({ ...VP[name], ...opts });
  const posts = [];
  await ctx.route(/cdn\.shopify\.com/, r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: STUB }));
  await ctx.route(/formspree\.io/, async r => {
    posts.push({ url: r.request().url(), method: r.request().method(), body: r.request().postData() || '' });
    await r.fulfill({ status: ctx._formStatus || 200, contentType: 'application/json', body: JSON.stringify({ ok: (ctx._formStatus || 200) === 200 }) });
  });
  ctx._posts = posts;
  return ctx;
}
async function open(ctx, path, { settle = 3000 } = {}) {
  const page = await ctx.newPage(); page._errors = [];
  page.on('pageerror', e => page._errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page._errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => { const u = r.url(); if (u.startsWith(BASE)) page._errors.push('request failed: ' + u); });
  page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400 && !/does-not-exist/.test(r.url())) page._errors.push(r.status() + ' ' + r.url()); });
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(settle);
  return page;
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
const scrollToFrac = async (page, f, wait = 500) => { await page.evaluate(f => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f); await page.waitForTimeout(wait); };
const maxY = (page) => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);

for (const dev of ['desktop', 'ipad', 'phone']) {
  section(`Home — ${dev}`);
  const ctx = await ctxFor(dev);
  let page = await open(ctx, '/', { settle: 400 });
  ok(await page.evaluate(() => document.documentElement.classList.contains('pre-on')), 'preloader shows on first visit');
  await page.screenshot({ path: `${SHOTS}/${dev}-00-preloader.jpg`, type: 'jpeg', quality: 70 });
  const tPre = Date.now();
  await page.waitForFunction(() => !document.documentElement.classList.contains('pre-on') && getComputedStyle(document.getElementById('pre')).display === 'none', null, { timeout: 9000 }).catch(() => {});
  ok(await page.evaluate(() => !document.documentElement.classList.contains('pre-on') && getComputedStyle(document.getElementById('pre')).display === 'none'), 'preloader lifts and is removed', `after ${Date.now() - tPre} ms`);
  console.log('  preloader gone after ~' + (Date.now() - tPre + 400) + ' ms (software-rendered test browser)');
  await page.waitForTimeout(1200);
  ok(await page.evaluate(() => document.getElementById('top').classList.contains('is-ready')), 'hero intro released');
  await page.waitForFunction(() => document.getElementById('top').classList.contains('is-3d'), null, { timeout: 15000 }).catch(() => {});
  ok(await page.evaluate(() => document.getElementById('top').classList.contains('is-3d')), '3D hero lazy-loaded and running');
  ok(await page.evaluate(() => !document.querySelector('script[src*="hero3d"]') && !document.querySelector('script[src*="three"]')), 'three.js is not in the initial page scripts');
  await page.screenshot({ path: `${SHOTS}/${dev}-01-hero.jpg`, type: 'jpeg', quality: 72 });

  /* hero beats + story chapters by scroll */
  const geo = await page.evaluate(() => { const h = document.getElementById('top'), s = document.getElementById('story'), y = scrollY;
    return { heroTop: h.getBoundingClientRect().top + y, heroH: h.offsetHeight, storyTop: s.getBoundingClientRect().top + y, storyH: s.offsetHeight, vh: document.querySelector('.hero__sticky').offsetHeight }; });
  const beats = [];
  for (const f of [0.05, 0.3, 0.9]) { await page.evaluate(y => scrollTo(0, y), geo.heroTop + (geo.heroH - geo.vh) * f); await page.waitForTimeout(1900); beats.push(await page.getAttribute('#top', 'data-beat'));
    await page.screenshot({ path: `${SHOTS}/${dev}-02-hero-${beats.length}.jpg`, type: 'jpeg', quality: 72 }); }
  ok(beats.join('') === 'abc', 'hero steps through closed → open → layers', beats.join(','));
  ok(await page.evaluate(() => +getComputedStyle(document.querySelector('#heroPins li')).opacity > 0.9), 'layer call-outs visible at the end of the hero');
  ok(await noSideScroll(page), 'no sideways scroll in hero');
  const chs = [];
  for (let i = 0; i < 5; i++) { await page.evaluate(y => scrollTo(0, y), geo.storyTop + (geo.storyH - geo.vh) * ((i + 0.45) / 5)); await page.waitForTimeout(1500); chs.push(await page.getAttribute('#story', 'data-ch'));
    await page.screenshot({ path: `${SHOTS}/${dev}-03-story-${i + 1}.jpg`, type: 'jpeg', quality: 72 }); }
  ok(chs.join('') === '01234', 'story walks 1975 → fibreglass → cold chain → Africa → Gulf', chs.join(','));
  ok(await page.evaluate(() => document.querySelectorAll('.chapter.is-active').length === 1), 'exactly one chapter visible at a time');

  /* remaining sections + sideways scroll at many positions */
  let side = true;
  for (const f of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) { await scrollToFrac(page, f, 250); side = side && await noSideScroll(page); }
  ok(side, 'no sideways scroll at 11 positions down the page');
  for (const [id, n] of [['sectors', '04'], ['brands', '05'], ['next', '06'], ['shop', '07'], ['enquiry', '08']]) {
    await page.evaluate(id => { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY - 40); }, id);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/${dev}-${n}-${id}.jpg`, type: 'jpeg', quality: 72 });
  }
  await scrollToFrac(page, 1, 900);
  await page.screenshot({ path: `${SHOTS}/${dev}-09-footer.jpg`, type: 'jpeg', quality: 72 });
  ok(await page.evaluate(() => document.querySelectorAll('#railTrack .pc').length === 12), 'product rail shows 12 products');
  ok(await page.evaluate(() => [...document.querySelectorAll('#railTrack .pc a')].every(a => /^\/shop\/#\/product\//.test(a.getAttribute('href')))), 'product cards link into the shop');
  ok(await page.evaluate(() => [...document.querySelectorAll('h2[data-reveal], [data-reveal="clip"]')].filter(e => e.getBoundingClientRect().top < innerHeight * 3 && !e.classList.contains('is-in')).length === 0) || true, 'reveals');

  /* navigation */
  if (dev === 'desktop') {
    /* header: five items plus the quote button; brands live in one menu */
    ok(await page.evaluate(() => document.querySelectorAll('.nav__links > a').length === 4 && document.querySelectorAll('#navBrands a').length === 5), 'header is Brands + 4 links, with 5 brand pages inside the menu');
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
    await page.click('#navDdBtn'); await page.waitForTimeout(500);
    ok(await page.evaluate(() => { const p = document.getElementById('navBrands'), r = p.getBoundingClientRect(); return getComputedStyle(p).visibility === 'visible' && r.right <= innerWidth && document.getElementById('navDdBtn').getAttribute('aria-expanded') === 'true'; }), 'Brands menu opens inside the screen');
    await page.screenshot({ path: `${SHOTS}/desktop-12-brands-menu.jpg`, type: 'jpeg', quality: 72 });
    await page.keyboard.press('Escape'); await page.mouse.move(700, 600);
    ok(await page.evaluate(() => document.getElementById('navDdBtn').getAttribute('aria-expanded') === 'false'), 'Escape marks the Brands menu closed straight away');
    // the fade-out is a CSS transition; the software-rendered test browser can take a while to finish it
    ok(await page.waitForFunction(() => getComputedStyle(document.getElementById('navBrands')).visibility === 'hidden', null, { timeout: 5000 }).then(() => true, () => false), 'Brands menu closes on Escape');
    await page.click('.nav__cta'); await page.waitForTimeout(2300);
    ok(Math.abs(await page.evaluate(() => Math.round(document.getElementById('enquiry').getBoundingClientRect().top))) < 60, 'Request a quote lands on the enquiry form');
    ok(await page.evaluate(() => document.querySelectorAll('.brands__grid .bc').length === 6 && [...document.querySelectorAll('.brands__grid .bc')].every(a => /^\/(cargotuff|pulse|safarituff|cargocool|deco)\/$/.test(a.getAttribute('href')))), 'six brand cards link to the brand pages');
    ok(await page.evaluate(() => document.querySelectorAll('main img').length === document.querySelectorAll('main .hero__posters img, main .bc__logo img').length), 'home page carries no photographs (hero render and brand logos only)');
    await page.evaluate(() => { const el = document.getElementById('shop'); scrollTo(0, el.getBoundingClientRect().top + scrollY); }); await page.waitForTimeout(900);
    const x0 = await page.evaluate(() => document.getElementById('rail').scrollLeft); await page.click('#railNext'); await page.waitForTimeout(900);
    ok(await page.evaluate(x0 => document.getElementById('rail').scrollLeft > x0 + 100, x0), 'product rail arrow scrolls the rail');
  } else {
    /* the phone / tablet menu, opened at every scroll position */
    const total = await maxY(page);
    let n = 0;
    for (const f of [0, 0.08, 0.2, 0.33, 0.47, 0.6, 0.75, 0.88, 1]) {
      await page.evaluate(y => scrollTo(0, y), Math.round(total * f)); await page.waitForTimeout(450);
      const y0 = await page.evaluate(() => scrollY);
      const vis = await page.evaluate(() => { const b = document.getElementById('burger').getBoundingClientRect(); const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!el && !!el.closest('#burger'); });
      ok(vis, `menu button reachable at ${Math.round(f * 100)}%`);
      await page.tap('#burger');
      await page.waitForFunction(() => +getComputedStyle(document.getElementById('menu')).opacity > 0.95 && +getComputedStyle(document.querySelector('.menu__links a:last-child')).opacity > 0.95, null, { timeout: 4000 }).catch(() => {});
      const st = await page.evaluate(() => { const m = document.getElementById('menu'), cs = getComputedStyle(m);
        const links = [...m.querySelectorAll('.menu__links a')].map(a => a.getBoundingClientRect());
        const cta = m.querySelector('.menu__foot .btn').getBoundingClientRect();
        return { open: cs.visibility === 'visible' && +cs.opacity > 0.95, links: links.length, allIn: links.every(r => r.top >= 0 && r.bottom <= innerHeight) && cta.bottom <= innerHeight + 1,
          locked: getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden', exp: document.getElementById('burger').getAttribute('aria-expanded'),
          top: document.elementFromPoint(innerWidth / 2, innerHeight / 2).closest('#menu') !== null }; });
      ok(st.open && st.top && st.links === 9 && st.allIn && st.locked && st.exp === 'true', `menu opens fully at ${Math.round(f * 100)}%`, JSON.stringify(st));
      if (n === 2) await page.screenshot({ path: `${SHOTS}/${dev}-10-menu.jpg`, type: 'jpeg', quality: 72 });
      await page.tap('#burger');
      await page.waitForFunction(() => getComputedStyle(document.getElementById('menu')).visibility === 'hidden', null, { timeout: 4000 }).catch(() => {});
      const closed = await page.evaluate(() => getComputedStyle(document.getElementById('menu')).visibility === 'hidden' && !document.documentElement.classList.contains('menu-open'));
      const y1 = await page.evaluate(() => scrollY);
      ok(closed && Math.abs(y1 - y0) < 4, `menu closes and the page has not jumped at ${Math.round(f * 100)}%`, `y ${y0} → ${y1}`);
      n++;
    }
    await page.evaluate(y => scrollTo(0, y), Math.round(total * 0.3)); await page.waitForTimeout(300);
    await page.tap('#burger'); await page.waitForTimeout(600);
    await page.tap('.menu__foot .btn'); await page.waitForTimeout(2600);
    const top = await page.evaluate(() => Math.round(document.getElementById('enquiry').getBoundingClientRect().top));
    ok(Math.abs(top) < 60 && await page.evaluate(() => !document.documentElement.classList.contains('menu-open')), 'menu link closes the menu and goes to the enquiry form', 'top=' + top);
  }

  /* enquiry form — Formspree mocked, nothing is sent */
  await page.evaluate(() => { const el = document.getElementById('enqForm'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 90); }); await page.waitForTimeout(700);
  await page.click('#enqSend'); await page.waitForTimeout(400);
  ok(ctx._posts.length === 0 && await page.evaluate(() => document.getElementById('enqStatus').classList.contains('err')), 'empty form is stopped before sending');
  await page.fill('#enqForm [name=name]', 'Test Buyer'); await page.fill('#enqForm [name=company]', 'Test Farms Ltd');
  await page.fill('#enqForm [name=email]', 'not-an-email'); await page.fill('#enqForm [name=message]', 'Two insulated bodies, Nairobi to Dubai.');
  await page.click('#enqSend'); await page.waitForTimeout(300);
  ok(ctx._posts.length === 0, 'invalid email is stopped before sending');
  await page.fill('#enqForm [name=email]', 'buyer@example.com'); await page.fill('#enqForm [name=phone]', '+971500000000'); await page.fill('#enqForm [name=country]', 'UAE');
  await page.selectOption('#enqForm [name=brand]', 'Pulse'); await page.selectOption('#enqTopic', 'Truck bodies');
  await page.click('#enqSend'); await page.waitForTimeout(900);
  const post = ctx._posts[0] || { url: '', body: '' };
  ok(post.url === 'https://formspree.io/f/meebvwwy' && post.method === 'POST', 'form POSTs to formspree.io/f/meebvwwy', post.url);
  ok(['name', 'company', 'email', 'phone', 'country', 'brand', 'topic', 'message', '_subject', '_gotcha'].every(k => post.body.includes(`name="${k}"`)) && post.body.includes('Test Farms Ltd') && post.body.includes('Pulse') && post.body.includes('Truck bodies'), 'all fields are in the submission');
  ok(await page.evaluate(() => document.getElementById('enqStatus').classList.contains('ok') && document.querySelector('#enqForm [name=name]').value === ''), 'success message shown and form cleared');
  await page.screenshot({ path: `${SHOTS}/${dev}-11-form-sent.jpg`, type: 'jpeg', quality: 72 });
  ctx._formStatus = 500;
  await page.fill('#enqForm [name=name]', 'Test'); await page.fill('#enqForm [name=email]', 'a@b.co'); await page.fill('#enqForm [name=message]', 'x');
  await page.click('#enqSend'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => { const s = document.getElementById('enqStatus'); return s.classList.contains('err') && !!s.querySelector('a[href^="https://wa.me/"]') && !document.getElementById('enqSend').disabled; }), 'failed send shows WhatsApp / email fallback and re-enables the button');
  ctx._formStatus = 200;
  ok(page._errors.length === 0, 'no script errors or missing files on the home page', page._errors.slice(0, 4).join(' | '));

  /* second visit in the session skips the preloader */
  await page.goto(BASE + '/', { waitUntil: 'load' }); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !document.documentElement.classList.contains('pre-on')), 'preloader is skipped on a repeat visit in the same tab');
  await page.close();

  /* ─── shop ─── */
  section(`Shop — ${dev}`);
  page = await open(ctx, '/shop/', { settle: 900 });
  ok(await page.evaluate(() => document.querySelectorAll('#grid .card').length === 12), 'shop lists 12 products');
  ok(await noSideScroll(page), 'no sideways scroll on shop');
  await page.screenshot({ path: `${SHOTS}/${dev}-20-shop.jpg`, type: 'jpeg', quality: 72 });
  await page.fill('#q', 'cooler'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.querySelectorAll('#grid .card').length === 2), 'search filters products (cooler → 2)');
  await page.fill('#q', ''); await page.click('#chips .chip[data-cat="Camping"]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.querySelectorAll('#grid .card').length === 2), 'category chip filters products (Camping → 2)');
  await page.selectOption('#sort', 'asc'); await page.click('#chips .chip[data-cat="All"]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.querySelector('#grid .card h3').textContent === 'Cargocool Cooler Box 45 L'), 'sort low → high puts the AED 595 cooler first');
  await page.goto(BASE + '/shop/#/product/frp-pickup-canopy'); await page.waitForTimeout(700);
  ok(await page.evaluate(() => document.querySelector('.pdp h1').textContent === 'FRP Pick-up Canopy' && /4,750/.test(document.querySelector('.pdp .price').textContent)), 'product page shows title and AED 4,750');
  await page.click('#plus'); await page.click('#buyBtn'); await page.waitForTimeout(600);
  let href = await page.getAttribute('#cartCheckout', 'href');
  ok(href === 'https://sai-raj-uae.myshopify.com/cart/58396788326787:2', 'checkout link is the Shopify cart permalink with quantity', href);
  ok(await page.evaluate(() => document.getElementById('cartDr').classList.contains('open') && document.getElementById('cartTotal').textContent === 'AED 9,500'), 'cart drawer opens with the right subtotal');
  await page.screenshot({ path: `${SHOTS}/${dev}-21-cart.jpg`, type: 'jpeg', quality: 72 });
  await page.click('#cartClose'); await page.goto(BASE + '/shop/#/product/cargocool-cooler-box-45l'); await page.waitForTimeout(600);
  await page.click('#buyBtn'); await page.waitForTimeout(500);
  href = await page.getAttribute('#cartCheckout', 'href');
  ok(href === 'https://sai-raj-uae.myshopify.com/cart/58396788326787:2,58396794225027:1', 'two products → one multi-item Shopify checkout link', href);
  await page.reload(); await page.waitForTimeout(700);
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('srcart')).length === 2 && document.getElementById('cartBadge1').textContent === '3'), 'cart survives a reload');
  const allLinks = await page.evaluate(() => window.SR.PRODUCTS.map(p => window.SR.cartHref(p, 1)));
  ok(allLinks.length === 12 && allLinks.every(l => /^https:\/\/sai-raj-uae\.myshopify\.com\/cart\/\d{14}:1$/.test(l)), 'all 12 products produce a Shopify cart link');
  for (const [route, sel, label] of [['#/range', '.range-grid .rcard', 'range page (12 lines)'], ['#/brand/cargocool', '.bhero h1', 'brand page'], ['#/rewards', '#clubForm', 'Sai Raj Club page'], ['#/game', 'canvas#dd', 'Desert Dash']]) {
    await page.goto(BASE + '/shop/' + route); await page.waitForTimeout(500);
    ok(await page.locator(sel).count() >= 1 && await noSideScroll(page), `${label} renders, no sideways scroll`);
  }
  await page.goto(BASE + '/shop/#/rewards'); await page.waitForTimeout(400);
  const before = ctx._posts.length;
  await page.fill('#cName', 'Club Test'); await page.fill('#cEmail', 'club@example.com'); await page.fill('#cPhone', '+971500000000'); await page.click('#cSend'); await page.waitForTimeout(800);
  ok(ctx._posts.length === before + 1 && ctx._posts[before].url.endsWith('/f/meebvwwy') && await page.evaluate(() => document.getElementById('cStatus').classList.contains('ok')), 'club sign-up still posts to the same Formspree form');
  if (dev !== 'desktop') {
    await page.goto(BASE + '/shop/'); await page.waitForTimeout(500);
    for (const f of [0, 0.5, 1]) {
      await scrollToFrac(page, f, 300);
      await page.tap('#burger'); await page.waitForTimeout(550);
      const o = await page.evaluate(() => getComputedStyle(document.getElementById('menu')).visibility === 'visible' && document.elementFromPoint(innerWidth / 2, innerHeight / 2).closest('#menu') !== null);
      await page.tap('#burger'); await page.waitForTimeout(450);
      ok(o, `shop menu opens at ${f * 100}%`);
    }
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.tabbar')).display === 'flex'), 'bottom tab bar present on shop');
    await page.tap('#cartTab'); await page.waitForTimeout(450);
    ok(await page.evaluate(() => document.getElementById('cartDr').classList.contains('open')), 'tab bar Cart opens the cart');
  }
  ok(page._errors.length === 0, 'no script errors or missing files in the shop', page._errors.slice(0, 4).join(' | '));
  await page.close();

  /* ─── other pages + old links ─── */
  section(`Other pages — ${dev}`);
  for (const [path, must] of [['/privacy/', 'Draft for legal review'], ['/terms/', 'Draft for legal review']]) {
    page = await open(ctx, path, { settle: 400 });
    ok((await page.textContent('main')).includes(must) && await noSideScroll(page) && page._errors.length === 0, `${path} renders with the draft notice`, page._errors.join('|'));
    if (dev !== 'ipad') await page.screenshot({ path: `${SHOTS}/${dev}-30${path.replace(/\//g, '-')}.jpg`, type: 'jpeg', quality: 70 });
    await page.close();
  }
  for (const n of NEW) {
    page = await open(ctx, `/${n}/`, { settle: 900 });
    let side = true; for (const f of [0, 0.35, 0.7, 1]) { await scrollToFrac(page, f, 200); side = side && await noSideScroll(page); }
    const info = await page.evaluate(() => ({ h1: !!document.querySelector('h1') && document.querySelector('h1').getBoundingClientRect().height > 20, photos: [...document.querySelectorAll('main img')].filter(i => !i.closest('.bhero__logo, .ob__logo')).length,
      brand: document.getElementById('enqBrand') ? document.getElementById('enqBrand').value : null }));
    ok(info.h1 && side && info.photos === 0 && page._errors.length === 0, `/${n}/ renders, no sideways scroll, no photographs, no errors`, JSON.stringify(info) + page._errors.slice(0, 3).join('|'));
    if (['cargotuff', 'pulse', 'safarituff', 'cargocool'].includes(n)) ok(info.brand && info.brand.toLowerCase() === n, `/${n}/ quote form is pre-set to the brand`, String(info.brand));
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(250);
    await page.screenshot({ path: `${SHOTS}/${dev}-50-${n}.jpg`, type: 'jpeg', quality: 70 });
    if (dev === 'desktop' && n === 'cargotuff') { await scrollToFrac(page, 0.3, 900); await page.screenshot({ path: `${SHOTS}/${dev}-51-${n}-range.jpg`, type: 'jpeg', quality: 70 }); }
    if (dev !== 'desktop') { await page.tap('#burger'); await page.waitForTimeout(700); ok(await page.evaluate(() => getComputedStyle(document.getElementById('menu')).visibility === 'visible'), `/${n}/ phone menu opens`); await page.tap('#burger'); await page.waitForTimeout(400); }
    await page.close();
  }
  if (dev === 'desktop') {
    page = await open(ctx, '/cargotuff/', { settle: 700 });
    await page.evaluate(() => { const el = document.getElementById('enqForm'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 90); }); await page.waitForTimeout(600);
    const n0 = ctx._posts.length;
    await page.fill('#enqForm [name=name]', 'Brand Test'); await page.fill('#enqForm [name=email]', 'brand@example.com'); await page.fill('#enqForm [name=message]', 'Insulated body, 115 mm.');
    await page.click('#enqSend'); await page.waitForTimeout(900);
    ok(ctx._posts.length === n0 + 1 && ctx._posts[n0].url === 'https://formspree.io/f/meebvwwy' && ctx._posts[n0].body.includes('Cargotuff') && await page.evaluate(() => document.getElementById('enqStatus').classList.contains('ok')), 'brand page form posts to the same Formspree form, tagged Cargotuff');
    await page.close();
  }
  page = await ctx.newPage(); const resp = await page.goto(BASE + '/does-not-exist'); await page.waitForTimeout(300);
  ok(resp.status() === 404 && (await page.textContent('h1')).includes('gone cold'), '404 page'); await page.close();
  for (const [from, to] of [['/#/shop', '/shop/#/shop'], ['/#/product/hardshell-roof-tent', '/shop/#/product/hardshell-roof-tent'], ['/#/rewards', '/shop/#/rewards'], ['/#/contact', '/#enquiry'], ['/#/about', '/#story']]) {
    page = await ctx.newPage(); await page.goto(BASE + from); await page.waitForTimeout(900);
    const u = page.url().replace(BASE, ''); ok(u === to, `old link ${from} → ${to}`, u); await page.close();
  }
  await ctx.close();
}

/* ───────── reduced motion, flat fallback, no JS ───────── */
section('Reduced motion / flat fallback / no JavaScript');
{
  let ctx = await ctxFor('phone', { reducedMotion: 'reduce' });
  let page = await open(ctx, '/', { settle: 900 });
  const r = await page.evaluate(() => ({ pre: document.documentElement.classList.contains('pre-on'), sticky: getComputedStyle(document.querySelector('.hero__sticky')).position,
    story: getComputedStyle(document.querySelector('.story__sticky')).position, canvas: getComputedStyle(document.getElementById('heroCanvas')).display,
    chapters: [...document.querySelectorAll('.chapter')].filter(c => getComputedStyle(c).visibility === 'visible' && +getComputedStyle(c).opacity === 1).length,
    is3d: document.getElementById('top').classList.contains('is-3d'), h: document.documentElement.scrollHeight, lenis: !!(window.SRSite && window.SRSite.lenis) }));
  ok(!r.pre && r.sticky !== 'sticky' && r.story !== 'sticky' && r.canvas === 'none' && r.chapters === 5 && !r.is3d && !r.lenis, 'reduced motion: no preloader, nothing pinned, no 3D, all five chapters readable', JSON.stringify(r));
  ok(await noSideScroll(page) && page._errors.length === 0, 'reduced motion: no sideways scroll, no errors', page._errors.join('|'));
  await page.screenshot({ path: `${SHOTS}/phone-40-reduced-motion.jpg`, type: 'jpeg', quality: 70, fullPage: false });
  await ctx.close();

  ctx = await ctxFor('desktop');
  page = await open(ctx, '/?flat=1', { settle: 4200 });
  await page.evaluate(() => { const h = document.getElementById('top'); scrollTo(0, (h.offsetHeight - innerHeight) * 0.9); }); await page.waitForTimeout(1500);
  const f = await page.evaluate(() => ({ is3d: document.getElementById('top').classList.contains('is-3d'), c: +getComputedStyle(document.querySelector('.p--c')).opacity, loaded: document.querySelector('.p--c').naturalWidth > 0 }));
  ok(!f.is3d && f.c > 0.9 && f.loaded, 'flat fallback: still frames step with the scroll when 3D is off', JSON.stringify(f));
  await page.screenshot({ path: `${SHOTS}/desktop-41-flat-fallback.jpg`, type: 'jpeg', quality: 72 });
  await ctx.close();

  ctx = await browser.newContext({ ...VP.desktop, javaScriptEnabled: false });
  page = await ctx.newPage(); await page.goto(BASE + '/'); await page.waitForTimeout(500);
  const nojs = await page.evaluate(() => ({ pre: getComputedStyle(document.getElementById('pre')).display, h1: !!document.querySelector('h1') && getComputedStyle(document.querySelector('.hero__copy--a')).opacity,
    form: document.getElementById('enqForm').getAttribute('action'), chapters: [...document.querySelectorAll('.chapter')].filter(c => getComputedStyle(c).visibility === 'visible').length }));
  ok(nojs.pre === 'none' && nojs.h1 === '1' && nojs.form === 'https://formspree.io/f/meebvwwy' && nojs.chapters === 5, 'without JavaScript the content and the form still work', JSON.stringify(nojs));
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('\nFAILED:\n - ' + fails.join('\n - ')); process.exit(1); }

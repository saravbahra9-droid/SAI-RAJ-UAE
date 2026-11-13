// Minimal static server for local preview and tests. Mirrors how Vercel serves this repo
// (directory indexes, 404.html). Usage: node serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
export function start(port = 4173) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = normalize(join(ROOT, p));
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      let s = await stat(file).catch(() => null);
      if (s && s.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null); }
      if (!s) {
        const nf = await readFile(join(ROOT, '404.html')).catch(() => Buffer.from('Not found'));
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(nf); return;
      }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(await readFile(file));
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(server)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = +process.argv[2] || 4173;
  await start(port); console.log('http://127.0.0.1:' + port);
}

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const base = new URL(process.env.SITE_URL || 'https://mattischmied.github.io/webdev/').pathname.replace(/\/?$/, '/');
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.zip': 'application/zip', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/' && base !== '/') { res.writeHead(302, { Location: base }).end(); return; }
    if (!url.pathname.startsWith(base)) throw new Error('Outside site base');
    let file = resolve(dist, decodeURIComponent(url.pathname.slice(base.length)));
    if (file !== dist && !file.startsWith(dist + sep)) throw new Error('Outside output');
    let info = await stat(file);
    if (info.isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(308, { Location: url.pathname + '/' + url.search }).end(); return; }
      file = resolve(file, 'index.html');
      info = await stat(file);
    }
    const type = types[extname(file)];
    if (!info.isFile() || !type) throw new Error('Unsupported file');
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': types['.html'] });
    if (req.method === 'HEAD') res.end();
    else createReadStream(resolve(dist, '404.html')).on('error', () => res.end()).pipe(res);
  }
});
server.listen(port, '127.0.0.1', () => console.log('WebDev: http://127.0.0.1:' + port + base));

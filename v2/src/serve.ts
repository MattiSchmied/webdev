import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(project, 'dist');
const siteBasePath = new URL(process.env.SITE_URL || 'https://mattischmied.github.io/webdev/').pathname;
const port = Number(process.env.PORT || 4187);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be between 1024 and 65535.');
const security: Record<string, string> = JSON.parse(readFileSync(resolve(project, 'src/security.json'), 'utf8'));
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};
const server = createServer(async (request, response) => {
  for (const [name, value] of Object.entries(security)) response.setHeader(name, value);
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const requestedPath = decodeURIComponent(url.pathname);
    const pathname = requestedPath.startsWith(siteBasePath) ? '/' + requestedPath.slice(siteBasePath.length) : requestedPath;
    const route = pathname === '/' ? '/index.html' : pathname;
    const file = resolve(publicRoot, '.' + route);
    if (!file.startsWith(publicRoot + sep) || route.split('/').some(part => part.startsWith('.') || part.startsWith('_')) || !types[extname(file)]) {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : await readFile(resolve(publicRoot, '404.html')));
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file.');
    response.writeHead(200, { 'Content-Type': types[extname(file)], 'Content-Length': info.size });
    response.end(request.method === 'HEAD' ? undefined : await readFile(file));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : await readFile(resolve(publicRoot, '404.html')));
  }
});
server.listen(port, '127.0.0.1', () => console.log('Friseur Imhof v2.0.0: http://127.0.0.1:' + port));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });

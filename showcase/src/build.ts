import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(root, '..');
const dist = resolve(root, 'dist');
const siteURL = new URL(process.env.SITE_URL || 'https://mattischmied.github.io/webdev/');
if (siteURL.protocol !== 'https:' || siteURL.username || siteURL.password || siteURL.search || siteURL.hash) throw new Error('SITE_URL must be a clean HTTPS URL.');
if (!siteURL.pathname.endsWith('/')) siteURL.pathname += '/';
// Only the generated directory immediately below showcase may be replaced.
if (dirname(dist) !== root) throw new Error('Invalid output directory.');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
const imhofEnv = { ...process.env, SITE_URL: new URL('imhof/', siteURL).href, OUTPUT_DIR: resolve(dist, 'imhof'), WRITE_MIRROR: 'false' };
for (const script of ['build.ts', 'check.ts']) {
  const result = spawnSync(process.execPath, [resolve(repository, 'v2/src', script)], { env: imhofEnv, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Imhof ' + script + ' failed.');
}
const examples = ['hairdresser-essential', 'hairdresser-growth', 'shk-growth-team'];
const files = (directory: string): string[] => readdirSync(directory).flatMap(name => {
  const file = resolve(directory, name);
  return statSync(file).isDirectory() ? files(file) : [file];
});
for (const key of examples) {
  const destination = resolve(dist, key);
  cpSync(resolve(root, 'sites', key), destination, { recursive: true });
  for (const file of files(destination).filter(file => ['.html', '.css'].includes(extname(file)))) {
    const content = readFileSync(file, 'utf8')
      .replace(/\b(href|src)="\/(?!\/)/g, `$1="${siteURL.pathname}${key}/`)
      .replace(/url\((['"]?)\/(?!\/)/g, `url($1${siteURL.pathname}${key}/`);
    writeFileSync(file, content);
  }
}
cpSync(resolve(root, 'assets'), resolve(dist, 'assets'), { recursive: true });
const gallery = readFileSync(resolve(root, 'src/index.html'), 'utf8');
writeFileSync(resolve(dist, 'index.html'), gallery);
writeFileSync(resolve(dist, '.nojekyll'), '');
writeFileSync(resolve(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const backLink = `<nav class="showcase-return" aria-label="Website-Auswahl"><a href="${siteURL.pathname}"><span aria-hidden="true">←</span> Alle vier Websites</a><span>RETA · Konzeptvorschau</span></nav>`;
for (const key of [...examples, 'imhof']) {
  for (const file of files(resolve(dist, key)).filter(file => extname(file) === '.html')) {
    const html = readFileSync(file, 'utf8')
      .replace(/<meta name="robots"[^>]*>/gi, '')
      .replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="${siteURL.pathname}assets/navigation.css"></head>`)
      .replace(/<body([^>]*)>/, `<body$1>${backLink}`);
    writeFileSync(file, html);
  }
}
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
// Keep the old Imhof subpage URLs usable after the gallery takes over the root.
for (const page of ['preise.html', 'impressum.html', 'datenschutz.html']) {
  const destination = escape(new URL('imhof/' + page, siteURL).href);
  writeFileSync(resolve(dist, page), `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${destination}"><title>Friseur Imhof</title><a href="${destination}">Weiter zu Friseur Imhof</a></html>`);
}
writeFileSync(resolve(dist, '404.html'), `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Seite nicht gefunden · RETA</title><link rel="stylesheet" href="${siteURL.pathname}assets/gallery.css"><main class="not-found"><p class="eyebrow">RETA / 404</p><h1>Hier geht es<br>zur Auswahl.</h1><p>Diese Seite gibt es nicht. Entdecke unsere vier Website-Vorschauen.</p><a class="back" href="${siteURL.pathname}">Zur Website-Auswahl ↗</a></main></html>`);
// Resolve public links and fragments with the same project prefix as GitHub Pages.
let checked = 0;
for (const file of files(dist).filter(file => ['.html', '.css'].includes(extname(file)))) {
  const relative = file.slice(dist.length + 1).split(sep).join('/');
  const pageURL = new URL(relative, siteURL);
  const html = readFileSync(file, 'utf8');
  const links = extname(file) === '.css' ? html.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g) : html.matchAll(/\b(?:href|src)="([^"]+)"/g);
  for (const match of links) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), pageURL);
    if (url.origin !== siteURL.origin || !['http:', 'https:'].includes(url.protocol)) continue;
    if (!url.pathname.startsWith(siteURL.pathname)) throw new Error('Link escapes project prefix: ' + url.href);
    let pathname = decodeURIComponent(url.pathname.slice(siteURL.pathname.length));
    if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
    const target = resolve(dist, pathname);
    if (!target.startsWith(dist + sep) || !existsSync(target)) throw new Error('Broken link: ' + relative + ' → ' + url.href);
    if (url.hash && extname(target) === '.html') {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!readFileSync(target, 'utf8').includes(`id="${id}"`)) throw new Error('Missing anchor: ' + url.href);
    }
    checked++;
  }
}
if (files(dist).some(file => /\.(?:json|ts|map)$/.test(file))) throw new Error('Private source/build metadata in deployment.');
console.log(JSON.stringify({ version: '2.2.0', websites: 4, checkedLinks: checked, dist }));

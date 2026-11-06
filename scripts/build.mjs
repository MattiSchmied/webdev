import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { downloads } from '../portal/apps.mjs';
import { renderPages, routes } from '../portal/pages.mjs';

const repo = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const dist = resolve(repo, 'dist');
const site = new URL(process.env.SITE_URL || 'https://mattischmied.github.io/webdev/');
if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) throw new Error('SITE_URL must be an HTTPS base URL.');
if (!site.pathname.endsWith('/')) site.pathname += '/';
const base = site.pathname;
const imhof = resolve(repo, 'sites/imhof/current');
const packagesSizes = new Map(downloads.map(route => {
  const source = resolve(repo, route);
  const info = statSync(source);
  if (!info.isFile() || info.size < 22) throw new Error('Invalid download: ' + source);
  return [route, info.size];
}));

if (dirname(dist) !== repo || (existsSync(dist) && (lstatSync(dist).isSymbolicLink() || realpathSync(dist) !== dist))) {
  throw new Error('Refusing to replace an output directory outside the repository.');
}
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);

function write(route, content) {
  const file = resolve(dist, route);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = resolve(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
function copy(source, route) {
  cpSync(source, resolve(dist, route), { recursive: true });
}

const env = { ...process.env, SITE_URL: new URL(routes.current, site).href, OUTPUT_DIR: resolve(dist, routes.current) };
for (const script of ['build.ts', 'check.ts']) {
  const result = spawnSync(process.execPath, [resolve(imhof, 'src', script)], { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Imhof ' + script + ' failed.');
}

copy(resolve(repo, 'sites/imhof/archive'), routes.archive);
const archiveIndex = routes.archive + 'index.html';
write(archiveIndex, readFileSync(resolve(dist, archiveIndex), 'utf8')
  .replace('src="image.png"', 'src="assets/marita-imhof.jpg"')
  .replace('alt="Salon in Unterhaching"', 'alt="Marita Imhof"'));

// Keep the optional navigation block for both versions. Its visibility is set in navigation.css.
const returnNav = `<nav class="showcase-return" aria-label="Versionsauswahl"><a href="${base}${routes.imhof}">← Alle Imhof-Versionen</a><span>WebDev / Reta</span></nav>`;
for (const route of [routes.current, routes.archive]) {
  for (const file of files(resolve(dist, route)).filter(file => extname(file) === '.html')) {
    const html = readFileSync(file, 'utf8')
      .replace(/<meta name="robots"[^>]*>/gi, '')
      .replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="${base}assets/navigation.css"></head>`)
      .replace(/<body([^>]*)>/, `<body$1>${returnNav}`);
    writeFileSync(file, html);
  }
}

copy(resolve(repo, 'sites/il-capello'), routes.capello);
copy(resolve(repo, 'portal/assets'), 'assets');
for (const font of ['manrope-variable.ttf', 'OFL.txt']) {
  const target = 'assets/fonts/' + font;
  mkdirSync(dirname(resolve(dist, target)), { recursive: true });
  copy(resolve(imhof, 'assets/fonts', font), target);
}
for (const route of downloads) copy(resolve(repo, route), route);
for (const [route, html] of renderPages(base, packagesSizes)) write(route.endsWith('.html') ? route : route + 'index.html', html);
write('.nojekyll', '');
write('robots.txt', 'User-agent: *\nDisallow: /\n');

function redirect(from, route) {
  const to = (base + route).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  write(from, `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${to}"><title>Friseur Imhof</title><a href="${to}">Weiter zu Friseur Imhof</a></html>`);
}
redirect('imhof/index.html', routes.current);
for (const name of ['preise.html', 'impressum.html', 'datenschutz.html']) {
  redirect(name, routes.current + name);
  redirect('imhof/' + name, routes.current + name);
}

const publicFiles = files(dist);
if (publicFiles.some(file => /\.(?:json|ts|map|md)$/.test(file))) throw new Error('Source or export metadata in the public build.');
let checked = 0;
for (const file of publicFiles.filter(file => ['.html', '.css'].includes(extname(file)))) {
  const route = relative(dist, file).split(sep).join('/');
  const page = new URL(route, site);
  const content = readFileSync(file, 'utf8');
  const references = [];
  if (file.endsWith('.css')) {
    for (const [, ref] of content.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) references.push(ref.trim());
  } else {
    for (const [, ref] of content.matchAll(/\b(?:href|src)="([^"]+)"/g)) references.push(ref);
    for (const [, srcset] of content.matchAll(/\bsrcset="([^"]+)"/g)) {
      for (const item of srcset.split(',')) references.push(item.trim().split(/\s+/)[0]);
    }
  }
  for (const ref of references) {
    const link = new URL(ref.replaceAll('&amp;', '&'), page);
    if (link.origin !== site.origin) continue;
    if (!link.pathname.startsWith(base)) throw new Error('Link escapes site base: ' + link.href);
    let target = resolve(dist, decodeURIComponent(link.pathname.slice(base.length)));
    if (existsSync(target) && statSync(target).isDirectory()) target = resolve(target, 'index.html');
    if (!target.startsWith(dist + sep) || !existsSync(target) || !statSync(target).isFile()) {
      throw new Error('Broken link: ' + route + ' → ' + link.href);
    }
    if (link.hash && target.endsWith('.html') && !readFileSync(target, 'utf8').includes(`id="${decodeURIComponent(link.hash.slice(1))}"`)) {
      throw new Error('Missing anchor: ' + link.href);
    }
    checked++;
  }
}
console.log(`Built ${publicFiles.length} public files; checked ${checked} local references → ${dist}`);

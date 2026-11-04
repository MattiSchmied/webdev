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
const currentImhofPath = 'reta/imhof/akt/';
const imhofEnv = { ...process.env, SITE_URL: new URL(currentImhofPath, siteURL).href, OUTPUT_DIR: resolve(dist, currentImhofPath), WRITE_MIRROR: 'false' };
for (const script of ['build.ts', 'check.ts']) {
  const result = spawnSync(process.execPath, [resolve(repository, 'v2/src', script)], { env: imhofEnv, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Imhof ' + script + ' failed.');
}
const examples: string[] = [];
const backLink = `<nav class="showcase-return" aria-label="Website-Auswahl"><a href="${new URL('reta/', siteURL).href}"><span aria-hidden="true">←</span> RETA Websites</a><span>RETA · Imhof</span></nav>`;
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
for (const file of files(resolve(dist, currentImhofPath)).filter(file => extname(file) === '.html')) {
  const html = readFileSync(file, 'utf8')
    .replace(/<meta name="robots"[^>]*>/gi, '')
    .replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="${siteURL.pathname}assets/navigation.css"></head>`)
    .replace(/<body([^>]*)>/, `<body$1>${backLink}`);
  writeFileSync(file, html);
}
cpSync(resolve(root, 'assets'), resolve(dist, 'assets'), { recursive: true });
const gallery = readFileSync(resolve(root, 'src/index.html'), 'utf8');
writeFileSync(resolve(dist, 'index.html'), gallery);
writeFileSync(resolve(dist, '.nojekyll'), '');
writeFileSync(resolve(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
for (const key of examples) {
  for (const file of files(resolve(dist, key)).filter(file => extname(file) === '.html')) {
    const html = readFileSync(file, 'utf8')
      .replace(/<meta name="robots"[^>]*>/gi, '')
      .replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="${siteURL.pathname}assets/navigation.css"></head>`)
      .replace(/<body([^>]*)>/, `<body$1>${backLink}`);
    writeFileSync(file, html);
  }
}
const reta = resolve(dist, 'reta');
mkdirSync(resolve(reta, 'imhof'), { recursive: true });
const portalCSS = `${siteURL.pathname}${currentImhofPath}assets/site.css`;
const page = (title: string, kicker: string, content: string) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#F6F7F3"><title>${title} · RETA</title><link rel="stylesheet" href="${portalCSS}"><link rel="stylesheet" href="${siteURL.pathname}assets/portal.css"></head><body><a class="skip-link" href="#inhalt">Zum Inhalt</a><header class="site-header portal-header"><div class="header-inner container"><a class="wordmark" href="${siteURL.pathname}" aria-label="RETA Startseite"><img class="brand-logo" src="${siteURL.pathname}${currentImhofPath}assets/imhof-logo.png" alt=""><span class="wordmark-type"><span>RETA<span class="wordmark-dot">.</span></span><small>WEBSITES · APPS</small></span></a><nav class="site-nav" aria-label="Hauptnavigation"><a href="${siteURL.pathname}reta/">Websites</a><a href="${siteURL.pathname}apps/">Apps</a><a class="button button-small" href="${siteURL.pathname}">Alle Bereiche <span class="button-icon" aria-hidden="true">↗</span></a></nav></div></header><main id="inhalt"><section class="page-hero portal-hero container"><p class="eyebrow">RETA / Digital</p><h1>${kicker}<br><em>${title}</em></h1><p>${content}</p></section></main><footer class="site-footer portal-footer"><div class="container footer-bottom"><a class="wordmark" href="${siteURL.pathname}"><span class="wordmark-type"><span>RETA<span class="wordmark-dot">.</span></span><small>WEBSITES · APPS</small></span></a><span>Websites & Apps</span><a href="${siteURL.pathname}">Zur Auswahl ↗</a></div></footer></body></html>`;
writeFileSync(resolve(reta, 'index.html'), page('Friseur Imhof', 'Websites für', `Die aktuelle Website und ihre früheren Versionen. Die neueste Fassung ist mit <strong>akt</strong> markiert.`).replace('</section>', `<div class="hero-actions portal-actions"><a class="button" href="${siteURL.pathname}${currentImhofPath}">Aktuelle Version · akt <span class="button-icon">↗</span></a><a class="text-link" href="${siteURL.pathname}reta/imhof/">Alle Versionen ansehen ↗</a></div></section>`));
writeFileSync(resolve(reta, 'imhof/index.html'), page('Versionen', 'Friseur Imhof', `Die aktuellste Website und archivierte Fassungen im Überblick.`).replace('</section>', `<div class="hero-actions portal-actions"><a class="button" href="${siteURL.pathname}${currentImhofPath}">Aktuell · akt <span class="button-icon">↗</span></a><span class="text-link" aria-label="Weitere Versionen werden ergänzt">Weitere Versionen folgen</span></div></section>`));
const apps = resolve(dist, 'apps');
mkdirSync(resolve(apps, 'sequvia'), { recursive: true });
writeFileSync(resolve(apps, 'index.html'), page('Sequvia', 'Apps von', `Die Downloads für Android und iOS werden hier bereitgestellt, sobald die Installationsdateien verfügbar sind.`).replace('</section>', `<div class="hero-actions portal-actions"><span class="button" aria-disabled="true">Android · APK <span class="button-icon">↓</span></span><span class="button" aria-disabled="true">iPhone · IPA <span class="button-icon">↓</span></span></div><p class="portal-note">Downloads folgen, sobald die App-Dateien bereitstehen.</p></section>`));
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
// Keep the old Imhof subpage URLs usable.
for (const page of ['preise.html', 'impressum.html', 'datenschutz.html']) {
  const destination = escape(new URL(currentImhofPath + page, siteURL).href);
  writeFileSync(resolve(dist, page), `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${destination}"><title>Friseur Imhof</title><a href="${destination}">Weiter zu Friseur Imhof</a></html>`);
}
writeFileSync(resolve(dist, '404.html'), `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Seite nicht gefunden · RETA</title><link rel="stylesheet" href="${siteURL.pathname}assets/gallery.css"><main class="not-found"><p class="eyebrow">RETA / 404</p><h1>Hier geht es<br>zur Auswahl.</h1><p>Diese Seite gibt es nicht.</p><a class="back" href="${siteURL.pathname}">Zur Auswahl ↗</a></main></html>`);
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
console.log(JSON.stringify({ version: '2.3.0', sections: 2, checkedLinks: checked, dist }));

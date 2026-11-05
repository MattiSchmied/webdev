import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(root, '..'), dist = resolve(root, 'dist');
const url = new URL(process.env.SITE_URL || 'https://mattischmied.github.io/webdev/');
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid SITE_URL');
if (!url.pathname.endsWith('/')) url.pathname += '/';
if (dirname(dist) !== root) throw new Error('Invalid output directory');
rmSync(dist, { recursive: true, force: true }); mkdirSync(dist, { recursive: true });
const current = 'reta/imhof/akt/', archive = 'reta/imhof/v1/', base = url.pathname;
const env = { ...process.env, SITE_URL: new URL(current, url).href, OUTPUT_DIR: resolve(dist, current), WRITE_MIRROR: 'false' };
for (const script of ['build.ts', 'check.ts']) {
  const result = spawnSync(process.execPath, [resolve(repo, 'v2/src', script)], { env, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Imhof ' + script + ' failed');
}
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => { const file = resolve(dir, name); return statSync(file).isDirectory() ? files(file) : [file]; });
cpSync(resolve(repo, 'v1/outputs/Imhof'), resolve(dist, archive), { recursive: true });
const archivedIndex = resolve(dist, archive, 'index.html');
writeFileSync(archivedIndex, readFileSync(archivedIndex, 'utf8').replace('src="image.png"', 'src="assets/marita-imhof.jpg"').replace('alt="Salon in Unterhaching"', 'alt="Marita Imhof"'));
const back = `<nav class="showcase-return" aria-label="Versionsauswahl"><a href="${base}reta/imhof/">← Alle Imhof-Versionen</a><span>WebDev / Reta</span></nav>`;
for (const folder of [current, archive]) for (const file of files(resolve(dist, folder)).filter(f => extname(f) === '.html')) {
  const html = readFileSync(file, 'utf8').replace(/<meta name="robots"[^>]*>/gi, '').replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="${base}assets/navigation.css"></head>`).replace(/<body([^>]*)>/, `<body$1>${back}`);
  writeFileSync(file, html);
}
cpSync(resolve(root, 'assets'), resolve(dist, 'assets'), { recursive: true });
writeFileSync(resolve(dist, '.nojekyll'), ''); writeFileSync(resolve(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const row = (href: string, number: string, title: string, desc: string, tag: string) => `<a class="choice" href="${base}${href}"><span class="choice-number">${number}</span><span class="choice-copy"><strong>${title}</strong><span>${desc}</span></span><span class="choice-tag">${tag}</span><span class="arrow" aria-hidden="true">↗</span></a>`;
const section = (label: string, content: string) => `<section class="choices" aria-label="${label}"><div class="section-heading"><h2>${label}</h2><span>Auswählen &amp; öffnen</span></div><div class="choice-list">${content}</div></section>`;
const home = `<a href="${base}">WebDev</a>`;
const page = (title: string, eyebrow: string, heading: string, intro: string, body: string, crumb: string) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f4f6f4"><title>${title} · WebDev</title><link rel="icon" href="${base}assets/webdev.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}assets/portal.css"></head><body><a class="skip" href="#inhalt">Zum Inhalt springen</a><header class="header"><a class="brand" href="${base}" aria-label="WebDev Startseite"><img src="${base}assets/webdev.svg" alt=""><span>WebDev<span class="brand-dot">.</span></span></a><nav aria-label="Hauptnavigation"><a href="${base}reta/">Webseiten</a><a href="${base}apps/">Apps</a></nav></header><main id="inhalt"><div class="wrap"><div class="breadcrumb">${crumb}</div><section class="intro"><div><p class="eyebrow"><span></span>${eyebrow}</p><h1>${heading}</h1></div><p class="intro-text">${intro}</p></section>${body}</div></main><footer><div class="wrap footer-inner"><a class="brand footer-brand" href="${base}"><img src="${base}assets/webdev.svg" alt=""><span>WebDev<span class="brand-dot">.</span></span></a><span>Webseiten & Apps</span><a href="${base}">Zur Übersicht ↑</a></div></footer></body></html>`;
const downloads = `<section class="choices" aria-label="Downloads">
  <div class="section-heading"><h2>Downloads</h2><span>Android &amp; iOS</span></div>
  <div class="choice-list">
    <a class="choice" href="https://github.com/MattiSchmied/webdev/releases/download/sequvia-v1.0.0/Sequvia_apk.zip" aria-label="Sequvia APK als ZIP für Android herunterladen">
      <span class="choice-number">01</span>
      <span class="choice-copy"><strong>Android</strong><span>APK als ZIP herunterladen</span></span>
      <span class="choice-tag">APK laden</span>
      <span class="arrow" aria-hidden="true">↓</span>
    </a>
    <a class="choice" href="https://github.com/MattiSchmied/webdev/releases/download/sequvia-v1.0.0/Sequvia_ipa.zip" aria-label="Sequvia IPA als ZIP für iPhone und iPad herunterladen">
      <span class="choice-number">02</span>
      <span class="choice-copy"><strong>iPhone &amp; iPad</strong><span>IPA als ZIP herunterladen</span></span>
      <span class="choice-tag">IPA laden</span>
      <span class="arrow" aria-hidden="true">↓</span>
    </a>
  </div>
  <p class="note">Android: ZIP entpacken und die APK installieren. iOS: Die IPA kann heruntergeladen werden; die Installation erfordert eine gültig signierte App und einen unterstützten Installationsweg.</p>
</section>`;
const pages: [string, string][] = [
 ['index.html', page('Startseite', 'WebDev / Übersicht', 'Digitale Projekte.<br><span>Ein guter Anfang.</span>', 'Webseiten und Apps an einem Ort. Wähle einen Bereich, um die Projekte zu entdecken.', section('Bereiche', row('reta/', '01', 'Webseiten', 'Projekte und ihre verschiedenen Versionen ansehen.', 'Reta') + row('apps/', '02', 'Apps', 'Apps entdecken und Downloads finden.', 'Sequvia')), 'Übersicht')],
 ['reta/index.html', page('Webseiten', 'Webseiten / Reta', 'Webseiten<br><span>von Reta.</span>', 'Hier findest du die Webseitenprojekte und ihre verfügbaren Fassungen.', section('Projekte', row('reta/imhof/', '01', 'Friseur Imhof', 'Die aktuelle Webseite und eine frühere Version.', '2 Versionen')), `${home}<span>/</span>Webseiten`)],
 ['reta/imhof/index.html', page('Friseur Imhof', 'Reta / Webseiten', 'Friseur Imhof.<br><span>Alle Versionen.</span>', 'Wähle eine Fassung aus. Die aktuelle Version steht an erster Stelle.', section('Versionen', row('reta/imhof/akt/', '02', 'Aktuelle Version', 'Die neueste Fassung der Webseite.', 'Aktuell · v2') + row('reta/imhof/v1/', '01', 'Version 1', 'Die frühere Fassung aus dem Archiv.', 'Archiv · v1')), `${home}<span>/</span><a href="${base}reta/">Webseiten</a><span>/</span>Imhof`)],
 ['apps/index.html', page('Apps', 'WebDev / Apps', 'Apps.<br><span>Alles an einem Ort.</span>', 'Wähle eine App, um zu ihren Downloads zu gelangen.', section('Apps', row('apps/sequvia/', '01', 'Sequvia', 'Downloads für Android und iOS.', 'App')), `${home}<span>/</span>Apps`)],
 ['apps/sequvia/index.html', page('Sequvia', 'Apps / Sequvia', 'Sequvia.<br><span>Für dein Gerät.</span>', 'Lade die aktuelle Sequvia-Version für Android oder iOS herunter.', downloads, `${home}<span>/</span><a href="${base}apps/">Apps</a><span>/</span>Sequvia`)]
];
for (const [path, html] of pages) { const target = resolve(dist, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, html); }
for (const old of ['preise.html', 'impressum.html', 'datenschutz.html']) { const target = new URL(current + old, url).href.replaceAll('&', '&amp;').replaceAll('"', '&quot;'); writeFileSync(resolve(dist, old), `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${target}"><title>Friseur Imhof</title><a href="${target}">Weiter zu Friseur Imhof</a></html>`); }
writeFileSync(resolve(dist, '404.html'), page('Seite nicht gefunden', 'WebDev / 404', 'Hier geht es<br><span>zur Übersicht.</span>', 'Diese Seite wurde nicht gefunden.', section('Weiter', row('', '01', 'Zur Startseite', 'Alle Bereiche ansehen.', 'Übersicht')), `${home}<span>/</span>404`));
let checked = 0;
for (const file of files(dist).filter(f => ['.html', '.css'].includes(extname(f)))) {
 const relative = file.slice(dist.length + 1).split(sep).join('/'), pageURL = new URL(relative, url), content = readFileSync(file, 'utf8');
 const links = extname(file) === '.css' ? content.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g) : content.matchAll(/\b(?:href|src)="([^"]+)"/g);
 for (const match of links) { const link = new URL(match[1].replaceAll('&amp;', '&'), pageURL); if (link.origin !== url.origin || !['http:', 'https:'].includes(link.protocol)) continue;
  if (!link.pathname.startsWith(base)) throw new Error('Link escapes project prefix: ' + link.href);
  let path = decodeURIComponent(link.pathname.slice(base.length)); if (!path || path.endsWith('/')) path += 'index.html';
  const target = resolve(dist, path); if (!target.startsWith(dist + sep) || !existsSync(target)) throw new Error('Broken link: ' + relative + ' → ' + link.href);
  if (link.hash && extname(target) === '.html' && !readFileSync(target, 'utf8').includes(`id="${decodeURIComponent(link.hash.slice(1))}"`)) throw new Error('Missing anchor: ' + link.href); checked++;
 }
}
if (files(dist).some(file => /\.(?:json|ts|map)$/.test(file))) throw new Error('Private source/build metadata in deployment');
console.log(JSON.stringify({ version: '2.4.0', checkedLinks: checked, dist }));

import { apps, appRoute, downloadUrl } from './apps.mjs';

const icons = {
  web: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18m-12 4-2 2 2 2m6-4 2 2-2 2"/>',
  apps: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  next: '<path d="m10 6 6 6-6 6"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  open: '<path d="M7 17 17 7M7 7h10v10"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>',
  history: '<path d="M3 12a9 9 0 1 1 3 6.7M3 5v7h7m2-5v5l3 2"/>',
  android: '<path d="m8 8-2-3m10 3 2-3M4 16a8 8 0 0 1 16 0v2H4zM9 13h.01m5.99 0h.01"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const routes = {
  reta: 'reta/', imhof: 'reta/imhof/', current: 'reta/imhof/akt/',
  archive: 'reta/imhof/v1/', capello: 'reta/il-capello/',
  apps: 'apps/',
};
export function renderPages(base, sizes) {
  const path = route => escape(base + route);
  const asset = (file, cls = '', prefix = 'assets/') => `<img class="${cls}" src="${path(prefix + file)}" alt="" width="48" height="48">`;
  const badge = (symbol, tone = 'blue') => `<span class="tile ${tone}">${icon(symbol)}</span>`;
  const brand = `<a class="brand" href="${path('')}" aria-label="WebDev Startseite">${asset('webdev-mark.png')}<span>WebDev</span></a>`;
  function row({ route, label, description, mark, meta, action = 'next', download }) {
    const href = route.startsWith('https://') ? escape(route) : path(route);
    return `<li><a class="row" href="${href}"${download && !route.startsWith('https://') ? ` download="${escape(download)}"` : ''}>
      ${mark}<span class="row-text"><strong>${escape(label)}</strong><span>${escape(description)}</span></span>
      ${meta ? `<span class="row-meta">${escape(meta)}</span>` : ''}<span class="row-action">${icon(action)}</span>
    </a></li>`;
  }
  const group = (label, hint, rows) => `<section class="group"><div class="group-heading"><h2>${label}</h2>${hint ? `<span>${hint}</span>` : ''}</div><ul class="rows">${rows.map(row).join('')}</ul></section>`;
  const appRows = apps.map(app => ({
    route: appRoute(app), label: app.name, description: app.description,
    mark: asset(app.icon, 'tile app-logo app-icon'),
  }));
  const versions = [
    { route: routes.current, label: 'Version 2', description: 'Aktuelle Website mit Leistungen, Preisen und Kontakt', mark: badge('web'), meta: 'Aktuell', action: 'open' },
    { route: routes.archive, label: 'Version 1', description: 'Erste veröffentlichte Fassung', mark: badge('history', 'neutral'), meta: 'Archiv', action: 'open' },
  ];
  const projects = [
    { route: routes.imhof, label: 'Friseur Imhof', description: 'Website und frühere Fassungen', mark: asset('imhof-logo.png', 'tile app-logo', routes.current + 'assets/'), meta: versions.length === 1 ? '1 Version' : versions.length + ' Versionen' },
    { route: routes.capello, label: 'Il Capello', description: 'Salon, Team, Leistungen und Kontakt', mark: asset('icon.svg', 'tile app-logo', routes.capello + 'assets/'), action: 'open' },
  ];
  function page({ title, area, eyebrow, intro, content, parent, mark = '' }) {
    return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f1f6fa">
  <meta name="description" content="${escape(intro)}">
  <title>${title === 'WebDev' ? 'WebDev · Webseiten und Apps' : escape(title) + ' · WebDev'}</title>
  <link rel="icon" href="${path('assets/webdev-mark.png')}" type="image/png">
  <link rel="stylesheet" href="${path('assets/portal.css')}">
</head>
<body>
  <a class="skip" href="#inhalt">Zum Inhalt springen</a>
  <header class="top"><div class="shell bar">${brand}
    <nav aria-label="Hauptnavigation">
      <a href="${path(routes.reta)}"${area === 'reta' ? ' aria-current="true"' : ''}>Webseiten</a>
      <a href="${path(routes.apps)}"${area === 'apps' ? ' aria-current="true"' : ''}>Apps</a>
    </nav>
  </div></header>
  <main class="shell" id="inhalt">
    ${parent ? `<a class="back" href="${path(parent[0])}">${icon('back')}${escape(parent[1])}</a>` : ''}
    <div class="intro">
      <p class="eyebrow">${eyebrow}</p>
      <div class="intro-heading">${mark}<h1>${escape(title)}</h1></div>
      <p class="lead">${escape(intro)}</p>
    </div>
    ${content}
  </main>
  <footer class="shell footer">WebDev</footer>
</body>
</html>`;
  }
  const megabytes = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
  const appPages = apps.map(app => {
    const route = appRoute(app);
    const rows = app.downloads.map(({ platform, format, file, symbol }) => {
      const downloadRoute = route + 'downloads/' + file;
      return {
        route: downloadUrl(downloadRoute), label: platform, description: format + ' als ZIP herunterladen',
        mark: badge(symbol, format === 'APK' ? 'blue' : 'neutral'),
        meta: megabytes.format(sizes.get(downloadRoute) / 1e6) + ' MB',
        action: 'download', download: file,
      };
    });
    const instructions = [];
    if (app.downloads.some(({ format }) => format === 'APK')) {
      instructions.push('<details><summary>Android: APK installieren</summary><p>Entpacke das ZIP, öffne die APK auf deinem Android-Gerät und folge den Hinweisen deines Geräts.</p></details>');
    }
    if (app.downloads.some(({ format }) => format === 'IPA')) {
      instructions.push('<details><summary>iPhone und iPad: IPA verwenden</summary><p>Entpacke das ZIP. Für die IPA brauchst du einen geeigneten Installationsweg, zum Beispiel SideStore. Die Datei lässt sich unter iOS nicht direkt aus dem Browser installieren.</p></details>');
    }
    return [route, page({
      title: app.name, area: 'apps', eyebrow: 'Apps · Downloads', intro: app.description,
      mark: asset(app.icon, 'project-mark app-brand-mark'), parent: [routes.apps, 'Apps'],
      content: group('Downloads', '', rows) + '<section class="help"><h2>Nach dem Download</h2>' + instructions.join('') + '</section>',
    })];
  });
  return new Map([
    ['', page({ title: 'WebDev', eyebrow: 'Übersicht', intro: 'Webseiten als Vorschau und Apps zum Download.',
      content: group('Bereiche', '', [
        { route: routes.reta, label: 'Webseiten', description: 'Vorschauen und frühere Versionen ansehen', mark: badge('web'), meta: 'Reta' },
        { route: routes.apps, label: 'Apps', description: 'Apps für dein Gerät herunterladen', mark: badge('apps', 'sage') },
      ]) })],
    [routes.reta, page({ title: 'Reta', area: 'reta', eyebrow: 'Webseiten', intro: 'Webseiten von Reta als Vorschau. Frühere Fassungen sind bei der jeweiligen Website zu finden.', parent: ['', 'Übersicht'],
      content: group('Webseiten', '', projects) })],
    [routes.imhof, page({ title: 'Friseur Imhof', area: 'reta', eyebrow: 'Reta · Webseiten', intro: 'Wähle die aktuelle Website oder eine frühere Fassung.', mark: asset('imhof-logo.png', 'project-mark', routes.current + 'assets/'), parent: [routes.reta, 'Webseiten'],
      content: group('Versionen', 'Neueste zuerst', versions) })],
    [routes.apps, page({ title: 'Apps', area: 'apps', eyebrow: 'WebDev', intro: 'Apps und Installationsdateien für dein Gerät.', parent: ['', 'Übersicht'],
      content: group('Verfügbare Apps', '', appRows) })],
    ...appPages,
    ['404.html', page({ title: 'Seite nicht gefunden', eyebrow: '404', intro: 'Die Seite ist unter dieser Adresse nicht verfügbar.', parent: ['', 'Zur Übersicht'], content: '' })],
  ]);
}

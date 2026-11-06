const icons = {
  web: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18m-12 4-2 2 2 2m6-4 2 2-2 2"/>',
  apps: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  next: '<path d="m10 6 6 6-6 6"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  open: '<path d="M7 17 17 7M7 7h10v10"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>',
  history: '<path d="M3 12a9 9 0 1 1 3 6.7M3 5v7h7m2-5v5l3 2"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  android: '<path d="m8 8-2-3m10 3 2-3M4 16a8 8 0 0 1 16 0v2H4zM9 13h.01m5.99 0h.01"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const routes = {
  reta: 'reta/', imhof: 'reta/imhof/', current: 'reta/imhof/akt/',
  archive: 'reta/imhof/v1/', capello: 'reta/il-capello/',
  apps: 'apps/', sequvia: 'apps/sequvia/',
};
export const packages = [
  { name: 'Android', type: 'APK', file: 'Sequvia_apk.zip', symbol: 'android' },
  { name: 'iPhone & iPad', type: 'IPA', file: 'Sequvia_ipa.zip', symbol: 'apps' },
];

export function renderPages(base, sizes) {
  const path = route => escape(base + route);
  const asset = (file, cls = '', prefix = 'assets/') => `<img class="${cls}" src="${path(prefix + file)}" alt="" width="48" height="48">`;
  const badge = (symbol, tone = 'blue') => `<span class="tile ${tone}">${icon(symbol)}</span>`;
  const brand = `<a class="brand" href="${path('')}" aria-label="WebDev Startseite">${asset('webdev.svg')}<span>WebDev</span></a>`;
  function row({ route, label, description, mark, meta, action = 'next', download }) {
    return `<li><a class="row" href="${path(route)}"${download ? ` download="${escape(download)}"` : ''}>
      ${mark}<span class="row-text"><strong>${escape(label)}</strong><span>${escape(description)}</span></span>
      ${meta ? `<span class="row-meta">${escape(meta)}</span>` : ''}<span class="row-action">${icon(action)}</span>
    </a></li>`;
  }
  const group = (label, hint, rows) => `<section class="group"><div class="group-heading"><h2>${label}</h2><span>${hint}</span></div><ul class="rows">${rows.map(row).join('')}</ul></section>`;
  const appRow = { route: routes.sequvia, label: 'Sequvia', description: 'App für Android und iOS', mark: asset('sequvia.svg', 'tile app-logo'), meta: 'Downloads' };
  const projects = [
    { route: routes.imhof, label: 'Friseur Imhof', description: 'Aktuelle Website und frühere Fassung', mark: badge('web', 'sage'), meta: '2 Versionen' },
    { route: routes.capello, label: 'Il Capello', description: 'Salon, Team, Leistungen und Kontakt', mark: asset('icon.svg', 'tile app-logo', routes.capello + 'assets/'), action: 'open' },
  ];
  const versions = [
    { route: routes.current, label: 'Version 2', description: 'Aktuelle Website mit Leistungen, Preisen und Kontakt', mark: badge('web'), meta: 'Aktuell', action: 'open' },
    { route: routes.archive, label: 'Version 1', description: 'Erste veröffentlichte Fassung', mark: badge('history', 'neutral'), meta: 'Archiv', action: 'open' },
  ];
  const downloads = packages.map((item, index) => ({
    route: routes.sequvia + 'downloads/' + item.file, label: item.name,
    description: item.type + ' als ZIP herunterladen', mark: badge(item.symbol, index ? 'neutral' : 'blue'),
    meta: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(sizes[index] / 1e6) + ' MB',
    action: 'download', download: item.file,
  }));
  const tree = `<div class="index-card" aria-hidden="true">
    <div class="index-top">${icon('folder')}<span>Projektverzeichnis</span></div>
    <div class="index-branch"><div><b>Reta</b><span>Webseiten</span></div><div class="index-leaf">Friseur Imhof</div><div class="index-leaf">Il Capello</div></div>
    <div class="index-branch"><div><b>Apps</b></div><div class="index-leaf">Sequvia</div></div>
  </div>`;
  function page({ title, area, eyebrow, intro, content, parent, visual = '' }) {
    return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f1f6fa">
  <meta name="description" content="${escape(intro)}">
  <title>${title === 'WebDev' ? 'WebDev · Webseiten und Apps' : escape(title) + ' · WebDev'}</title>
  <link rel="icon" href="${path('assets/webdev.svg')}" type="image/svg+xml">
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
    <div class="intro${visual ? ' intro-split' : ''}"><div>
      <p class="eyebrow">${eyebrow}</p><h1>${escape(title)}</h1><p class="lead">${escape(intro)}</p>
    </div>${visual}</div>
    ${content}
  </main>
  <footer class="shell footer"><span>WebDev · Webseiten &amp; Apps</span><a href="https://github.com/MattiSchmied/webdev">Quellcode auf GitHub ${icon('open')}</a></footer>
</body>
</html>`;
  }
  return new Map([
    ['', page({ title: 'WebDev', eyebrow: 'Projektübersicht', intro: 'Webseiten von Reta ansehen oder Sequvia für dein Gerät herunterladen.', visual: tree,
      content: group('Bereiche', 'Webseiten &amp; Apps', [
        { route: routes.reta, label: 'Webseiten', description: 'Friseur Imhof und Il Capello', mark: badge('web'), meta: 'Reta' },
        { route: routes.apps, label: 'Apps', description: 'Sequvia für Android und iOS', mark: badge('apps', 'sage'), meta: '1 App' },
      ]) })],
    [routes.reta, page({ title: 'Reta', area: 'reta', eyebrow: 'Webseiten', intro: 'Zwei Salonauftritte aus Unterhaching. Öffne eine Website oder sieh dir die früheren Fassungen an.', parent: ['', 'Übersicht'],
      content: group('Webseiten', '2 Projekte', projects) })],
    [routes.imhof, page({ title: 'Friseur Imhof', area: 'reta', eyebrow: 'Reta · Webseiten', intro: 'Zwei Fassungen derselben Website, von der aktuellen Seite bis zur ersten Version.', parent: [routes.reta, 'Webseiten'],
      content: group('Versionen', 'Neueste zuerst', versions) })],
    [routes.apps, page({ title: 'Apps', area: 'apps', eyebrow: 'WebDev', intro: 'Hier findest du die App und ihre Installationsdateien.', parent: ['', 'Übersicht'],
      content: group('Verfügbare Apps', '1 App', [appRow]) })],
    [routes.sequvia, page({ title: 'Sequvia', area: 'apps', eyebrow: 'Apps · Downloads', intro: 'Wähle dein Gerät. Beide Installationsdateien werden als ZIP heruntergeladen.', parent: [routes.apps, 'Apps'],
      content: group('Downloads', 'Android &amp; iOS', downloads) + `<section class="help"><h2>Nach dem Download</h2>
        <details><summary>Android: APK installieren</summary><p>Entpacke das ZIP, öffne die APK auf deinem Android-Gerät und folge den Hinweisen deines Geräts.</p></details>
        <details><summary>iPhone und iPad: IPA verwenden</summary><p>Entpacke das ZIP. Für die IPA brauchst du einen geeigneten Installationsweg, zum Beispiel SideStore. Die Datei lässt sich unter iOS nicht direkt aus dem Browser installieren.</p></details>
      </section>` })],
    ['404.html', page({ title: 'Seite nicht gefunden', eyebrow: '404', intro: 'Die Seite ist unter dieser Adresse nicht verfügbar.', parent: ['', 'Zur Übersicht'], content: '' })],
  ]);
}

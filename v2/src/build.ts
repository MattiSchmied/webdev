import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import type { ResearchPack, PriceItem } from './types.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.env.OUTPUT_DIR ? resolve(process.env.OUTPUT_DIR) : resolve(root, 'dist');
const writeMirror = process.env.WRITE_MIRROR !== 'false';
const targets = writeMirror ? [root, dist] : [dist];
const deploymentURL = new URL(process.env.SITE_URL || 'https://mattischmied.github.io/webdev/');
if (deploymentURL.protocol !== 'https:' || deploymentURL.username || deploymentURL.password || deploymentURL.search || deploymentURL.hash) throw new Error('SITE_URL must be a clean HTTPS URL.');
if (!deploymentURL.pathname.endsWith('/')) deploymentURL.pathname += '/';
const siteURL = deploymentURL.href;
const siteBasePath = deploymentURL.pathname;
const pack: ResearchPack = JSON.parse(readFileSync(resolve(root, 'research/research-pack.json'), 'utf8'));
const html = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const fact = (id: string) => {
  const found = pack.businessFacts.find(item => item.id === id && item.status === 'confirmed');
  if (!found) throw new Error('Missing confirmed fact: ' + id);
  return found.value;
};
const path = (id: string) => {
  const found = pack.bookingAndContactPaths.find(item => item.id === id && item.status === 'confirmed');
  if (!found) throw new Error('Missing confirmed contact path: ' + id);
  return found.value;
};
const phone = fact('phone');
const phoneDigits = phone.replace(/\D/g, '');
const tel = 'tel:+49' + phoneDigits.replace(/^0/, '');
const email = fact('email');
const owner = 'Marita Imhof';
if (!fact('business_name').includes(owner)) throw new Error('Owner identity not confirmed.');
const hours = JSON.parse(fact('opening_hours')) as { day: string; ranges: { opens: string; closes: string }[] }[];
if (hours.length !== 5 || hours.some(day => day.ranges[0]?.opens !== '09:00' || day.ranges[0]?.closes !== '20:00')) throw new Error('Opening-hours copy needs an update.');

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg>';
const down = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" stroke="currentColor" stroke-width="1.5"/></svg>';
const documentIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5m-5 4h5" stroke="currentColor" stroke-width="1.4"/></svg>';
const template = (name: string) => readFileSync(resolve(root, 'src/templates/' + name + '.html'), 'utf8');
const replace = (text: string, values: Record<string, string>) => text.replace(/\{\{([A-Z_]+)\}\}/g, (_match, name: string) => {
  if (!(name in values)) throw new Error('Unknown template token: ' + name);
  return values[name];
});
const base = {
  OWNER: html(owner), PHONE: html(phone), EMAIL: html(email), STREET: html(fact('street')),
  CITY: html(fact('city')), POSTAL_CODE: html(fact('postal_code')), ADDRESS: html(fact('street')) + '<br>' + html(fact('location')),
  TEL: html(tel), MAILTO: html('mailto:' + email), MAPS: html(path('directions')),
  ARROW: arrow, DOWN: down, DOCUMENT_ICON: documentIcon
};
const header = (active: string) => replace(template('header'), {
  ...base, HOME_ACTIVE: active === 'home' ? 'aria-current="page"' : '',
  PRICES_ACTIVE: active === 'prices' ? 'aria-current="page"' : ''
});
const footer = replace(template('footer'), base);
const mobileContact = '<a class="mobile-contact" href="' + html(tel) + '"><span>Ihr Termin bei Imhof</span><strong>Anrufen ' + arrow + '</strong></a>';
const hashes: string[] = [];
const jsonld = (value: unknown) => {
  const text = JSON.stringify(value).replaceAll('<', '\\u003c');
  hashes.push("'sha256-" + createHash('sha256').update(text).digest('base64') + "'");
  return '<script type="application/ld+json">' + text + '</script>';
};
const businessData = {
  '@context': 'https://schema.org', '@type': 'HairSalon', '@id': siteURL + '#salon',
  name: 'Friseur Imhof', url: siteURL, logo: siteURL + 'assets/imhof-logo.png', image: siteURL + 'assets/marita-imhof.jpg', telephone: '+49' + phoneDigits.replace(/^0/, ''), email,
  address: { '@type': 'PostalAddress', streetAddress: fact('street'), postalCode: fact('postal_code'), addressLocality: fact('city') },
  openingHoursSpecification: hours.map(item => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ({ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' } as Record<string, string>)[item.day],
    opens: item.ranges[0].opens, closes: item.ranges[0].closes
  }))
};
interface PriceGroup {
  prefix: string;
  id: string;
  label: string;
  description: string;
  items: PriceItem[];
  note: string;
}
const group = (audience: string, name: string): PriceGroup => {
  const prefix = audience + '_' + name + '_';
  const items = pack.pricing.find(item => item.id === 'prices_' + audience && item.status === 'confirmed')?.items.filter(item => item.id.startsWith(prefix));
  if (!items?.length) throw new Error('Missing confirmed prices: ' + prefix);
  const label = items[0].title.split(' · ')[0];
  const note = name === 'prinzessinnen' ? 'Ab 16 Jahren gilt die Preisliste Damen.' : name === 'lausbuam' ? 'Ab 16 Jahren gilt die Preisliste Herren.' : '';
  if (note && !items[0].notes.includes(note)) throw new Error('Unconfirmed age condition.');
  return { prefix, id: (audience + '-' + name).replaceAll('_', '-'), label, description: items[0].description, items, note };
};
const groups = {
  damen: [group('damen', 'schnitt'), group('damen', 'foehnen'), group('damen', 'dauerwelle'), group('damen', 'straehnen'), group('damen', 'toenungen'), group('damen', 'faerben')],
  herren: [group('herren', 'schnitt'), group('herren', 'senioren'), group('herren', 'bartpflege')],
  kinder: [group('herren', 'prinzessinnen'), group('herren', 'lausbuam')],
  extras: [group('damen', 'haarpflege'), group('damen', 'kosmetik'), group('damen', 'hausbesuche')]
};
const priceTable = (priceGroup: PriceGroup, excerpt = false) => {
  const shown = excerpt && priceGroup.id === 'herren-schnitt' ? priceGroup.items.slice(0, 3) : priceGroup.items;
  return '<article class="price-group" id="' + priceGroup.id + '"><h3>' + html(priceGroup.label) + '</h3><p class="price-description">' + html(priceGroup.description) + '</p><table><caption class="sr-only">' + html(priceGroup.label) + (excerpt ? ' – Preisauszug' : ' – vollständige Preise') + '</caption><thead class="sr-only"><tr><th scope="col">Leistung</th><th scope="col">Preis</th></tr></thead><tbody>' +
    shown.map(item => '<tr data-price-id="' + item.id + '"><th scope="row">' + html(item.title.split(' · ').slice(1).join(' · ')) + '</th><td>' + html(item.priceText) + '</td></tr>').join('') +
    '</tbody></table>' + (priceGroup.note ? '<p class="price-condition">' + html(priceGroup.note) + '</p>' : '') + '</article>';
};
const priceSections = (Object.keys(groups) as (keyof typeof groups)[]).map((category, i) => {
  const titles = { damen: 'Damen', herren: 'Herren & Senioren', kinder: 'Kinder', extras: 'Pflege & Extras' };
  const intros = { damen: 'Schnitt, Styling und Farbe – nach Haarlänge.', herren: 'Haarschnitte, Seniorenpreise ab 65 und Bartpflege.', kinder: 'Eigene Preise für Mädchen und Jungen bis 15 Jahre.', extras: 'Haarpflege, Kosmetik und die Anfahrt für Hausbesuche.' };
  return '<section class="price-section container" id="' + category + '" aria-labelledby="' + category + '-title"><div class="section-head"><p class="eyebrow">0' + (i + 1) + ' / ' + titles[category] + '</p><h2 id="' + category + '-title">' + titles[category] + '</h2><p>' + intros[category] + '</p></div><div class="price-grid">' + groups[category].map(item => priceTable(item)).join('') + '</div></section>';
}).join('');
const priceNotes = '<p>Bei höherem Materialaufwand oder Arbeitsaufwand kann sich der Preis ändern. Umsatzsteuer wird gemäß § 19 Abs. 1 UStG nicht gesondert ausgewiesen.</p>';
const pdfLinks = '<div class="pdf-links"><a href="assets/documents/preisliste-damen.pdf" download="Preisliste_Damen.pdf">' + documentIcon + 'Original-PDF Damen <span aria-hidden="true">↓</span></a><a href="assets/documents/preisliste-herren.pdf" download="Preisliste_Herren.pdf">' + documentIcon + 'Original-PDF Herren & Kinder <span aria-hidden="true">↓</span></a></div>';
const homeBody = replace(template('index'), {
  ...base, HOME_PRICES: priceTable(groups.damen[0], true) + priceTable(groups.herren[0], true),
  PRICE_NOTES: priceNotes, PDF_LINKS: pdfLinks
});
const pricesBody = replace(template('prices'), { ...base, PRICE_SECTIONS: priceSections, PRICE_NOTES: priceNotes, PDF_LINKS: pdfLinks });
const pages = [
  { file: 'index.html', path: '', active: 'home', title: 'Friseur Imhof in Unterhaching · Marita Imhof', description: 'Ihr Friseur in Unterhaching: persönliche Beratung zu Schnitt, Farbe und Pflege. Marita Imhof ist Friseurmeisterin seit 1984. Termine unter 089 / 611 26 83.', body: homeBody, structured: businessData, noindex: false },
  { file: 'preise.html', path: 'preise.html', active: 'prices', title: 'Alle Preise · Friseur Imhof in Unterhaching', description: 'Die vollständigen Preise für Damen, Herren, Kinder, Senioren, Bartpflege und Kosmetik bei Friseur Imhof. Mit beiden Original-Preislisten als PDF.', body: pricesBody, structured: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Preise – Friseur Imhof', url: siteURL + 'preise.html', about: { '@id': businessData['@id'] } }, noindex: false },
  { file: 'impressum.html', path: 'impressum.html', active: '', title: 'Impressum · Friseur Imhof', description: 'Betreiberin und Kontaktangaben der Website von Friseur Imhof, Marita Imhof, Goerdelerstr. 49, 82008 Unterhaching.', body: replace(template('imprint'), base), structured: null, noindex: false },
  { file: 'datenschutz.html', path: 'datenschutz.html', active: '', title: 'Datenschutz · Friseur Imhof', description: 'Informationen zum Datenschutz beim Besuch der Website und bei Kontakt mit Friseur Imhof.', body: replace(template('privacy'), base), structured: null, noindex: false },
  { file: '404.html', path: '404.html', active: '', title: 'Seite nicht gefunden · Friseur Imhof', description: 'Zur Startseite von Friseur Imhof in Unterhaching.', body: replace(template('not-found'), base), structured: null, noindex: true }
];
mkdirSync(resolve(dist, 'assets/documents'), { recursive: true });
for (const page of pages) {
  let content = replace(template('layout'), {
    TITLE: html(page.title), DESCRIPTION: html(page.description), CANONICAL: siteURL + page.path, SITE_URL: html(siteURL),
    ROBOTS: page.noindex ? '<meta name="robots" content="noindex,follow">' : '',
    STRUCTURED_DATA: page.structured ? jsonld(page.structured) : '',
    HEADER: header(page.active), BODY: page.body, FOOTER: footer, MOBILE_CONTACT: mobileContact,
    OG_DESCRIPTION: html(page.description)
  });
  if (page.noindex) content = content.replace(/\b(href|src)="([^"#]+)"/g, (match, attribute: string, resource: string) => /^(?:[a-z]+:|\/)/i.test(resource) ? match : `${attribute}="${html(siteBasePath)}${resource}"`);
  content = content.replace(/[ \t]+$/gm, '');
  writeFileSync(resolve(dist, page.file), content);
  if (writeMirror) writeFileSync(resolve(root, page.file), content);
}
const css = readFileSync(resolve(root, 'src/styles.css'));
const client = stripTypeScriptTypes(readFileSync(resolve(root, 'src/client.ts'), 'utf8'), { mode: 'strip' });
const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#151916"/><text x="32" y="46" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="46" fill="#DCE5D5">i.</text></svg>';
for (const target of targets) {
  mkdirSync(resolve(target, 'assets/documents'), { recursive: true });
  writeFileSync(resolve(target, 'assets/site.css'), css);
  writeFileSync(resolve(target, 'assets/site.js'), client);
  writeFileSync(resolve(target, 'assets/favicon.svg'), favicon);
  for (const audience of ['damen', 'herren']) {
    const local = 'assets/documents/preisliste-' + audience + '.pdf';
    const asset = pack.assets.find(item => item.url.endsWith(audience === 'damen' ? 'Preisliste_Damen.pdf' : 'Preisliste_Herren.pdf'));
    if (!asset || createHash('sha256').update(readFileSync(resolve(root, local))).digest('hex') !== asset.checksum) throw new Error('PDF checksum mismatch.');
    if (target !== root) copyFileSync(resolve(root, local), resolve(target, local));
  }
  if (target !== root && existsSync(resolve(root, 'assets/social-preview.png'))) copyFileSync(resolve(root, 'assets/social-preview.png'), resolve(target, 'assets/social-preview.png'));
  if (target !== root) {
    mkdirSync(resolve(target, 'assets/fonts'), { recursive: true });
    for (const file of ['manrope-variable.ttf', 'OFL.txt']) copyFileSync(resolve(root, 'assets/fonts', file), resolve(target, 'assets/fonts', file));
    copyFileSync(resolve(root, 'assets/hair-editorial.png'), resolve(target, 'assets/hair-editorial.png'));
    for (const file of ['imhof-logo.png', 'marita-imhof.jpg']) copyFileSync(resolve(root, 'assets', file), resolve(target, 'assets', file));
  }
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + pages.filter(item => !item.noindex).map(item => '<url><loc>' + siteURL + item.path + '</loc></url>').join('') + '</urlset>\n';
  writeFileSync(resolve(target, 'sitemap.xml'), sitemap);
  writeFileSync(resolve(target, 'robots.txt'), 'User-agent: *\nAllow: ' + siteBasePath + '\nDisallow: ' + siteBasePath + 'research/\nDisallow: ' + siteBasePath + 'src/\nDisallow: ' + siteBasePath + 'checks/\nSitemap: ' + siteURL + 'sitemap.xml\n');
  writeFileSync(resolve(target, '.nojekyll'), '');
}
const csp = "default-src 'self'; script-src 'self' " + hashes.join(' ') + "; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'";
const security = {
  'Content-Security-Policy': csp,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY'
};
if (writeMirror) writeFileSync(resolve(root, 'src/security.json'), JSON.stringify(security, null, 2) + '\n');
const metaCsp = csp.replace("; frame-ancestors 'none'", '');
for (const target of targets) {
  for (const page of pages) {
    const file = resolve(target, page.file);
    const content = readFileSync(file, 'utf8').replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="' + html(metaCsp) + '">\n  <meta name="referrer" content="no-referrer">');
    writeFileSync(file, content);
  }
}
const headers = '/*\n' + Object.entries(security).map(([name, value]) => '  ' + name + ': ' + value).join('\n') + '\n';
const apache = 'Options -Indexes\nDirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_headers.c>\n' + Object.entries(security).map(([name, value]) => 'Header always set ' + name + ' "' + value + '"').join('\n') + '\n</IfModule>\n<IfModule mod_alias.c>\nRedirectMatch 301 ^/preise/?$ /preise.html\nRedirectMatch 301 ^/leistungen/?$ /index.html#leistungen\nRedirectMatch 301 ^/(kontakt|anfahrt)/?$ /index.html#kontakt\nRedirectMatch 301 ^/impressum-datenschutz/?$ /impressum.html\n</IfModule>\n';
for (const target of targets) {
  writeFileSync(resolve(target, '_headers'), headers);
  writeFileSync(resolve(target, '.htaccess'), apache);
}
const candidate = JSON.parse(readFileSync(resolve(root, 'research/original-candidate.json'), 'utf8')).candidate;
candidate.designDirection.colors = { primary: '#151916', background: '#F6F7F3', text: '#151916', accent: '#DCE5D5' };
candidate.designDirection.character = 'refined';
candidate.designDirection.typography = 'geometric';
candidate.designDirection.motion = 'subtle';
candidate.designDirection.imageTreatment = 'framed';
candidate.designDirection.ctaTreatment = 'pill';
candidate.pages[0].sections[0].heading = 'Ihr Haar. Ihr Stil. Ganz Sie.';
candidate.pages[0].sections[0].text = 'Ein Look, der sich nach Ihnen anfühlt. Persönliche Beratung, Schnitt und Farbe – mit Marita Imhof, Friseurmeisterin seit 1984.';
candidate.pages[0].sections[0].action.label = 'Termin anfragen';
candidate.strategy.customerGoal = 'inquiry';
candidate.navigation.splice(3, 0, { label: 'Preise', sectionId: null, slug: 'preise' });
candidate.warnings = ['Die Originalpreislisten enthalten kein Datum. Einzelpreise wurden aus den abgerufenen offiziellen PDFs unverändert übernommen. Lokale Dokumente haben keine serverseitige managedAssetId.'];
candidate.engineGaps = [];
candidate.pages[0].sections[0].quickFactIds.push('street');
candidate.pages[0].sections[1].items = [
  { serviceId: 'haircut', text: 'Schnitt und Styling für Damen, Herren und Kinder.' },
  { serviceId: 'color', text: 'Färben, Tönungen und Strähnen – beraten und passend abgestimmt.' },
  { serviceId: 'care_recommendation', text: 'Empfehlungen zu Haarpflege und Styling.' },
  { serviceId: 'occasion_styling', text: 'Ein persönlich abgestimmtes Paket für Hochzeit oder Kommunion.' }
];
candidate.pages[0].sections.splice(3, 0,
  { id: 'cfc2ff09-d4d9-4898-a5b6-20f2bd44efdb', heading: 'Damenhaarschnitt · Preisauszug', text: 'Waschen, Schneiden, Haarfestiger und Föhnen/Legen. Die vollständige Liste steht auf der Preisseite und im Original-PDF.', surface: 'base', visualWeight: 'balanced', type: 'pricing', variant: 'excerpt-document', groupIds: ['prices_damen'], excerpt: true, documentAssetId: pack.assets[0].id },
  { id: '357512bf-c403-4b27-b6e8-9ee8e9bfcddd', heading: 'Herrenhaarschnitt · Preisauszug', text: 'Einige Haarschnittpreise im Überblick. Vollständige Preise einschließlich Senioren und Kindern auf der Preisseite und im Original-PDF.', surface: 'base', visualWeight: 'balanced', type: 'pricing', variant: 'excerpt-document', groupIds: ['prices_herren'], excerpt: true, documentAssetId: pack.assets[1].id }
);
candidate.pages.push({
  slug: 'preise', purpose: 'customer', seo: { title: pages[1].title, description: pages[1].description },
  sections: [
    { id: 'a87a0554-2bb4-46d9-a091-efae8a529d3d', heading: 'Alle Preise im Überblick', text: 'Die vollständigen Einzelpreise für Damen, Herren, Kinder, Senioren, Bartpflege, Kosmetik und Hausbesuche.', surface: 'base', visualWeight: 'strong', type: 'hero', variant: 'centered-minimal', imageAssetId: null, quickFactIds: ['phone'], action: { label: 'Termin anfragen', intent: 'customer', pathId: 'phone_main' } },
    { id: 'c5e8dc98-7e95-4b4a-82b8-e0706497ab50', heading: 'Damen, Haarpflege und Kosmetik', text: 'Vollständige Damenpreisliste einschließlich Anfahrt für Hausbesuche.', surface: 'base', visualWeight: 'balanced', type: 'pricing', variant: 'grouped-editorial', groupIds: ['prices_damen'], excerpt: false, documentAssetId: pack.assets[0].id },
    { id: 'a98c350e-049d-4508-9d86-bbf74222ac47', heading: 'Herren, Senioren, Kinder und Bartpflege', text: 'Vollständige Herrenpreisliste einschließlich Anfahrt für Hausbesuche.', surface: 'tinted', visualWeight: 'balanced', type: 'pricing', variant: 'grouped-editorial', groupIds: ['prices_herren'], excerpt: false, documentAssetId: pack.assets[1].id },
    { id: '06f0ef64-0d8f-47bc-91fa-5b9cb5293912', heading: 'Ihren Termin persönlich abstimmen', text: 'Fragen zu einer Leistung oder Ihrem Termin? Marita Imhof ist telefonisch erreichbar.', surface: 'contrast', visualWeight: 'balanced', type: 'contact', variant: 'strong-cta', action: { label: 'Jetzt anrufen', intent: 'contact', pathId: 'phone_main' } }
  ]
});
if (writeMirror) writeFileSync(resolve(root, 'website-candidate.json'), JSON.stringify({ research: pack, candidate }, null, 2) + '\n');
console.log(JSON.stringify({ built: pages.length, publishedPriceRows: Object.values(groups).flatMap(items => items).reduce((sum, item) => sum + item.items.length, 0), dist }));

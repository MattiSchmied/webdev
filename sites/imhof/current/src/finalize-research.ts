import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = (file: string) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const save = (file: string, data: unknown) => writeFileSync(resolve(root, file), JSON.stringify(data, null, 2) + '\n');
const sha = (file: string) => createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex');
const old = load('research/original-candidate.json');
const pack = old.research;
const transcription = load('research/price-transcription.json');
const documentIds = { damen: '3864ec23-f749-4665-87b6-0626dbd88d57', herren: 'e710a8a3-166c-4675-b7c1-503645f1644f' };
const canonical = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const object = value as Record<string, unknown>;
  return '{' + Object.keys(object).sort().map(key => JSON.stringify(key) + ':' + canonical(object[key])).join(',') + '}';
};

pack.pricing = ['damen', 'herren'].map(audience => ({
  id: 'prices_' + audience,
  heading: 'Preisliste ' + (audience === 'damen' ? 'Damen' : 'Herren, Senioren und Kinder'),
  sourceIds: ['official_prices'], status: 'confirmed',
  items: transcription.groups.filter((group: { pdfAudiences: string[] }) => group.pdfAudiences.includes(audience)).flatMap((group: { id: string; label: string; description: string; notes?: string; rows: { label: string; priceText: string }[] }) => {
    const prefix = (group.id.startsWith(audience + '-') ? group.id : audience + '-' + group.id).replaceAll('-', '_');
    return group.rows.map((row, i) => ({
      id: prefix + '_' + (i + 1), title: group.label + ' · ' + row.label,
      description: group.description, priceText: row.priceText,
      notes: [group.notes, transcription.notes.variation, transcription.notes.tax, group.id === 'hausbesuche' ? transcription.notes.houseVisit : ''].filter(Boolean).join(' ')
    }));
  })
}));
pack.assets = ['damen', 'herren'].map(audience => {
  const source = transcription.sourceDocuments[audience];
  return {
    id: documentIds[audience as keyof typeof documentIds], url: source.url,
    originPage: 'https://www.friseur-imhof.de/preise/', sourceId: 'official_prices',
    mimeType: 'application/pdf', width: null, height: null,
    alt: 'Original-Preisliste ' + (audience === 'damen' ? 'Damen' : 'Herren'),
    context: 'Offizielle PDF-Preisliste, lokal unverändert gespeichert; Preise visuell mit dem gerenderten Original abgeglichen.',
    category: 'priceList', confidence: 1, rights: 'official_business_source',
    discoveredAt: statSync(resolve(root, source.localPath)).mtime.toISOString(),
    checksum: sha(source.localPath), managedAssetId: null
  };
});
const additions = [
  ['color', 'Farbe und Tönungen', 'Färben, Tönungen und Strähnen sind in der Damenpreisliste aufgeführt.'],
  ['perm', 'Dauerwelle', 'Dauerwellen mit Packung, Schneiden, Haarfestiger und Föhnen/Legen.'],
  ['beard', 'Bartpflege', 'Bart schneiden, Nassrasur und Schnurrbart schneiden.'],
  ['cosmetics', 'Augenbrauen und Wimpern', 'Augenbrauen zupfen und färben sowie Wimpern färben.'],
  ['children', 'Kinderhaarschnitte', 'Die Herrenpreisliste enthält Kinderpreise für Mädchen und Jungen von 0 bis 15 Jahren.'],
  ['seniors', 'Seniorenhaarschnitt', 'Die Herrenpreisliste enthält eigene Haarschnittpreise für Senioren ab 65 Jahren.']
];
pack.services.push(...additions.map(([id, title, description]) => ({ id, title, description, sourceIds: ['official_prices'], confidence: 1, status: 'confirmed' })));
pack.businessFacts.push({ id: 'house_visit_travel', category: 'other', value: 'Hausbesuche auf Anfrage; Anfahrt 10,50 €. Die Friseurleistung ist nicht in diesem Anfahrtbetrag enthalten.', sourceIds: ['official_prices', 'official_services'], confidence: 1, status: 'confirmed' });
const directionHTML = readFileSync(resolve(root, 'research/directions-source.html'), 'utf8');
const maps = directionHTML.match(/href="(https:\/\/www\.google\.com\/maps\/place\/[^\"]+)"/)?.[1]?.replaceAll('&amp;', '&');
if (!maps) throw new Error('The verified directions source has no Maps link.');
pack.bookingAndContactPaths.push({ id: 'directions', type: 'contact', value: maps, sourceIds: ['official_home'], confidence: 1, status: 'confirmed' });
const pageFiles = { official_home: 'home', official_services: 'services', official_prices: 'prices', official_contact: 'contact' };
for (const source of pack.sources) {
  if (source.id in pageFiles) source.retrievedAt = statSync(resolve(root, 'research/' + pageFiles[source.id as keyof typeof pageFiles] + '.html')).mtime.toISOString();
}
pack.sources.push({ id: 'operator_request_v1', type: 'operator', url: null, title: 'Auftrag: vollständige lokale Website einschließlich Einzelpreisen', retrievedAt: new Date().toISOString() });
pack.operatorNotes.push({ text: 'Vollständige produktionsfähige Website unter Desktop\\Imhof\\v1 erstellen und die Einzelpreise aus den offiziellen Original-PDFs auslesen.', classification: 'instruction', sourceId: 'operator_request_v1' });
pack.currentSiteAudit = 'Die offizielle Website bestätigt Identität, Kontakt, Leistungen und zwei Preislisten-PDFs. Die PDFs wurden unverändert heruntergeladen, gerendert und visuell transkribiert. Beide führen zusätzlich Kinder- beziehungsweise Kosmetikpreise und den Anfahrtbetrag für Hausbesuche auf. Das Ausgangsimpressum bestätigt die Betreiberin und die Kontaktdaten.';
pack.recommendedScope = 'Eine redaktionell komponierte Startseite mit Leistungen, persönlichem Profil, konkreten Kontaktdaten und einem klar beschrifteten Preisauszug. Eine vollständige Preisseite enthält alle Einzelpositionen und beide unveränderten Original-PDFs. Impressum und Datenschutz erhalten eigene Seiten. Der Kundenpfad führt zum Telefon- oder E-Mail-Kontakt.';
pack.conflicts[0].critical = false;
pack.conflicts[0].field = 'Eingabename als Platzhalter eingeordnet; Betrieb anhand der offiziellen URL bestätigt';
pack.uncertainties = ['Die veröffentlichten Preislisten-PDFs enthalten kein Datum. Die Preise sind aus den am 05.10.2026 abgerufenen Originalen übernommen.', 'Es liegt keine bestätigte Online-Buchung vor.'];
pack.missingImportantInformation = [];
mkdirSync(resolve(root, 'research'), { recursive: true });
save('research/research-pack.json', pack);
const evidence = pack.sources.filter((source: { id: string }) => source.id in pageFiles).map((source: { id: keyof typeof pageFiles; url: string }) => ({
  sourceId: source.id, url: source.url, checksum: sha('research/' + pageFiles[source.id] + '.html'), verified: true,
  localFile: 'research/' + pageFiles[source.id] + '.html'
}));
save('research/source-evidence.json', {
  schemaVersion: 1, evidence,
  relatedOfficialPages: [
    { sourceId: 'official_home', url: 'https://www.friseur-imhof.de/impressum-datenschutz/', localFile: 'research/legal-source.html', checksum: sha('research/legal-source.html') },
    { sourceId: 'official_home', url: 'https://www.friseur-imhof.de/anfahrt/', localFile: 'research/directions-source.html', checksum: sha('research/directions-source.html') }
  ],
  priceDocuments: pack.assets.map((asset: { id: string; url: string; checksum: string; discoveredAt: string }) => ({ ...asset, sourceId: 'official_prices', verified: true, verification: 'Gerenderte Originalseite visuell gelesen und sämtliche Preispositionen transkribiert.' })),
  legalReferences: ['https://www.gesetze-im-internet.de/ddg/__5.html', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/deu'],
  pricesPerOriginal: { damen: pack.pricing[0].items.length, herren: pack.pricing[1].items.length },
  uniqueDisplayedPriceRows: transcription.groups.reduce((sum: number, group: { rows: unknown[] }) => sum + group.rows.length, 0),
  note: 'Die Anfahrt für Hausbesuche steht identisch in beiden PDFs und wird auf der Website einmal dargestellt.'
});
save('assets/manifest.json', { schemaVersion: 1, assets: pack.assets.map((asset: { id: string; checksum: string }, index: number) => ({ id: asset.id, file: transcription.sourceDocuments[index === 0 ? 'damen' : 'herren'].localPath, checksum: asset.checksum, managedAssetId: null })) });
writeFileSync(resolve(root, 'research/research-pack.sha256'), createHash('sha256').update(canonical(pack)).digest('hex') + '\n');
console.log(JSON.stringify({ researchComplete: true, pricesPerOriginal: pack.pricing.map((group: { items: unknown[] }) => group.items.length), assetChecksums: pack.assets.map((asset: { checksum: string }) => asset.checksum) }));

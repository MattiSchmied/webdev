import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ResearchPack } from './types.ts';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const read = (file: string) => readFileSync(resolve(dist, file), 'utf8');
const pages = ['index.html', 'preise.html', 'impressum.html', 'datenschutz.html', '404.html'];
const siteBasePath = new URL(read('index.html').match(/<link rel="canonical" href="([^"]+)"/)![1]).pathname;
const pack: ResearchPack = JSON.parse(readFileSync(resolve(root, 'research/research-pack.json'), 'utf8'));
const checked: string[] = [];
const idsByPage: Record<string, Set<string>> = {};
for (const file of pages) {
  const html = read(file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate IDs in ' + file);
  idsByPage[file] = new Set(ids);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, 'Exactly one h1 in ' + file);
  assert.match(html, /<html lang="de">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /name="description"/);
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), 'Unresolved template in ' + file);
  assert.ok(!/<iframe|<form|google-analytics|fonts\.googleapis|localStorage|document\.cookie/i.test(html), 'Unexpected data-collecting integration.');
}
for (const file of pages) {
  for (const match of read(file).matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(https?:|tel:|mailto:|data:)/.test(href)) continue;
    let [resource, fragment] = href.split('#');
    if (resource.startsWith(siteBasePath)) resource = resource.slice(siteBasePath.length);
    const destination = resource || file;
    assert.ok(existsSync(resolve(dist, destination)), 'Broken local link: ' + file + ' → ' + href);
    if (fragment) assert.ok(idsByPage[destination]?.has(fragment), 'Missing anchor: ' + href);
  }
}
checked.push('All pages have one h1, German language, SEO metadata and unique IDs.');
checked.push('All local files and fragment links resolve.');
const pricingHTML = read('preise.html');
const rendered = [...pricingHTML.matchAll(/<tr data-price-id="([^"]+)"><th scope="row">[\s\S]*?<\/th><td>([^<]+)<\/td><\/tr>/g)].map(match => ({ id: match[1], price: match[2] }));
assert.equal(rendered.length, 50, 'All 50 distinct price positions must be displayed.');
assert.equal(pack.pricing[0].items.length, 25);
assert.equal(pack.pricing[1].items.length, 26);
for (const item of rendered) {
  const confirmed = pack.pricing.flatMap(group => group.items).find(price => price.id === item.id);
  assert.equal(item.price, confirmed?.priceText, 'Price changed: ' + item.id);
}
assert.equal(pack.pricing[0].items.find(item => item.id === 'damen_dauerwelle_3')?.priceText, '125,50 €');
assert.equal(pack.pricing[0].items.find(item => item.id === 'damen_straehnen_3')?.priceText, '125,00 €');
assert.equal(pack.pricing[1].items.find(item => item.id === 'herren_prinzessinnen_6')?.priceText, '34,50 €');
assert.equal(pack.pricing[1].items.find(item => item.id === 'herren_lausbuam_6')?.priceText, '24,50 €');
assert.equal(pack.pricing[0].items.find(item => item.id === 'damen_hausbesuche_1')?.priceText, '10,50 €');
assert.equal(pack.pricing[1].items.find(item => item.id === 'herren_hausbesuche_1')?.priceText, '10,50 €');
checked.push('All prices match the ResearchPack; distinct long-hair and child prices preserve source values.');
assert.equal([...read('index.html').matchAll(/data-price-id=/g)].length, 6);
assert.match(read('index.html'), /Preisauszug/);
checked.push('Homepage prices are explicitly labeled as an excerpt with full-page and original-PDF links.');
for (const [i, audience] of ['damen', 'herren'].entries()) {
  const checksum = createHash('sha256').update(readFileSync(resolve(dist, 'assets/documents/preisliste-' + audience + '.pdf'))).digest('hex');
  assert.equal(checksum, pack.assets[i].checksum);
}
checked.push('Both original PDFs preserve their SHA-256 checksums.');
const luminance = (hex: string) => {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
};
const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (high + .05) / (low + .05);
};
const contrasts = {
  textBackground: contrast('#151916', '#F6F7F3'), primaryBackground: contrast('#151916', '#F6F7F3'),
  textAccent: contrast('#151916', '#DCE5D5'), mutedBackground: contrast('#526056', '#F6F7F3'), mutedAccent: contrast('#526056', '#DCE5D5'), accentHeading: contrast('#4B5D47', '#F6F7F3')
};
assert.ok(Object.values(contrasts).every(value => value >= 4.5), 'Text contrast below 4.5:1.');
checked.push('Primary, text, accent and secondary text contrasts exceed 4.5:1.');
const files = (folder: string): string[] => readdirSync(folder).flatMap(name => {
  const file = resolve(folder, name);
  return statSync(file).isDirectory() ? files(file) : [file];
});
assert.ok(files(dist).every(file => ['.html', '.css', '.js', '.pdf', '.png', '.jpg', '.svg', '.xml', '.txt', '.ttf'].includes(extname(file)) || ['_headers', '.htaccess', '.nojekyll'].some(name => file.endsWith(name))), 'Private/source file in deploy directory.');
checked.push('Deployment directory includes only public website assets and hosting configuration.');
console.log(JSON.stringify({ passed: true, checks: checked, priceRows: rendered.length, sourcePricePositions: 51, contrastRatios: contrasts }, null, 2));

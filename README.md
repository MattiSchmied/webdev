# Webdev · Imhof v2.0.0

- `v1/`: vollständig erhaltene bisherige Repository-Dateien, einschließlich `outputs/Imhof/`.
- `v2/`: aktuelle Premium-Website mit Original-Logo, Original-Porträt von Marita Imhof und vollständigen Einzelpreisen.
- `v2/dist/`: öffentliche Website-Dateien. Nur diese Dateien werden über GitHub Pages ausgeliefert.

Live: https://mattischmied.github.io/webdev/

## Entwicklung und Veröffentlichung

Node.js 24 genügt für Build, lokale Vorschau und Inhaltsprüfungen. Die Website selbst benötigt keine Laufzeitabhängigkeiten.

```sh
cd v2
node src/build.ts
node src/check.ts
node src/serve.ts
```

Mit `SITE_URL` kann die Veröffentlichungsadresse für Canonical-Links, Sitemap, Metadaten und 404-Verweise angepasst werden. Standard ist die obige GitHub-Pages-Adresse. `.github/workflows/deploy-pages.yml` baut und prüft `v2` bei jedem Push auf `main`, lädt ausschließlich `v2/dist` hoch und veröffentlicht das Artefakt auf GitHub Pages. Eine manuelle Ausführung ist ebenfalls möglich.

Die ursprünglichen Logo- und Porträtdateien stammen von der offiziellen Website https://www.friseur-imhof.de/ und wurden unverändert übernommen. Der vorhandene fotografische Hero ist eine klar gekennzeichnete KI-Stilillustration. Quellen und SHA-256-Prüfsummen sind unter `v2/research/` dokumentiert.

Die Datenschutzseite beschreibt die tatsächliche Bereitstellung über GitHub Pages. Es gibt keine Formulare, eigenen Cookies, Analyse- oder Werbeskripte. Bilder, Schrift und Preis-PDFs werden lokal ausgeliefert.

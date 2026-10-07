# Webdev · Website-Kollektion v2.2.0

Live: https://mattischmied.github.io/webdev/

Die Startseite bietet vier direkt erreichbare Vorschauen:

1. `/hairdresser-essential/`: Il Capello · Essential.
2. `/hairdresser-growth/`: Il Capello · Growth.
3. `/shk-growth-team/`: Laurenz + Schwaiger · Growth + Team, einschließlich `karriere/`.
4. `/imhof/`: der bisherige Imhof-Auftritt mit Preisen, Original-PDFs und rechtlichen Unterseiten.

Alle Auftritte enthalten einen Rückweg zur Übersicht. Die bisherigen Imhof-URLs `preise.html`, `impressum.html` und `datenschutz.html` leiten zur passenden Unterseite weiter. Die Kollektion ist eine Konzeptvorschau und mit `noindex,nofollow` sowie einer sperrenden robots.txt gekennzeichnet.

## Build und Veröffentlichung

Node.js 24 genügt. Es sind keine zusätzlichen Laufzeitabhängigkeiten erforderlich.

```sh
node showcase/src/build.ts
```

Der Build erstellt ausschließlich öffentliche Dateien in `showcase/dist/`, baut Imhof aus den vorhandenen Quellen und prüft die vier Auftritte, lokale Links, Anker, die 50 Preispositionen und Original-PDF-Prüfsummen. Mit `SITE_URL` kann eine andere HTTPS-Veröffentlichungsadresse gesetzt werden; alle Unterordner berücksichtigen deren Pfadpräfix.

Der bestehende GitHub-Pages-Workflow baut bei jedem Push auf `main` und veröffentlicht ausschließlich `showcase/dist/`. Recherche, Prompts, Build-Metadaten und TypeScript-Quellen gelangen nicht in das Pages-Artefakt.

## Struktur und Herkunft

- `v1/`: erhaltene frühere Repository-Dateien, einschließlich `outputs/Imhof/`.
- `v2/`: Imhof-Quellen und eigenständig weiterhin nutzbarer Build. Der Kollektion-Build verwendet `OUTPUT_DIR` und `WRITE_MIRROR=false`, um die bisherigen generierten Dateien unverändert zu lassen.
- `showcase/src/`: responsive Auswahlseite und TypeScript-Build.
- `showcase/assets/`: lokale Vorschaubilder, Schriften mit Lizenzen und Styles.
- `showcase/sites/`: eingefrorene öffentliche Ausgaben der drei neuen Konzepte aus reta-platform v0.4.0, Commit `3189037027ff4d437e06d9d5dcda5b70ee4a6597`.

Die drei neuen Auftritte sind handgeschriebene Validierungskonzepte für echte Betriebe, keine Modellresultate und keine freigegebenen Kundenwebsites. Sie verwenden vorhandene Recherche-Snapshots; Angaben können veraltet sein. Die Veröffentlichung als Vorschau wurde ausdrücklich beauftragt. Sie ersetzt keine Freigabe im Reta-Publikationsprozess.

Gestaltungsanspruch für die Auswahl und weitere Arbeit: hochmoderne Websites, perfekte UI, UX und Marketing sowie absolute Premiumqualität. Dieses Qualitätsziel ist keine Behauptung einer abgeschlossenen Kundenfreigabe.

Imhof behält Original-Logo, Original-Porträt, gekennzeichnete KI-Stilillustration und Original-Preis-PDFs. Quellen und Prüfsummen stehen in `v2/research/`. Alle Schriften und Bilder werden lokal ausgeliefert. Google Maps wird in den vorhandenen Auftritten erst nach Zustimmung geladen. Es gibt keine Analyse- oder Werbeskripte auf der Auswahlseite.

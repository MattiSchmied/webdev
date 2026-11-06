# WebDev

[Portal öffnen](https://mattischmied.github.io/webdev/)

WebDev bündelt Webseiten als Vorschau und Apps mit ihren Installationsdateien.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `portal/` | Übersichtsseiten, App-Katalog, Gestaltung und Logos. |
| `sites/imhof/current/` | Aktuelle Imhof-Fassung mit Vorlagen und Originalmaterial. |
| `sites/imhof/archive/` | Erste veröffentlichte Imhof-Fassung. |
| `sites/il-capello/` | Statischer Webauftritt von Il Capello. |
| `apps/<name>/downloads/` | ZIP-Dateien mit Android- und iOS-Installationsdateien der jeweiligen App. |
| `scripts/` | Baut, prüft und zeigt die Website lokal an. |

## Lokal öffnen

Benötigt Node.js 24 oder neuer. Zusätzliche Pakete sind nicht erforderlich.

```sh
npm run build
npm run preview
```

Nur `dist/` wird veröffentlicht. Der GitHub-Pages-Workflow baut bei Änderungen auf `main` und prüft interne Links sowie Inhalte der aktuellen Imhof-Website.

## Inhalte ergänzen

- Neue Apps kommen mit Icon, Kurzbeschreibung und Download-Dateien in den gemeinsamen Katalog unter `portal/apps.mjs`.
- ZIP-Dateien liegen pro App unter `apps/<name>/downloads/`. Die Downloadseiten verlinken direkt auf diese Dateien in GitHub; die Archive werden nicht in das Pages-Artefakt kopiert. So bleibt die Website-Veröffentlichung klein und Downloads können direkt bedient werden.
- Android-Downloads enthalten eine APK. iOS-Downloads enthalten eine IPA und benötigen einen geeigneten Installationsweg; iOS installiert sie nicht direkt aus dem Browser.
- Gestaltung und gemeinsame Portal-Assets liegen unter `portal/assets/`.
- Die Imhof-Versionsleiste bleibt in beiden Fassungen verfügbar und standardmäßig ausgeblendet. Frühere Versionen bleiben im Archiv.

Frühere, nicht verwendete Entwürfe und Build-Ausgaben sind weiterhin in der Git-Historie zu finden.

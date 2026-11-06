# WebDev

[Website öffnen](https://mattischmied.github.io/webdev/) · [Reta-Webseiten](https://mattischmied.github.io/webdev/reta/) · [Sequvia herunterladen](https://mattischmied.github.io/webdev/apps/sequvia/)

WebDev ist der Einstieg zu den Salon-Websites von Reta und zu den Installationsdateien von Sequvia.

| Ordner | Inhalt |
| --- | --- |
| `portal/` | Startseite, Projektübersicht, Versionsauswahl und Downloadseite. |
| `sites/imhof/current/` | Quellen der aktuellen Imhof-Fassung mit Vorlagen, Bildern, Original-PDFs und Recherche. |
| `sites/imhof/archive/` | Statische erste Imhof-Fassung. |
| `sites/il-capello/` | Statischer Desktop-Export vom 5. November 2026, einschließlich Leistungen, Team, Kontakt und Rechtstexten. |
| `apps/sequvia/downloads/` | Die beiden ausgelieferten ZIP-Dateien für Android und iOS. |
| `scripts/` | Baut und prüft die Website; stellt eine lokale Vorschau bereit. |

## Lokal öffnen

Mit Node.js 24, ohne zusätzliche Abhängigkeiten:

```sh
npm run build
npm run preview
```

Die Vorschau gibt ihre URL im Terminal aus. `SITE_URL` legt bei Bedarf eine abweichende HTTPS-Basisadresse fest und muss für Build und Vorschau gleich gesetzt sein. Nur `dist/` wird veröffentlicht. Der GitHub-Pages-Workflow baut bei Pushes auf `main` und prüft lokale Verweise sowie die aktuellen Imhof-Preise und Original-PDFs.

## Inhalte pflegen

- Navigation und Einträge stehen in `portal/pages.mjs`, Gestaltung und Logos in `portal/assets/`.
- Die beiden Sequvia-ZIPs liegen im selben Projekt wie ihre Downloadseite. Neue Dateien an derselben Stelle ersetzen; die angezeigte Dateigröße wird beim Build ermittelt. Eine IPA im ZIP bedeutet keine Direktinstallation unter iOS.
- Die Imhof-Versionsleiste ist in beiden Fassungen über `portal/assets/navigation.css` ausgeblendet. Für die aktuelle Imhof-Fassung werden die HTML-Dateien aus den Vorlagen gebaut. In der Archivfassung ersetzt der Build ein fehlendes Bild durch das mitgelieferte Porträt.
- Frühere ungenutzte Entwürfe und doppelte Build-Ausgaben bleiben in der Git-Historie auffindbar.

# Friseur Imhof v2.0.2 · Modern Premium

Die vollständige Website liegt direkt in diesem Ordner. index.html lässt sich ohne Installation im Browser öffnen; alle wesentlichen Inhalte und Links funktionieren auch ohne JavaScript.

Mit Vorschau-starten.cmd startet auf einem Rechner mit Node.js 24 eine lokale Vorschau unter http://127.0.0.1:4187. Falls dort schon die von Codex gestartete Vorschau läuft, öffnen Sie diese Adresse direkt.

## Öffentliche Website

- index.html: Startseite mit Leistungen, Marita Imhof, beschriftetem Preisauszug, FAQ, Termin und Anfahrt.
- preise.html: vollständige Einzelpreise für Damen, Herren, Senioren, Kinder, Bartpflege, Kosmetik und Hausbesuche.
- impressum.html und datenschutz.html: Betreiberangaben und Datenschutz für die enthaltene statische Website.
- assets/documents/: beide Original-Preislisten-PDFs, unverändert gespeichert.
- dist/: fertige Dateien für statisches Webhosting. Nur diesen Ordnerinhalt veröffentlichen; Recherche- und Quelldateien gehören nicht auf den öffentlichen Server.

## Preise und Recherche

Die offiziellen PDFs wurden am 05.10.2026 heruntergeladen, gerendert und visuell gelesen. Sie enthalten 25 Preispositionen in der Damenliste und 26 in der Herrenliste. Der identische Anfahrtbetrag für Hausbesuche steht in beiden Originalen; deshalb werden 50 unterschiedliche Positionen auf der Website angezeigt.

Preise sind unverändert mit deutschem Dezimalkomma übernommen. Einschließlich der unterschiedlichen Langhaarpreise für Dauerwelle (125,50 €) und Strähnen (125,00 €), aller Altersstufen bei Kindern sowie der Bedingungen für Senioren und Hausbesuche. Die Originale enthalten kein Datum; die Website behauptet deshalb kein vom Betrieb genanntes Gültigkeitsdatum.

research/research-pack.json enthält das abschließende ResearchPack. website-candidate.json enthält das aktualisierte Paar research und candidate. Quellen-IDs, Abrufzeiten und SHA-256 der Original-PDFs sind dokumentiert. managedAssetId ist null, da keine Registrierung im RETA-Assetserver vorgenommen wurde; die Dokumente werden durch die lokale Assetmanifest-Datei zugeordnet.

## Aufbau und Pflege

Keine Laufzeitabhängigkeiten, kein CMS, keine Datenbank, keine Cookies, keine Analytics und keine automatisch geladenen Drittanbieter. Telefon und E-Mail öffnen die jeweilige Anwendung; Google Maps wird ausschließlich nach Klick geöffnet. Manrope wird lokal ausgeliefert; dadurch entstehen keine externen Fontanfragen. Die frei lizenzierte Schrift stammt aus dem offiziellen Google-Fonts-Repository, die SIL Open Font License liegt unter assets/fonts/OFL.txt.

Die Anwendung und der Build sind in TypeScript geschrieben. Mit Node.js 24:

    node src/build.ts
    node src/check.ts
    node src/serve.ts

Optional können für die TypeScript-Prüfung die beiden Entwicklungsabhängigkeiten mit pnpm installiert werden. Danach pnpm typecheck. Die installierten Entwicklungsabhängigkeiten werden nicht für die fertige Website benötigt.

Inhalte stammen aus dem fertigen ResearchPack, Layouts aus src/templates/ und Gestaltung aus src/styles.css. Der Browsercode in src/client.ts enthält das zugängliche Mobilmenü, die lokale Preissuche und dezente Einblendungen. Animationen berücksichtigen reduzierte Bewegung; ohne JavaScript bleiben Inhalte und Preise zugänglich. Der Build schreibt fertige HTML-Dateien sowohl in den Hauptordner als auch nach dist/.

## Gestaltung und Bildnachweis

Die Premium-Neugestaltung verwendet große Manrope-Typografie, warmes Weiß, Anthrazit und gedecktes Salbei. Einheitliche Rundungen, zurückhaltende Interaktionen und großzügige Abstände verbinden Startseite, Preise und Rechtsseiten.

assets/hair-editorial.png wurde mit dem eingebauten Imagegen-Werkzeug eigens für diese Website erzeugt. Das Motiv ist eine fiktive erwachsene Person und wird auf der Website als KI-generierte Stilillustration bezeichnet. Es stellt weder Marita Imhof noch eine Kundin oder den tatsächlichen Salon dar. Der vollständige Generierungs-Prompt und die Herkunft stehen in research/design-assets.json. Es wurden keine echten Salonbilder oder Markenrechte behauptet.

## Hosting

Die Canonical-, Open-Graph- und Sitemap-Adressen verwenden die tatsächliche GitHub-Pages-Adresse https://mattischmied.github.io/webdev/. Eine andere HTTPS-Adresse kann über SITE_URL gesetzt werden. Die Geschäftsdomäne https://www.friseur-imhof.de bleibt unverändert.

dist/_headers enthält Sicherheitsheader für kompatibles statisches Hosting. dist/.htaccess enthält dieselben Header und Weiterleitungen für Apache. Die lokale Vorschau ist nur an 127.0.0.1 gebunden und veröffentlicht keine Quellen- oder Recherchedaten.

Impressum: Name, Adresse, Telefon, E-Mail und Berufsbezeichnung sind aus der offiziellen Website übernommen. Dort sind keine Kammer-/Registerangaben oder Steueridentifikationsnummern veröffentlicht; solche Angaben wurden nicht erfunden. Datenschutz: Der Nutzer hat GitHub Pages als Hoster bestimmt. Die Website beschreibt die dortige Protokollierung von IP-Adressen zu Sicherheitszwecken und verlinkt die offiziellen Datenschutzinformationen von GitHub.

Die Website wurde lokal geprüft und wird als v2 über den GitHub-Pages-Workflow dieses Repositorys veröffentlicht. Die ursprüngliche Unternehmenswebsite wird dadurch nicht verändert.

Original-Logo (assets/imhof-logo.png) und Original-Porträt (assets/marita-imhof.jpg) wurden zusätzlich von der offiziellen Unternehmenswebsite heruntergeladen und unverändert in Kopfbereich, Fußbereich und Inhaberinnen-Abschnitt eingebunden. Dateinachweise stehen in research/design-assets.json.

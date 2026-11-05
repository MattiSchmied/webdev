# WebDev · Webseiten & Apps v2.4.0

Das Portal bündelt zwei Bereiche: **Webseiten → Reta → Friseur Imhof → Versionen** und **Apps → Sequvia → Downloads**. Die aktuelle Imhof-Fassung (v2) steht vor dem Archiv (v1). Die frühere Fassung stammt aus `v1/outputs/Imhof`; ein nicht im Repository vorhandenes Bild wird in der generierten Vorschau durch das vorhandene Porträt ersetzt. Die Quelldateien bleiben unverändert.

Die Sequvia-Seite kennzeichnet Android (APK als ZIP) und iOS (IPA als ZIP) als noch nicht verfügbar. Sobald die Dateien vorliegen, müssen sie eingebunden und die Hinweise durch funktionierende Download-Links ersetzt werden.

## Build

Node.js 24 ist erforderlich; zusätzliche Abhängigkeiten sind nicht nötig:

```sh
node showcase/src/build.ts
```

Der Build schreibt nach `showcase/dist/`, baut und prüft die aktuelle Imhof-Fassung, kopiert die archivierte Fassung und prüft lokale Links. Mit `SITE_URL` kann die HTTPS-Basisadresse einschließlich Pfadpräfix angepasst werden. Der bestehende GitHub-Pages-Workflow veröffentlicht das Ergebnis nach einem Push auf `main`. Das Portal ist mit `noindex,nofollow` und einer sperrenden robots.txt versehen.

`v1/` und `v2/` enthalten die ursprünglichen Fassungen. Der Build verändert sie nicht. Bestehende Imhof-Unterseiten-URLs werden auf die aktuelle Version weitergeleitet.

# NEXUS ONE

**Your Digital Ecosystem.** Die Website bündelt zehn App-Produktseiten, einen filterbaren Katalog, Veröffentlichungen, Downloads und den Kontakt zu NEXUS ONE. Sie verwendet Next.js (App Router), TypeScript, Tailwind CSS, CSS-Module und SQLite.

## Lokal starten

Voraussetzung ist Node.js 24 oder neuer. Öffne ein Terminal in diesem Ordner.

```powershell
npm.cmd ci
npm.cmd run dev
```

Öffne [die lokale Website](http://127.0.0.1:3000/). Auf macOS und Linux kannst du in allen Befehlen `npm` verwenden.

Für den redaktionellen Admin-Zugang, den Kontaktversand und bei Bedarf eine abweichende Worker-Adresse kopierst du `.env.example` nach `.env.local` und trägst die benötigten Werte ein. Starte den Server nach Änderungen an `.env.local` neu.

## Website-Zugang und zentrale Codes

Der Zugang zur Website läuft über `/zugang`. Er benötigt einen Zugangscode, den das LingoFlow-Admin-Dashboard für **NEXUS ONE Website** (`nexus_one_web`) freigegeben hat. Standardmäßig verwendet die Website den bestehenden LingoFlow-Cloudflare-Worker. Der Worker muss die produktbezogene Einlösung und die Sitzungsprüfung unterstützen. Für eine isolierte Testinstanz desselben Workers kann `NEXUS_ACCESS_WORKER_URL` auf deren Ursprung gesetzt werden.

Die Website sendet den Code serverseitig an den Worker und prüft dessen Sitzung bei geschützten Seiten und direkten API-Aufrufen. Eine gültige Sitzung wird weiterverwendet. Ihr Cookie ist an die Website gebunden und bei öffentlichem Betrieb nur über HTTPS nutzbar. Zugangscodes, Produktberechtigungen und Aktivierungen verwaltet ausschließlich der LingoFlow-Worker. Die lokale SQLite-Datei speichert redaktionelle Inhalte, hochgeladene Dateien und den redaktionellen Admin-Zugang.

Die Zugangsseite hinterlegt vor der Einlösung außerdem eine zufällige Vorgangskennung in einem eigenen geschützten Cookie. Wenn die Aktivierung beim Worker erfolgreich war und die Antwort auf dem Rückweg verloren geht, kann der nächste Aufruf der Zugangsseite die bereits erteilte Sitzung wiederherstellen. Eine Wiederholung mit derselben Vorgangskennung verwendet die ursprüngliche Aktivierung.

Für eine isolierte lokale Vorschau ohne Worker-Verbindung kannst du `NEXUS_ACCESS_LOCAL_BYPASS=true` setzen. Das erfordert eine explizite `NEXUS_SITE_URL` mit einer HTTP-Loopback-Adresse und einen Aufruf über genau diese Adresse. Lass diese Einstellung im öffentlichen Betrieb deaktiviert.

## Redaktionellen Admin-Zugang einrichten

Erzeuge einen Hash aus einem Admin-Passwort mit mindestens zwölf Zeichen. In PowerShell 7 kannst du das Passwort verdeckt eingeben.

```powershell
$nexusPassword = Read-Host 'Admin-Passwort' -MaskInput
$nexusPassword | node .\scripts\hash-admin-password.mjs
Remove-Variable nexusPassword
```

Unter Bash kannst du denselben Helfer so aufrufen.

```bash
read -rs -p 'Admin-Passwort: ' nexusPassword
printf '%s' "$nexusPassword" | node scripts/hash-admin-password.mjs
unset nexusPassword
```

Erzeuge zusätzlich ein zufälliges Session-Geheimnis.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Trage die Admin-E-Mail in `NEXUS_ADMIN_EMAIL`, den ausgegebenen Hash in `NEXUS_ADMIN_PASSWORD_HASH` und das Session-Geheimnis in `NEXUS_SESSION_SECRET` ein. Melde dich unter `/admin` mit E-Mail und dem ursprünglichen Passwort an. Eine Änderung des Passwort-Hashes oder Session-Geheimnisses macht bestehende Sitzungen ungültig.

Im Dashboard kannst du Apps anlegen, bearbeiten und entfernen, bestätigte Funktionen und Vorteile ergänzen, den Status ändern, Screenshots hochladen und Meldungen veröffentlichen. Die zehn mitgelieferten App-Einträge beginnen mit dem Status **Im Katalog**. Produktdaten und Meldungen erscheinen nach dem Speichern auf den zugehörigen öffentlichen Seiten. Beim Entfernen einer App werden auch ihre Downloads und Screenshots entfernt.

### Dateien veröffentlichen

Ein Download braucht App, Plattform, Version, Datum, Änderungsprotokoll und eine Datei. Die Dateigröße wird aus dem Upload ermittelt. Pro App, Plattform und Version kann eine Datei veröffentlicht werden.

| Plattform | Akzeptierte Dateien |
| --- | --- |
| Windows | `.exe`, `.msi`, `.zip` |
| Android | `.apk` |
| iOS | `.ipa` |
| Web | `.zip` |

Das Upload-Limit pro Download beträgt 64 MiB. Screenshots benötigen einen Alternativtext und können als PNG, JPEG oder WebP bis 5 MiB hochgeladen werden. Verwende bei ausführbaren Dateien deine geprüften Veröffentlichungsartefakte. Das System prüft Formatmerkmale, Dateityp und Größe.

## Kontaktversand einrichten

Setze `NEXUS_SMTP_HOST`, `NEXUS_CONTACT_FROM` und `NEXUS_CONTACT_TO`. Für STARTTLS verwende normalerweise Port 587 mit `NEXUS_SMTP_SECURE=false`. Für implizites TLS verwende normalerweise Port 465 mit `NEXUS_SMTP_SECURE=true`. Setze `NEXUS_SMTP_USER` und `NEXUS_SMTP_PASSWORD`, falls dein Mailserver eine Anmeldung verlangt.

Das Formular meldet Erfolg, wenn der SMTP-Server die Nachricht akzeptiert. Ohne vollständige Konfiguration ist der Versand deaktiviert. Das Backend prüft Eingaben, Anfrageherkunft und das Spam-Feld und begrenzt die Anzahl der Anfragen.

## Produktionsbuild und Tests

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd start
```

Der Integrationstest startet den Produktionsbuild mit einer separaten temporären Datenbank und einem lokalen SMTP-Empfänger. Er prüft unter anderem Anmeldung und Abmeldung, CSRF, Dateiuploads und -abrufe, Meldungen sowie erfolgreiche und abgelehnte SMTP-Zustellung. Er versendet keine Nachrichten über einen externen Mailserver.

Für einen öffentlichen Betrieb setze `NEXUS_SITE_URL` vor dem Build auf deine kanonische HTTPS-Adresse und betreibe die Anwendung hinter einem HTTPS-Reverse-Proxy. `npm start` lauscht lokal auf `127.0.0.1`. Halte `.env.local` und den persistenten SQLite-Ordner außerhalb öffentlicher Dateipfade. Die Datenbank liegt standardmäßig in `.nexus-data/nexus.sqlite`. `NEXUS_DATA_DIR` erlaubt einen anderen Speicherort auf einem persistenten lokalen Datenträger. Die Datenbank enthält auch hochgeladene Dateien. Sichere sie mit der SQLite-Backup-Funktion oder bei gestopptem Server.

Bei vorgeschaltetem Reverse-Proxy kann `NEXUS_CLIENT_IP_HEADER` für getrennte Anfragelimits gesetzt werden. Der Proxy muss den Header überschreiben und genau eine gültige IP-Adresse übergeben. Standardmäßig gelten gemeinsame Limits.

## Projektstruktur

- `app/` enthält öffentliche Seiten, Administration, API-Routen und SEO-Dateien.
- `components/` enthält Layout, App-Darstellungen und Bedienelemente.
- `lib/catalog.ts` definiert die anfänglichen Produktprofile. `lib/server/` enthält Datenhaltung, Authentifizierung und SMTP.
- `tests/` enthält den Integrationstest für den Produktionsserver.

Die App-Grafiken sind als Designvorschauen gekennzeichnet. Das Hero-Motiv wurde mit dem integrierten ImageGen-Werkzeug erzeugt und als [optimiertes WebP](public/nexus-orbit.webp) gespeichert.

<details>
<summary>ImageGen-Prompt</summary>

```text
Use case: stylized-concept. Generate a cinematic wide 3:2 hero backdrop visual for a German premium futuristic software ecosystem, no typography or logo. A single beautiful toroidal hyperspace ring / dark-metal orbital technology, facing the camera almost front-on, tilted by around 20 degrees around diagonal so it becomes a strong tall oval, suspended in near black space. In the right half of frame, ring takes 70% of image height and 48% of image width. Fine realistic radial carbon-metal structures and engraved concentric segments, intense fine lines of electric indigo/royal blue and soft violet moving around the rim, a very dark hollow center, the lower-left leading edge shines brighter. A very faint second inner rim gives beautiful physical depth. Subtle dust motes and fine particles, understated gossamer wisps of blue and violet energy mostly at right, fine bloom, soft starless shadow at edges. Premium Apple-like 3D product photography mixed with dark sci-fi editorial design. Background must be nearly black charcoal #070812, especially the ENTIRE leftmost 35% dark blank negative space and image edges. Design refined and minimal, dramatic controlled light, strong focal point, expensive technology feeling, no extraneous objects, no scenery, no planets, no UI grids, no overlays, no orbit text, no lettering or watermark. This is a background for a website with text placed over the left.
```

</details>

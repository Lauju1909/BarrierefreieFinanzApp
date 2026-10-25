const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

// 1. Update version.json
const versionFile = path.join(baseDir, 'version.json');
if (fs.existsSync(versionFile)) {
  const vData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  vData.version = '6.9.34';
  vData.buildDate = '2026-10-25';
  const newFeatures = [
    '🌐 Sprachauswahl & Mehrsprachigkeit (Automatische Erkennung der Systemsprache, Deutsch, Englisch): Wählbar in den Einstellungen unter Darstellung & Design mit automatischer Erkennung beim Erststart und vollständiger NVDA/TalkBack Sprachunterstützung',
    '📱 Aufgeräumtes 3-Reiter Smartphone-Sync-Menü (Reiter 8): Klare Trennung in 1. Gekoppelte Geräte, 2. Gerät koppeln und 3. Kopplungsdaten mit fokussierter Einzelansicht',
    '🔗 Multi-Geräte & Transitive Gruppen-Kopplung: PC, Smartphone und Laptop koppeln sich automatisch im Verbund – einmal gekoppelt sind alle Geräte synchron',
    '🔢 Flexible Dezimaleingabe: Komma (,), Semikolon (;) und Punkt (.) werden in allen Betragsfeldern einheitlich als Cent-Trennzeichen verarbeitet',
    '🔁 Dauerauftrag Beenden / Löschen: Automatischer Tastatur- und Screenreader-Fokus direkt in die Beenden-Auswahl',
    '📅 Klare Monats- und Wochen-Auswahl ohne Unterbrechung durch Kontostands-Ansagen'
  ];
  vData.features = [...newFeatures, ...vData.features.filter(f => !newFeatures.includes(f))];
  fs.writeFileSync(versionFile, JSON.stringify(vData, null, 2), 'utf8');
  console.log('✅ version.json updated to 6.9.34');
}

// 2. Update CHANGELOG.md
const changelogFile = path.join(baseDir, 'CHANGELOG.md');
if (fs.existsSync(changelogFile)) {
  let cl = fs.readFileSync(changelogFile, 'utf8');
  const newChangelogEntry = `## 🌐 Sprachauswahl (Systemsprache / Deutsch / Englisch) & Barrierefreie Verbesserungen (v6.9.34)
*Datum: 25. Oktober 2026*

### 🌐 1. Sprachauswahl in den Einstellungen (Reiter 5 -> Darstellung & Design)
- **Automatische Systemsprache:** Erkennt beim Start automatisch, ob das Betriebssystem auf Deutsch oder Englisch eingestellt ist (\`navigator.languages\` / \`navigator.language\`).
- **Flexible Sprachwahl:** In den Einstellungen unter *Darstellung & Design* kann jederzeit zwischen drei Optionen gewählt werden:
  1. 🌐 *Automatisch (Systemsprache / System Language)*
  2. 🇩🇪 *Deutsch (German)*
  3. 🇬🇧 *English (Englisch)*
- **Umfassende Lokalisierung:**
  - Hauptnavigation (Reiter 1 bis 9)
  - Kopfbereich & Sperrbildschirm
  - Zeitraum-Filter und Dropdowns
  - Monatsnamen in allen Diagrammen, Akkordeons und Übersichten
  - Einstellungs-Beschriftungen und Formulare
- **Barrierefreie Screenreader-Ansage:** Beim Umschalten informiert NVDA / TalkBack sofort über die geänderte Sprache, und das HTML-\`lang\`-Attribut wird dynamisch aktualisiert.

---

`;
  if (!cl.includes('v6.9.34')) {
    cl = cl.replace(/(# 📜 Offizielles Änderungsprotokoll \(Changelog\)\r?\n\*\*Barrierefreie Finanz-App & Haushaltsbuch\*\*\r?\n\r?\n)/i, `$1${newChangelogEntry}`);
    fs.writeFileSync(changelogFile, cl, 'utf8');
    console.log('✅ CHANGELOG.md updated to 6.9.34');
  }
}

// 3. Update AENDERUNGSPROTOKOLL.txt
const protoFile = path.join(baseDir, 'AENDERUNGSPROTOKOLL.txt');
if (fs.existsSync(protoFile)) {
  let ap = fs.readFileSync(protoFile, 'utf8');
  const newProtoEntry = `--------------------------------------------------------------------------------
VERSION 6.9.34 (Aktuelle Version - 25. Oktober 2026)
--------------------------------------------------------------------------------

* SPRACHAUSWAHL & MEHRSPRACHIGKEIT (SYSTEMSPRACHE / DEUTSCH / ENGLISCH):
  - In Reiter 5 (Einstellungen -> Darstellung & Design) gibt es eine neue Sprachauswahl.
  - Automatische Erkennung der Betriebssystem-Sprache (Windows / Android).
  - Volle Umschaltbarkeit zwischen:
    1. Automatisch (Systemsprache)
    2. Deutsch
    3. English
  - Dynamische Übersetzung der Hauptreiter 1 bis 9, Sperrbildschirm, Monatsnamen,
    Zeitraumfilter und Einstellungen.
  - Sofortige Screenreader-Ansage beim Wechsel (NVDA / TalkBack).

* AUFGERAEUMTES 3-REITER SMARTPHONE-SYNC-MENUE (REITER 8):
  - Klare Trennung oben in drei uebersichtliche Bereiche:
    1. [1. Gekoppelte Geraete] - Zeigt ausschliesslich verbundene Geraete & Postfach
    2. [2. Geraet koppeln] - Zeigt ausschliesslich das Formular zum Verbinden
    3. [3. Kopplungsdaten] - Zeigt ausschliesslich den eigenen Code & Geraetenamen
  - Beim Klick wird immer nur der gewaehlte Bereich eingeblendet.

* TRANSITIVE MULTI-GERAETE-KOPPLUNG (PC <-> SMARTPHONE <-> LAPTOP):
  - Beliebig viele Geraete gleichzeitig verwalten.
  - Koppelt man den Laptop mit dem Smartphone, ist er automatisch auch mit dem PC
    gekoppelt, ohne den Code nochmals am PC eingeben zu muessen.

* KOMMA (,), SEMIKOLON (;) & PUNKT (.) BEI ALLEN BETRAEGEN:
  - In saemtlichen Betragsfeldern koennen Betraege flexibel mit Komma, Semikolon
    oder Punkt fuer die Cent-Trennung eingetippt werden.

* DAUERAUFTRAG BEENDEN / LOESCHEN MIT DIREKTEM FOKUS-SPRUNG:
  - Klickt man auf "Beenden / Loeschen", springt der Fokus fuer Tastatur und
    Screenreader sofort in das Auswahlfenster auf Option 1 (Beenden mit Historie).

* KLARE MONATS- UND WOCHEN-ANSAGE BEI ZEITRAUM-AUSWAHL:
  - Beim Auswaehlen von Monaten oder Kalenderwochen wird direkt der Zeitraum
    vorgelesen, ohne dass der Kontostand ungewollt dazwischenfunkt.
  - Kalenderwochen-Auswahlfeld (KW 1 bis KW 52) in der Wochenansicht.

* KEEPASS 2 SICHERHEITS-SUITE & ARGON2ID SCHLUESSELABLEITUNG:
  - Hoechster kryptografischer Schutz mit Argon2id (64 MB RAM, 3 Runden).
  - 100% abwaertskompatible Dual-Engine fuer bisherige PBKDF2-Tresore.
  - Strukturierte Einstellungs-Tabs (7 Kategorien).
  - Automatisches Sperren & Speicherbereinigung (Zeroization) bei Bildschirmsperre (Win+L) und Standby.

`;
  if (!ap.includes('VERSION 6.9.34')) {
    ap = ap.replace(/(================================================================================\r?\n\s*HAUSHALTSBUCH - AENDERUNGSPROTOKOLL\r?\n================================================================================\r?\n\r?\n)/i, `$1${newProtoEntry}`);
    fs.writeFileSync(protoFile, ap, 'utf8');
    console.log('✅ AENDERUNGSPROTOKOLL.txt updated to 6.9.34');
  }
}

// 4. Update index.html changelog modal
const indexFile = path.join(baseDir, 'index.html');
if (fs.existsSync(indexFile)) {
  let html = fs.readFileSync(indexFile, 'utf8');
  html = html.replace(/Was ist neu in diesem Update\? \(v[\d\.]+\)/, 'Was ist neu in diesem Update? (v6.9.34)');
  
  const changelogHtmlSnippet = `<div style="background: rgba(2, 136, 209, 0.1); border-left: 6px solid #0288D1; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px;">
<h3 style="margin: 0 0 8px 0; color: #01579B; font-size: 20px;">🌐 Neu: Sprachauswahl (Systemsprache / Deutsch / Englisch) in Einstellungen</h3>
<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
<li><strong>🌐 Automatische Systemsprache:</strong> Erkennt beim App-Start automatisch die Systemsprache deines Computers oder Smartphones (Deutsch oder Englisch).</li>
<li><strong>⚙️ Umschaltbar in den Einstellungen:</strong> In Reiter 5 (Darstellung &amp; Design) kann jederzeit frei zwischen <em>Automatisch</em>, <em>Deutsch</em> und <em>English</em> gewechselt werden.</li>
<li><strong>🧭 Lokalisierte Navigation &amp; Übersichten:</strong> Alle 9 Hauptreiter, Kopfzeilen, Sperrbildschirm, Monatsnamen und Zeitraumfilter passen sich sofort barrierefrei an.</li>
<li><strong>🗣️ Screenreader-Rückmeldung:</strong> Beim Sprachwechsel kündigt NVDA / TalkBack die neue Sprache sofort an und setzt das Dokumenten-Sprachattribut.</li>
</ul>
</div>\n`;

  if (!html.includes('🌐 Neu: Sprachauswahl (Systemsprache / Deutsch / Englisch)')) {
    html = html.replace(/(<div class="changelog-content"[^>]*>\r?\n)/i, `$1${changelogHtmlSnippet}`);
    fs.writeFileSync(indexFile, html, 'utf8');
    console.log('✅ index.html changelog modal updated to 6.9.34');
  }
}

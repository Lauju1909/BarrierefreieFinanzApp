const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

// 1. Update version.json
const versionFile = path.join(baseDir, 'version.json');
if (fs.existsSync(versionFile)) {
  const vData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  vData.version = '6.9.35';
  vData.buildDate = '2026-10-25';
  const newFeatures = [
    '💱 Multi-Währungs-System & Standard-Währung: Wähle in den Einstellungen (Reiter 5) deine Hauptwährung (Automatisch nach Sprache mit EUR/USD, oder manuell aus modernen & historischen Währungen wie DM, Schilling, Franc)',
    '🔴 Währungsauswahl bei Ausgaben (Reiter 2): Flexibles Erfassen von Ausgaben in Fremdwährungen mit automatischer Cent-genauer Umrechnung in die Basiswährung',
    '💱 Aufklappbarer Währungsrechner (Reiter 1): Komfortables Umrechnen beliebiger Beträge zwischen aktuellen und historischen Währungen mit 1-Klick-Tausch und NVDA-Sprachansage',
    '🌐 Sprachauswahl & Mehrsprachigkeit (Automatische Erkennung der Systemsprache, Deutsch, Englisch): Wählbar in den Einstellungen unter Darstellung & Design mit automatischer Erkennung beim Erststart und vollständiger NVDA/TalkBack Sprachunterstützung',
    '📱 Aufgeräumtes 3-Reiter Smartphone-Sync-Menü (Reiter 8): Klare Trennung in 1. Gekoppelte Geräte, 2. Gerät koppeln und 3. Kopplungsdaten mit fokussierter Einzelansicht',
    '🔗 Multi-Geräte & Transitive Gruppen-Kopplung: PC, Smartphone und Laptop koppeln sich automatisch im Verbund – einmal gekoppelt sind alle Geräte synchron',
    '🔢 Flexible Dezimaleingabe: Komma (,), Semikolon (;) und Punkt (.) werden in allen Betragsfeldern einheitlich als Cent-Trennzeichen verarbeitet',
    '🔁 Dauerauftrag Beenden / Löschen: Automatischer Tastatur- und Screenreader-Fokus direkt in die Beenden-Auswahl',
    '📅 Klare Monats- und Wochen-Auswahl ohne Unterbrechung durch Kontostands-Ansagen'
  ];
  vData.features = [...newFeatures, ...vData.features.filter(f => !newFeatures.includes(f))];
  fs.writeFileSync(versionFile, JSON.stringify(vData, null, 2), 'utf8');
  console.log('✅ version.json updated to 6.9.35');
}

// 2. Update CHANGELOG.md
const changelogFile = path.join(baseDir, 'CHANGELOG.md');
if (fs.existsSync(changelogFile)) {
  let cl = fs.readFileSync(changelogFile, 'utf8');
  const newChangelogEntry = `## 💱 Multi-Währungs-System, Währungsauswahl bei Ausgaben & Währungsrechner (v6.9.35)
*Datum: 25. Oktober 2026*

### 💱 1. Standard-Währung in den Einstellungen (Reiter 5 -> Darstellung & Design)
- **Automatisch nach Sprache:** Standardmäßig wird bei deutscher Sprache Euro (€) und bei englischer Sprache US-Dollar ($) oder Britisches Pfund (£) verwendet.
- **Große Währungsauswahl:**
  - **Aktuelle Hauptwährungen:** Euro (€), US-Dollar ($), Britisches Pfund (£), Schweizer Franken (CHF), Japanischer Yen (¥), Kanadischer Dollar (CA$), Australischer Dollar (AU$), Polnischer Złoty (zł), Tschechische Krone (Kč), Dänische Krone (kr), Schwedische Krone (kr), Norwegische Krone (kr), Türkische Lira (₺), Bitcoin (₿).
  - **Historische & frühere Währungen:** Deutsche Mark (DM), Österreichischer Schilling (öS), Französischer Franc (FF), Italienische Lira (L.), Spanische Peseta (Ptas), Niederländischer Gulden (fl.), Belgischer Franc (BFR), Griechische Drachme (Dr.) mit offiziellen unwiderruflichen EZB-Umrechnungskursen.
- **Vollständige Formatierung:** Alle Kontostände, Statistiken, Akkordeons und Übersichten formatieren sich sofort mit dem passenden Währungssymbol.

### 🔴 2. Währungsauswahl beim Eintragen von Ausgaben (Reiter 2)
- **Währung pro Buchung wählbar:** Direkt neben dem Betragsfeld steht eine Währungsauswahl bereit, die automatisch mit deiner Standard-Währung vorbelegt ist.
- **Automatische Umrechnung:** Wählst du eine abweichende Währung (z. B. Ausgabe in USD im Urlaub oder historische Anschaffung in DM), rechnet die App den Betrag live centgenau in deine Basiswährung um und vermerkt den Originalbetrag in den Buchungsdetails.

### 💱 3. Aufklappbarer Währungsrechner in der Übersicht (Reiter 1)
- **Komfortables Akkordeon:** Am Ende von Reiter 1 steht ein barrierefreier Währungsrechner bereit, der jederzeit ein- und ausgeklappt werden kann.
- **Live-Umrechnung & Währungstausch:** Betrag eingeben, Quell- und Zielwährung wählen – mit Klick auf „💱 Jetzt umrechnen“ oder „🔄 Währungen tauschen“ liest NVDA / TalkBack das exakte Umrechnungsergebnis samt offiziellem Wechselkurs vor.

---

`;
  if (!cl.includes('v6.9.35')) {
    cl = cl.replace(/(# 📜 Offizielles Änderungsprotokoll \(Changelog\)\r?\n\*\*Barrierefreie Finanz-App & Haushaltsbuch\*\*\r?\n\r?\n)/i, `$1${newChangelogEntry}`);
    fs.writeFileSync(changelogFile, cl, 'utf8');
    console.log('✅ CHANGELOG.md updated to 6.9.35');
  }
}

// 3. Update AENDERUNGSPROTOKOLL.txt
const protoFile = path.join(baseDir, 'AENDERUNGSPROTOKOLL.txt');
if (fs.existsSync(protoFile)) {
  let ap = fs.readFileSync(protoFile, 'utf8');
  const newProtoEntry = `--------------------------------------------------------------------------------
VERSION 6.9.35 (Aktuelle Version - 25. Oktober 2026)
--------------------------------------------------------------------------------

* MULTI-WAEHRUNGS-SYSTEM & STANDARD-WAEHRUNG (EINSTELLUNGEN):
  - In Reiter 5 (Einstellungen -> Darstellung & Design) kann die Hauptwaehrung
    flexibel eingestellt werden.
  - Automatische Vorbelegung je nach Sprache:
    * Deutsch: Euro (€)
    * Englisch: US-Dollar ($) oder Britisches Pfund (£)
  - Vollstaendige Unterstuetzung moderner Hauptwaehrungen (EUR, USD, GBP, CHF,
    JPY, CAD, AUD, PLN, CZK, DKK, SEK, NOK, TRY, BTC).
  - Volle Unterstuetzung historischer Waehrungen mit offiziellen EZB-Wechselkursen:
    * Deutsche Mark (1 EUR = 1,95583 DM)
    * Oesterreichischer Schilling (1 EUR = 13,7603 oeS)
    * Franzoesischer Franc, Italienische Lira, Spanische Peseta, Gulden uvm.

* WAEHRUNGSAUSWAHL BEI AUSGABEN (REITER 2):
  - Beim Erfassen einer Ausgabe kann die Waehrung flexibel gewaehlt werden.
  - Automatische Cent-genaue Umrechnung in die Basiswaehrung mit Live-Vorschau.
  - Originalbetrag und Waehrung werden transparent an der Buchung hinterlegt.

* AUFKLAPPBARER WAEHRUNGSRECHNER IN DER UEBERSICHT (REITER 1):
  - Am Ende von Reiter 1 steht ein barrierefreier Waehrungsrechner bereit.
  - Schnelle Umrechnung beliebiger Betraege mit Wechselkursanzeige.
  - "Jetzt umrechnen" und "Waehrungen tauschen" mit NVDA/TalkBack Sprachausgabe.

`;
  if (!ap.includes('VERSION 6.9.35')) {
    ap = ap.replace(/(================================================================================\r?\n\s*HAUSHALTSBUCH - AENDERUNGSPROTOKOLL\r?\n================================================================================\r?\n\r?\n)/i, `$1${newProtoEntry}`);
    fs.writeFileSync(protoFile, ap, 'utf8');
    console.log('✅ AENDERUNGSPROTOKOLL.txt updated to 6.9.35');
  }
}

// 4. Update index.html changelog modal
const indexFile = path.join(baseDir, 'index.html');
if (fs.existsSync(indexFile)) {
  let html = fs.readFileSync(indexFile, 'utf8');
  html = html.replace(/Was ist neu in diesem Update\? \(v[\d\.]+\)/, 'Was ist neu in diesem Update? (v6.9.35)');
  
  const changelogHtmlSnippet = `<div style="background: rgba(0, 150, 136, 0.1); border-left: 6px solid #009688; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px;">
<h3 style="margin: 0 0 8px 0; color: #004D40; font-size: 20px;">💱 Neu: Multi-Währungs-System, Währungsauswahl bei Ausgaben &amp; Währungsrechner</h3>
<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
<li><strong>💱 Standard-Währung in den Einstellungen:</strong> Wähle in Reiter 5 (Darstellung &amp; Design) deine Hauptwährung – automatisch nach Sprache (Euro bei Deutsch, Dollar bei Englisch) oder frei aus aktuellen Hauptwährungen und historischen Währungen (Deutsche Mark, Schilling, Franc).</li>
<li><strong>🔴 Währung bei Ausgaben frei wählbar:</strong> Beim Buchen einer Ausgabe in Reiter 2 kann neben dem Betrag direkt die Währung bestimmt werden. Bei Fremdwährungen wird automatisch centgenau in deine Basiswährung umgerechnet.</li>
<li><strong>💱 Aufklappbarer Währungsrechner in der Übersicht:</strong> Am Ende von Reiter 1 steht ein barrierefreier Währungsrechner zum Aufklappen bereit, der beliebige Beträge blitzschnell umrechnet und per Sprachausgabe für NVDA / TalkBack ansagt.</li>
</ul>
</div>\n`;

  if (!html.includes('💱 Neu: Multi-Währungs-System, Währungsauswahl bei Ausgaben')) {
    html = html.replace(/(<div class="changelog-content"[^>]*>\r?\n)/i, `$1${changelogHtmlSnippet}`);
    fs.writeFileSync(indexFile, html, 'utf8');
    console.log('✅ index.html changelog modal updated to 6.9.35');
  }
}

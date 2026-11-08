const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');

// 1. Update index.html
const indexHtmlPath = path.join(repoDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

html = html.replace(
  '<h2 id="changelog-modal-heading" tabindex="-1" style="margin: 0; font-size: 24px;">Was ist neu in diesem Update? (v6.9.67)</h2>',
  '<h2 id="changelog-modal-heading" tabindex="-1" style="margin: 0; font-size: 24px;">Was ist neu in diesem Update? (v6.9.68)</h2>'
);

const newCard = `<div style="background: rgba(230, 81, 0, 0.08); border-left: 6px solid #e65100; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px;">
<h3 style="margin: 0 0 8px 0; color: #bf360c; font-size: 20px;">⚡ Neu: 100% Rust-Desktop-Engine, Blitzschneller Start &amp; Direkter Vordergrund</h3>
<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
<li><strong>⚡ 100% Native Rust-Desktop-Engine:</strong> Vollständige Umstellung auf native, ressourcenschonende Rust-Architektur. Keine Abhängigkeiten mehr von Python oder C#, maximale Stabilität und minimaler Speicherverbrauch.</li>
<li><strong>🖥️ Sofortige Fenster-Aktivierung im Vordergrund:</strong> Direkte Einbindung der Windows <code>AllowSetForegroundWindow</code>-API sorgt dafür, dass sich das Anwendungsfenster beim Starten sofort in den Vordergrund schiebt und nicht mehr hinter anderen Fenstern verborgen bleibt.</li>
<li><strong>🛑 Keine Konsolenfenster mehr:</strong> Beseitigung aller störenden schwarzen CMD- und Eingabeaufforderungs-Fenster durch saubere Prozessinitialisierung mit <code>CREATE_NO_WINDOW</code>.</li>
<li><strong>🧹 Browser-Cache-Bereinigung &amp; Turbo-Startflags:</strong> Über 250 MB Altlasten und Telemetriedaten aus dem Chrome-Profil bereinigt. Start mit optimierten Performance-Flags ohne Hintergrundoverhead.</li>
<li><strong>⌨️ Direkter Fokus &amp; NVDA-Bereitschaft:</strong> Automatischer Tastatur- und Screenreader-Fokus direkt auf das PIN-Eingabefeld beim Start bzw. nach dem Schließen dieses Update-Hinweises.</li>
<li><strong>🛡️ Rust SemVer-Update-Prüfung:</strong> Zuverlässige Versionsprüfung verhindert wiederholte Downloads bereits installierter Versionen.</li>
<li><strong>📜 Update-Hinweis reaktiviert:</strong> Dieser Hinweis erscheint wie gewünscht bei neuen Updates automatisch und kehrt nach dem Schließen direkt zum Entsperren zurück.</li>
</ul>
</div>`;

const targetAnchor = '<div class="changelog-content" style="max-height: 52vh; overflow-y: auto; padding-right: 8px; font-size: 16px; line-height: 1.6;">';
if (!html.includes(newCard)) {
  const newline = html.includes(targetAnchor + '\r\n') ? '\r\n' : '\n';
  html = html.replace(targetAnchor + newline, targetAnchor + newline + newCard + newline);
}

html = html.replace('Installierte Version: <strong>v6.9.67</strong>', 'Installierte Version: <strong>v6.9.68</strong>');
html = html.replace('<strong>Barrierefreie Finanzen v6.9.67</strong>', '<strong>Barrierefreie Finanzen v6.9.68</strong>');

fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('✓ index.html updated');

// 2. Update version.json
const versionJsonPath = path.join(repoDir, 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
versionData.version = "6.9.68";
versionData.buildDate = "2026-11-08";

const newFeatures = [
  "⚡ 100% Native Rust-Desktop-Engine: Vollständige Umstellung auf native, ressourcenschonende Rust-Architektur ohne Python/C# für maximale Performance und minimalen Ressourcenverbrauch",
  "🖥️ Sofortige Fenster-Aktivierung im Vordergrund: Windows AllowSetForegroundWindow API stellt sicher, dass das Haushaltsbuch sofort sichtbar im Vordergrund geöffnet wird",
  "🛑 Keine Konsolenfenster mehr: Vollständige Unterdrückung aller schwarzen CMD-Eingabeaufforderungen beim Start und Update durch CREATE_NO_WINDOW",
  "🧹 Turbo-Start & Cache-Bereinigung: Bereinigung von über 250 MB temporären Chrome-Profildaten und Start mit Hochgeschwindigkeits-Flags",
  "⌨️ Automatischer Tastatur- & Screenreader-Fokus: Sofortige Fokussierung des PIN-Eingabefelds beim Start und nach Schließen des Änderungsprotokolls",
  "🛡️ SemVer-Update-Prüfung: Rust-basierte Versionsprüfung verhindert doppelte Download-Schleifen bei Versionsgleichheit",
  "📜 Reaktiviertes Änderungsprotokoll-Modal: Anzeige von Neuerungen bei Updates mit direktem Fokus-Rücksprung auf die PIN-Eingabe"
];

// Prepend features if not already present
versionData.features = [...newFeatures, ...versionData.features.filter(f => !newFeatures.includes(f))];
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf8');
console.log('✓ version.json updated');

// 3. Update Cargo.toml
const cargoTomlPath = path.join(repoDir, 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = ".*"/m, 'version = "6.9.68"');
fs.writeFileSync(cargoTomlPath, cargoToml, 'utf8');
console.log('✓ Cargo.toml updated');

// 4. Update src/main.rs
const mainRsPath = path.join(repoDir, 'src', 'main.rs');
let mainRs = fs.readFileSync(mainRsPath, 'utf8');
mainRs = mainRs.replace(/const APP_VERSION: &str = ".*";/, 'const APP_VERSION: &str = "6.9.68";');
// Also update tests in main.rs if they reference specific version
mainRs = mainRs.replace('assert!(is_newer_version("6.9.67", "6.9.66"));', 'assert!(is_newer_version("6.9.68", "6.9.67"));');
fs.writeFileSync(mainRsPath, mainRs, 'utf8');
console.log('✓ src/main.rs updated');

// 5. Update AENDERUNGSPROTOKOLL.txt
const protoPath = path.join(repoDir, 'AENDERUNGSPROTOKOLL.txt');
let proto = fs.readFileSync(protoPath, 'utf8');

const newProtoEntry = `--------------------------------------------------------------------------------
VERSION 6.9.68 (Aktuelle Version - 08. November 2026)
--------------------------------------------------------------------------------

* 100% NATIVE RUST-DESKTOP-ENGINE & TURBO-START:
  - Vollständige Umstellung der Desktop-App auf eine hochmoderne, native Rust-
    Architektur.
  - Vollständiger Verzicht auf externe Runtimes (weder Python noch C# erforderlich).
  - Minimaler Arbeitsspeicherverbrauch, sofortige Reaktionszeiten und maximale
    Zuverlässigkeit.

* WINDOWS VORDERGRUND-AKTIVIERUNG (ALLOWSETFOREGROUNDWINDOW):
  - Direkte Einbindung der nativen Windows Win32 API.
  - Das Anwendungsfenster schiebt sich beim Starten sofort in den Vordergrund und
    bleibt niemals mehr hinter anderen Fenstern verborgen.

* VOLLSTÄNDIGE ELIMINIERUNG VON KONSOLENFENSTERN (CREATE_NO_WINDOW):
  - Keine störenden schwarzen CMD- oder PowerShell-Fenster mehr beim Starten oder
    Aktualisieren der Anwendung.
  - Alle Hintergrundprozesse starten geräuschlos ohne Eingabeaufforderung.

* BROWSER-CACHE-BEREINIGUNG & TURBO-FLAGS:
  - Über 250 MB an alten Chrome-Profildaten, Telemetrie- und Speicher-Altlasten
    wurden bereinigt.
  - Start mit optimierten Browser-Flags ohne Hintergrundnetzwerk-Overhead.

* BARRIEREFREIER FOKUS & SCREENREADER-BEREITSCHAFT:
  - Automatischer Fokus auf das PIN-Eingabefeld beim Start sowie nach dem Schließen
    des Änderungsprotokolls.
  - Vollständige NVDA- und Tastatursteuerung ohne manuelles Mausklicken.

* REAKTIVIERTES ÄNDERUNGSPROTOKOLL:
  - Bei Updates wird das informative Hinweisfenster "Was ist neu in diesem Update?"
    wieder barrierefrei eingeblendet.
  - Nach Bestätigung (Enter oder Schließen) landet der Fokus sofort im PIN-Feld.

* RUST SEMVER-UPDATE-PRÜFUNG:
  - Intelligente semantische Versionsprüfung verhindert wiederholte Downloads
    bereits vorhandener Versionen.

`;

const protoInsertPoint = '--------------------------------------------------------------------------------\nVERSION 6.9.35';
const protoInsertPointCRLF = '--------------------------------------------------------------------------------\r\nVERSION 6.9.35';
if (proto.includes(protoInsertPointCRLF)) {
  proto = proto.replace(protoInsertPointCRLF, newProtoEntry.replace(/\n/g, '\r\n') + protoInsertPointCRLF);
} else if (proto.includes(protoInsertPoint)) {
  proto = proto.replace(protoInsertPoint, newProtoEntry + protoInsertPoint);
}
fs.writeFileSync(protoPath, proto, 'utf8');
console.log('✓ AENDERUNGSPROTOKOLL.txt updated');

// 6. Update CHANGELOG.md
const changelogPath = path.join(repoDir, 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

const newChangelogEntry = `## ⚡ 100% Rust-Desktop-Engine, Turbo-Start & Barrierefreie Vordergrund-Aktivierung (v6.9.68)
*Datum: 08. November 2026*

### ⚡ 1. 100% Native Rust-Desktop-Engine
- **Keine Python- oder C#-Abhängigkeiten:** Vollständiger Umstieg auf einen nativen Rust-Backend-Kern.
- **Ressourceneffizienz:** Deutlich reduzierter RAM-Bedarf und blitzschneller Start des lokalen Vault-Servers.
- **Sicherheits-Architektur:** Dual-Header-Token-Validierung (\`X-Vault-Token\` & \`X-Session-Token\`) schützt alle lokalen Tresor-Endpunkte.

### 🖥️ 2. Sofortige Fenster-Aktivierung im Vordergrund
- **Windows \`AllowSetForegroundWindow\`:** Native Win32-Integration stellt sicher, dass das Anwendungsfenster beim Starten direkt in den Vordergrund gehoben wird.
- **Kein Verstecken:** Die Anwendung bleibt nicht hinter anderen Programmfenstern verborgen.

### 🛑 3. Beseitigung aller schwarzen Konsolenfenster
- **\`CREATE_NO_WINDOW (0x08000000)\`:** Alle Hilfsprozesse und Server-Aufrufe werden ohne Erzeugung eines Konsolenfensters ausgeführt.
- **Nahtlose User Experience:** Kein störendes Flackern oder Aufpoppen von CMD-Eingabeaufforderungen.

### 🧹 4. Cache-Bereinigung & Performance-Startflags
- **250+ MB Profildaten bereinigt:** Bereinigung temporärer Chrome-Metrics- und Telemetriedateien.
- **Optimierte Start-Flags:** Deaktivierung von Hintergrund-Updates, Default-Browser-Checks und Sync für sofortige Bereitschaft.

### ⌨️ 5. Barrierefreiheit & Tastaturfokus
- **Autofokus auf PIN-Feld:** Unmittelbare Eingabebereitschaft für Tastatur- und Screenreader-Nutzer (NVDA).
- **Update-Modal reaktiviert:** Informiert den Nutzer bei neuen Updates transparent über Verbesserungen und übergibt den Fokus beim Schließen direkt an die PIN-Eingabe.

---

`;

const changelogInsertPoint = '## 💱 Multi-Währungs-System';
if (changelog.includes(changelogInsertPoint)) {
  changelog = changelog.replace(changelogInsertPoint, newChangelogEntry + changelogInsertPoint);
}
fs.writeFileSync(changelogPath, changelog, 'utf8');
console.log('✓ CHANGELOG.md updated');

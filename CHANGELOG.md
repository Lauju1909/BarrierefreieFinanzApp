# 📜 Offizielles Änderungsprotokoll (Changelog)
**Barrierefreie Finanz-App & Haushaltsbuch**

---

## 🔄 Version 6.0.1 (Aktuelles Update)
*Datum: 03. September 2026*

### 🔄 1. Umbuchungs-Daueraufträge & Sparpläne repariert (Reiter 4)
- **Fehlerbehebung Formularübermittlung:** Beim Anlegen von Sparplänen und Daueraufträgen unter *„Reiter 4: Umbuchen & Sparen“* (wöchentlich, monatlich, quartalsweise, halbjährlich, jährlich) blockierte zuvor ein verstecktes Pflichtfeld im Browser das Speichern.
- **Dynamische Pflichtfeldsteuerung:** Das Datumsfeld passt sich nun automatisch an und Daueraufträge werden verlässlich in den Sparplan-Bestand übernommen.

### 📋 2. Eigener Bereich „🔄 Umbuchungen & Sparpläne“ in der Übersicht (Reiter 1)
- **Eigene Karte & Gesamtsumme:** In Reiter 1 (Übersicht) gibt es ab sofort eine eigene Karte *„3c. 🔄 Umbuchungen, Sparpläne & Daueraufträge“* mit Ausführungssumme und Zähler.
- **Detaillierte Historie:** Listet alle durchgeführten Umbuchungen und Sparplan-Ausführungen mit Quell- und Zielkonto (z. B. *Von: Bankkonto ➔ An: Tagesgeldkonto*), Betrag, Datum und Notizen auf.
- **Vollständige Aktionen:** Jeder Eintrag hat die Schaltflächen `[✏️ Bearbeiten]` und `[🗑️ Löschen]`.

### 🔍 3. Super-Suche & Kontofilter
- Die intelligente Suche findet ab sofort auch alle Umbuchungen und Sparpläne.
- Beim Filtern nach einem bestimmten Konto werden alle Umbuchungen angezeigt, bei denen das Konto als Absender oder Empfänger beteiligt ist.

---

## 🌟 Version 6.0.0 (Meilenstein-Release)
*Datum: 03. September 2026*

Version 6.0.0 ist ein umfassendes Haupt-Release mit bahnbrechenden Neuerungen für Barrierefreiheit, Geschwindigkeit, Fehlervermeidung und finanzielle Übersicht.

### 🔍 1. Intelligente Super-Suche & Tippfehler-Toleranz (Fuzzy Matching)
- **Toleriert Tipp- und Schreibfehler:** Buchungen werden auch bei Tippfehlern zuverlässig gefunden (z. B. `amazn` -> *Amazon Prime*, `gehald` -> *Gehalt*, `baeker` -> *Bäckerei*).
- **Deutsche Phonetik- und Lautnormalisierung:** Vollständige bidirektionale Erkennung von Umlauten (`ä`/`ae`, `ö`/`oe`, `ü`/`ue`, `ß`/`ss`) sowie phonetischen Ausgleichen (`ck`/`k`, `ph`/`f`).
- **Betragsbereiche & Vergleichsoperatoren:** Filterung nach Spannen wie `20-50` oder `10..100`, Schätzwerten `~50` und Operatoren wie `>50`, `<100`, `>=25`.
- **Intelligente Datumserkennung:** Relative Tage (`heute`, `gestern`), Monatsnamen (`September`, `Sep`), Wochentage und Datumsformate (`03.09.`).
- **Begriffs-Ausschluss (Negation):** Wörter mit vorangestelltem Minuszeichen (`-`) werden ausgeschlossen (z. B. `Lebensmittel -Edeka`).
- **Barrierefreie Trefferanzeige:** Listen mit Treffern klappen für Screenreader (NVDA) **automatisch auf**; mit `Escape` oder dem Button `✖️ Suche leeren` schließen sie sich wieder.

### 💳 2. Raten- & Finanzierungsrechner ohne Doppeleingabe
- **Keine Doppeleingabe mehr:** Der Gesamtkaufpreis wird nur noch ein einziges Mal im Haupt-Betragsfeld eingetragen.
- **Live-Berechnung:** Die Monatsrate wird sofort beim Tippen der Kaufsumme und der Laufzeit live berechnet.
- **Aufgeräumte Ansicht:** Alle erweiterten Optionen (Anbieter wie Klarna/PayPal, Anzahlung, Zinsen %, Schlussrate/Restwert, Sondertilgungen, Ratenpause) befinden sich in einem einklappbaren Bereich.

### 🎯 3. Strikte & saubere Spartopf-Architektur
- **Zentral in den Konto-Optionen (Reiter 6):** Spartöpfe werden ausschließlich hier erstellt und verwaltet.
- **Kein ungebuchtes Freihand-Buchen:** Die Buttons *„Geld einzahlen“* und *„Geld entnehmen“* wurden entfernt. Geld wandert nun verbindlich und nachvollziehbar über das **Umbuchungs-Menü (Reiter 4)** in oder aus einem Spartopf mit vollständiger Transaktionshistorie.
- **Komfort-Knopf:** Jeder Spartopf besitzt einen Schnellwahl-Knopf `[🔄 Per Umbuchung besparen / entnehmen]`, der direkt in Reiter 4 wechselt und den Topf samt Konto auswählt.
- **Wunschliste (Reiter 7):** Beim Anlegen eines Wunsches wird aus den **bereits vorhandenen Spartöpfen** gewählt (Spartöpfe stehen im Dropdown ganz oben).
- **Automatisches Erfüllen:** Beim Klick auf *„Wunsch erfüllen“* wird das Geld automatisch aus dem hinterlegten Spartopf entnommen und die Ausgabe gebucht.

### 📅 4. Natürliche Datums- & Fälligkeitsbeschriftung
- **Bedarfsgerechte Bezeichnungen statt Standardphrasen:**
  - Einmalige Ausgaben: `📅 Datum der Ausgabe (Kaufdatum)`
  - Ratenzahlung: `💳 Kaufdatum & Beginn der Ratenzahlung`
  - Daueraufträge / Monatlich: `📅 Fälligkeitstag im Monat (1 bis 31)`
  - Geplante Ausgaben: `🎯 Geplantes Kaufdatum (Zukunft)`
- **Schnelltasten für NVDA & Mausklick:**
  - `[Heute]` und `[Gestern]` für sofortige Datumsauswahl.
  - `[1.]`, `[15.]` und `[Monatsende]` für Fälligkeitstage von Daueraufträgen.

### 🧹 5. Bereinigte Menüs & Einstellungen (Reiter 5)
- Die doppelten Listen für *„Daueraufträge, Abos & Sparpläne“* und *„Laufende Ratenkäufe & Kredite“* wurden aus den Einstellungen entfernt, da sie zentral in der Übersicht und der Wunschliste geführt werden.

### 🛡️ 6. Sperrbildschirm-Stabilität & Sicherheit
- Funktion zur Klartext-Anzeige der PIN (`togglePinVisibility`) mit NVDA-Ansage vollständig implementiert.
- Funktion zum Zurücksetzen des Tresors bei vergessener PIN (`resetVaultSetup`) mit doppelter Sicherheitsabfrage angebunden.

### ✅ 7. Pre-Release-Audit & Qualitätssicherung
- 0 doppelte IDs in HTML.
- 0 doppelte JavaScript-Funktionen oder Top-Level-Variablen.
- 0 doppelte Kategorien oder Select-Optionen.
- Alle 74 HTML-Event-Handler lückenlos verifiziert und mit automatisierten Tests bestätigt.

---

## 🌟 Version 5.3.5.3
- Perfektionierte Umbuchungen & Sparplan-Intervalle.
- Eigene Kategorien für alle Bereiche (Ausgaben, Einnahmen, Umbuchungen).
- Dedizierter Haupt-Reiter 6 (Konto-Optionen).
- Monats-Budgets & Ausgaben-Limits in Reiter 5.
- CSV-Import & PDF-Druckberichte.

---

## 🌟 Version 5.3.5.2
- Einnahmen & Ausgaben Synchronisation.
- Dedizierter Kontenreiter mit 9 Kontotypen.

---

## 🌟 Version 5.3.5.1
- Kategorien-Hotfix & Stabilität für 23 Ausgaben- und 9 Einnahmen-Kategorien.

# 📜 Offizielles Änderungsprotokoll (Changelog)
**Barrierefreie Finanz-App & Haushaltsbuch**

## ⚡ Version 6.5.0 (Auto-Deckungskonto wie PayPal, Bargeld-Zählhelfer & Kontodetails)
*Datum: 01. Oktober 2026*

### 🛡️ 1. Automatisches Deckungskonto (wie bei PayPal)
- **Automatischer Ausgleich:** Bei jedem Konto (z. B. PayPal) kann ein Deckungskonto (z. B. Girokonto) hinterlegt werden.
- **Nur bei Unterdeckung:** Reicht das Guthaben auf dem Primärkonto aus, bleibt das Deckungskonto unberührt. Nur wenn das Geld nicht reicht, gleicht eine automatische Deckungs-Umbuchung exakt den Fehlbetrag aus.
- **Intelligente Liquiditätsprüfung:** Anstehende Zahlungen und Daueraufträge auf dem Primärkonto belasten das Deckungskonto in der Monatsvorschau nur dann, wenn das Primärkonto tatsächlich unterdeckt ist.

### 🪙 2. Bargeld-Zählhelfer (Münz- & Scheinezähler)
- **Stressfreies Zählen ohne Kopfrechnen:** Plus- und Minus-Tasten UND direkte Tastatureingabefelder für alle Euro-Scheine (200 €, 100 €, 50 €, 20 €, 10 €, 5 €) und Münzen (2 €, 1 €, 50ct, 20ct, 10ct, 5ct, 2ct, 1ct).
- **Live-Berechnung & 1-Klick-Übernahme:** Ermittelt sekundenschnell Zwischensummen und den Gesamtbetrag im Portemonnaie und übernimmt ihn direkt in das Bargeldkonto oder das Startguthaben.

### ℹ️ 3. Bankdaten & Erweiterte Kontoinformationen
- **Strukturierte Erfassung:** Optional können Bankname, IBAN mit automatischer 4er-Block-Formatierung, BIC, Kontoinhaber, Kundennummer/Login-Mail, Dispolimit und Notizen hinterlegt werden.
- **Barrierefreie Anzeige:** Übersichtliche Darstellung mit aufklappbaren Details im Reiter „Konten“.

### 💰 4. Startguthaben-Verwaltung & Live-Kontostand
- **Flexibles Startguthaben:** Sowohl bei der Neuerstellung als auch beim Bearbeiten bestehender Konten anpassbar.
- **Transparenter Kontostand:** Zeigt beim Bearbeiten den aktuellen berechneten Saldo mit Schnellabgleich an.

---

## ⚡ Version 6.4.0 (Vertrags-Manager, Probe-Abos, Preiserhöhungen & Historien-Schutz)
*Datum: 29. September 2026*

### 🎁 1. Kostenlose Testphasen & Probe-Abos (Tage, Wochen & Monate)
- **Flexible Testphasen:** Bei jedem Dauerauftrag kann ein kostenloser Testzeitraum hinterlegt werden – wählbar nach Tagen (z. B. 7, 14, 30 Tage), Wochen oder Monaten.
- **Null Euro Belastung:** Während der Testphase wird das Konto mit 0,00 € belastet.
- **Kündigungs-Wecker:** Rechtzeitig vor dem ersten Zahltag warnt die App mit NVDA und in der Übersicht, damit keine unerwünschten Kosten entstehen.

### 📈 2. Zukünftige Preisänderung mit Historien-Garantie
- **Preiserhöhungen vormerken:** Neue Beträge können ab einem frei gewählten Zukunftsmonat hinterlegt werden.
- **Voller Vergangenheits-Schutz:** Alle Monate vor dem Stichtag behalten exakt den ursprünglichen Preis in allen Statistiken.

### 🏷️ 3. Kombi-Verträge & Rabatt-Phasen
- **Einstiegspreise festlegen:** Z. B. 12 Monate für 19,99 €, danach regulär 39,99 €. Die App stellt nach Ablauf der Rabatt-Dauer automatisch auf den Normalpreis um und erinnert an den Tarifwechsel.

### ⏸️ 4. Sommerpause & Dauerauftrag pausieren
- **Aussetzen ohne Löschen:** Daueraufträge können für 1, 2, 3 oder mehr Monate pausiert werden und laufen danach automatisch wieder regulär an.

### 🛡️ 5. Dauerauftrag beenden mit Historien-Schutz
- **Alte Monate bleiben sicher:** Beim Klick auf Beenden / Löschen kann gewählt werden: *„Ab jetzt beenden (Vergangenheit behalten)“* oder *„Komplett löschen“*. Bei Option 1 bleiben alle alten Monate zu 100% erhalten.

### 📝 6. Vertrags- & Kündigungsdetails
- **Sicher im Tresor:** Kundennummer, Mindestlaufzeit, Kündigungsfrist, Hotline und Notizen können direkt am Dauerauftrag hinterlegt werden.

### ⚠️ 7. Kontodeckungs- & Vertrags-Erinnerungen
- **Übersichts-Warnungen:** Automatische Hinweise bei drohender Unterdeckung durch anstehende Daueraufträge sowie Kündigungsfristen direkt in Reiter 1.

---

## ⚡ Version 6.3.0 (Dauerauftrag Startmonat & Split-Zahlung bei Ausgaben)
*Datum: 29. September 2026*

### 📅 1. Startmonat-Auswahl für Daueraufträge & Sparpläne
- **Freie Startmonat-Wahl:** Beim Erstellen und Bearbeiten von Daueraufträgen (Ausgaben, Einnahmen, Umbuchungen) kann nun der Startmonat und das Startjahr (`startMonth` / `startYear`) individuell festgelegt werden.
- **Schnelltasten für Screenreader:** Zusätzliche Schnellschaltflächen `[Diesen Monat]` und `[Nächsten Monat]` erlauben die blitzschnelle Belegung mit Tastatur und Screenreader.
- **Keine rückwirkende Fälligkeit:** Alle Übersichts- und Saldenberechnungen berücksichtigen den Startmonat strikt. Daueraufträge, die z. B. ab November gelten, belasten Vormonate wie September oder Oktober nicht mehr.
- **Nachträgliches Anpassen:** Im Bearbeiten-Dialog (`Dauerauftrag bearbeiten`) kann der Startmonat jederzeit nachträglich geändert werden.

### 💳 2. Optionale Split-Zahlung bei Ausgaben
- **Ausgaben auf mehrere Konten aufteilen:** Unter dem Konto-Auswahlfeld in Reiter 2 gibt es nun eine Checkbox `[ ] Ausgabe auf mehrere Konten aufteilen (Split-Zahlung)`.
- **Vollkommen optional:** Wer wie gewohnt von einem einzelnen Konto zahlen möchte, lässt das Kontrollkästchen einfach deaktiviert.
- **Intelligente Restbetragsberechnung:** Bei 2 Konten (z. B. Girokonto + Bargeld) berechnet die App den zweiten Teilbetrag automatisch mit, sobald der erste eingegeben wird.
- **Dynamische Zeilen & Validierung:** Es können beliebig viele Konten hinzugefügt werden. Die App prüft in Echtzeit, ob die Summe der Teilbeträge exakt dem Gesamtausgabebetrag entspricht und ob das gewählte Konto ausreichend gedeckt ist.
- **Separate Buchungen im Tresor:** Jeder Teilbetrag wird mit eigener `splitId` sauber auf dem jeweiligen Konto verbucht, sodass alle Kontosalden exakt stimmen.

---

## ⚡ Version 6.2.1 (Fehlerbereinigung & Permanente Desktop-Kopplung)
*Datum: 13. September 2026*

### 💻 1. Permanente Smartphone-Kopplung & 1-Klick-Abgleich auf dem PC
- **Gekoppeltes Smartphone dauerhaft merken:** Wurde der PC einmal erfolgreich mit dem Smartphone synchronisiert, merkt sich die App Gerätename und Kopplungscode.
- **Neue 1-Klick-Kopplungskarte:** In Reiter 8 (Smartphone-Sync) auf dem PC wird eine übersichtliche Karte mit dem Namen des verbundenen Smartphones, dem letzten Abgleichsdatum und dem Button `[⚡ 1-Klick-Abgleich]` angezeigt.
- **Fehlerbehebung Benutzeroberfläche:** Fehlende Kopplungskarten-Elemente im HTML wurden ergänzt und vollständig an Screenreader (NVDA) angebunden.

### 🛡️ 2. Fehlerbereinigung & Versionskonsistenz
- **Dynamische Versionen:** In allen Feedback-Meldungen und Kategorie-Vorschlägen wird nun stets die korrekte, aktuelle Versionsnummer (`v6.2.1`) übertragen statt veralteter Vorgängerversionen.
- **Stand-alone-Build synchronisiert:** Alle Skripte und Stile wurden in die portable Standalone-App `Haushaltsbuch_App.html` und `Haushaltsbuch.exe` eingebunden.

---

## 📲 Version 6.2.0 (Magischer Sync-Link, E-Mail-Übertragung & Biometrie-Härtung)
*Datum: 12. September 2026*

### 🔗 1. Magischer Sync-Link & E-Mail-Übertragung
- **1-Klick-Kopplung:** Generiere einen magischen Kopplungs-Link (`haushaltsbuch://sync?...`) und versende ihn direkt per E-Mail an dich selbst oder kopiere ihn in die Zwischenablage.
- **Automatischer Intent-Filter (Android):** Ein Klick auf den Link im E-Mail-Programm auf dem Smartphone öffnet die App und trägt die Verbindungsdaten automatisch ein.

### 👆 2. Nativer Android Fingerabdruck-Dialog (BiometricPrompt) & Sensor-Test
- **Nativer BiometricPrompt:** Volle Unterstützung der AndroidX-Biometrie mit modernem System-Dialog.
- **Abbruch-Schutz & Sensor-Test:** Robuster Schnelltest in den Einstellungen (Reiter 5) zur Prüfung der Fingerabdruck-Erkennung mit klarer NVDA-/TalkBack-Sprachmeldung.

---

## ⚡ Version 6.1.0 (Ende-zu-Ende verschlüsselte Live-Synchronisation)
*Datum: 12. September 2026*

### 🔒 1. E2EE Echtzeit-Synchronisation zwischen PC und Smartphone
- **100% Ende-zu-Ende-Verschlüsselung (AES-256-GCM):** Alle Daten werden vor dem Absenden auf dem Gerät verschlüsselt. Der Übertragungs-Broker sieht ausschließlich verschlüsseltes Rauschen.
- **Reiter 8 (Smartphone-Sync):** Dedizierter Bereich mit barrierefreier Buchstabier- und Kopierfunktion für Gerätename und Kopplungscode.

---

## 🛡️ Version 6.0.2 (Sicherheits-Härtung & Update-Schutz)
*Datum: 07. September 2026*

### 🔒 1. Kryptografischer Token-Schutz für lokalen Server (CSRF-Schutz)
- **Hintergrund-Server geschützt:** Der integrierte lokale TCP-Server (Port 48123) fordert ab sofort für alle Anfragen (`/api/get_vault`, `/api/save_vault`, `/api/reset_vault`, `/api/heartbeat`) einen dynamischen, geheimen Sitzungsschlüssel (`X-Vault-Token`).
- **Schutz vor Webseiten:** Fremde Webseiten oder andere Anwendungen im Browser können nicht mehr unbefugt auf den Tresor zugreifen oder Daten verändern.
- **CORS-Einschränkung:** Streng auf die eigene lokale App beschränkt.

### 💾 2. Automatischer Schutz vor Datenverlust (Rollierende Backups)
- **Automatischer Backup-Ordner:** Es wurde der Unterordner `Tresor_Sicherheitskopien` eingerichtet.
- **Rotierende Sicherung:** Vor jedem Speichervorgang und vor jedem Programm-Update wird eine zeitgestempelte Kopie (`vault_DATUM_ZEIT.bak`) gesichert.
- **5-fache Historie:** Bis zu 5 historische Speicherstände bleiben gesichert, sodass niemals Daten verloren gehen können.

### 🛡️ 3. Garantierte Update-Sicherheit & Abwärtskompatibilität
- **Keine neuen Funktionen oder veränderten Menüs:** Der gewohnte Bedienablauf mit dem NVDA-Screenreader bleibt zu 100 % unverändert.
- **Volle Tresor-Kompatibilität:** Bestehende Tresore (`Haushaltsbuch_Daten.vault`) und Passwörter/PINs funktionieren nach dem Update ohne jegliche Unterbrechung weiter.

---

## 🔄 Version 6.0.1
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

# 🚀 Vorbereitung für das Release: Haushaltsbuch v5.1.0 & Feedback-Zentrale

Dieses Dokument fasst alle Neuerungen, den genauen Testplan für morgen und die anschließenden Veröffentlichungsschritte für GitHub zusammen.

> [!IMPORTANT]
> **Aktueller Status:** Es wurde **nichts** auf GitHub hochgeladen oder veröffentlicht. Alle Dateien befinden sich lokal in deinem Ordner `C:\Users\lauri\.gemini\antigravity\scratch\BarrierefreieFinanzApp` und sind für deine morgigen Tests vorbereitet.

---

## 📋 Übersicht aller Neuerungen in Version 5.1.0

### 1. 📜 Automatisches Änderungsprotokoll („Was ist neu?“)
* **Vor der PIN-Eingabe:** Beim ersten Start nach einem Update öffnet sich automatisch das barrierefreie Änderungsprotokoll.
* **Tastatur-Fokus:** Mit `Enter` oder `Escape` schließt sich das Fenster und springt sofort in das PIN-Eingabefeld.
* **Abschaltbar:** Kann direkt im Popup oder in **Tab 5 (Einstellungen)** dauerhaft deaktiviert oder erneut aufgerufen werden.

### 2. 💾 100% Robuste Speicherstand-Garantie
* **Sofortige Tresor-Erkennung:** Bestehende Tresore (`Haushaltsbuch_Daten.vault`) werden beim App-Start sofort ohne Verzögerung erkannt.
* **Volle Abwärtskompatibilität:** Ältere Speicherstände von GitHub (v4.9.0 / v5.0.0) werden zu 100% verlustfrei geöffnet.
* **AES-256 Verschlüsselung:** Alle Finanzdaten bleiben ausschließlich lokal auf deinem PC geschützt.

### 3. 📬 Völlig neues Feedback-System (Ohne Konto & ohne Anmeldung)
* **In der Haupt-App:** Nutzer schreiben in Tab 5 ihr Feedback und klicken auf `🚀 Sofort absenden`. Die Nachricht wird sofort live übertragen und zusätzlich in `Feedback_Archiv.txt` gesichert.
* **Eigene Begleit-App (`Feedback_Zentrale.exe`):**
  * Empfängt alle Vorschläge & Nachrichten live in Echtzeit.
  * Jede Nachricht kann mit `🗑️ Nachricht löschen` einzeln oder über `🗑️ Alle löschen` komplett entfernt werden.
  * Enthält Buttons für `📋 Text kopieren` und Hell-/Dunkel-Design.

### 4. 📅 Erweiterte Intervalle & Schnell-Suche
* **Neue Intervalle:** Unterstützung für **vierteljährliche** (alle 3 Monate) und **halbjährliche** (alle 6 Monate) Daueraufträge und Sparpläne.
* **Kategorie-Suche:** Live-Filterung beim Tippen beim Eintragen von Einnahmen und Ausgaben.

---

## 🧪 Dein Testplan für morgen (Schritt für Schritt)

| Schritt | Was wird getestet? | So führst du den Test durch: | Erwartetes Ergebnis |
| :--- | :--- | :--- | :--- |
| **Test 1** | **Änderungsprotokoll** | Starte `Haushaltsbuch.exe`. | Fenster *„Was ist neu in diesem Update?“* öffnet sich vor der PIN. Nach Klick auf *„Schließen“* ist der Fokus im PIN-Feld. |
| **Test 2** | **Speicherstand & PIN** | Gib deine PIN ein und trage eine Test-Buchung ein. Schließe die App und öffne sie erneut. | App zeigt direkt *„Sicherer AES-256 Zugang“*, nach PIN-Eingabe ist deine Buchung noch da. |
| **Test 3** | **Feedback absenden** | Gehe in Tab 5 (Einstellungen), schreibe einen kurzen Text in das Feedback-Feld und klicke auf `🚀 Sofort absenden`. | Grüne Erfolgsmeldung erscheint, Textfeld leert sich. |
| **Test 4** | **Feedback-Zentrale** | Starte `Feedback_Zentrale.exe`. | Deine soeben abgesendete Nachricht steht oben in der Liste mit Datum und Uhrzeit. |
| **Test 5** | **Nachricht löschen** | Klicke in `Feedback_Zentrale.exe` unter der Nachricht auf `🗑️ Nachricht löschen`. | Nachricht verschwindet sofort und taucht auch nach Klick auf `🔄 Aktualisieren` nicht mehr auf. |
| **Test 6** | **Changelog-Einstellung** | Gehe in `Haushaltsbuch.exe` in Tab 5 zu *„📜 Änderungsprotokoll & Update-Hinweise“*. | Über den Schalter lässt sich das automatische Popup nach Belieben an- oder ausschalten. |

---

## 🌐 Veröffentlichungsschritte für morgen (Erst nach deinem OK!)

Sobald du morgen alle Tests abgeschlossen hast und zufrieden bist, führen wir gemeinsam folgende Schritte durch:

1. **GitHub-Repository aktualisieren:**
   * Hochladen der neuen Version `v5.1.0` mit `Haushaltsbuch.exe`, `Feedback_Zentrale.exe`, `Haushaltsbuch_App.html`, `index.html`, `style.css` und `app.js`.
2. **`version.json` aktualisieren:**
   * Setzen der Versionsnummer auf `5.1.0`, damit der Auto-Updater bestehende Installationen automatisch aktualisiert.
3. **GitHub Release erstellen:**
   * Erstellen des offiziellen Release-Tags `v5.1.0` mit Changelog und Download-Dateien für andere Nutzer.

---

### 📂 Deine fertigen Dateien im Ordner:
* 💶 `Haushaltsbuch.exe` *(Haupt-App mit Änderungsprotokoll & Speichergarantie)*
* 📬 `Feedback_Zentrale.exe` *(Posteingang mit Lösch-Funktion)*
* 🌐 `Haushaltsbuch_App.html` *(Kompakte Standalone-Web-Version)*

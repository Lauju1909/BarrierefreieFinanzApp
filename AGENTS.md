# 🤖 Hinweise für KI-Agenten (AI Agents Guide)

## ⚡ Automatisiertes Build-, Auto-Versioning- und Release-System
- **Automatische Versionserhöhung:** Die Versionsnummer in `version.json` wird bei jedem Push auf den Branch `main` **vollautomatisch durch GitHub Actions erhöht** (z. B. `6.9.6` -> `6.9.7`).
- **Automatischer Multi-Plattform Build (Windows & Linux):**
  - **Windows:** GitHub Actions baut auf `windows-latest` automatisch:
    - `Haushaltsbuch.exe` (über `build_release.js` / `csc.exe`)
    - `Kategorie_Zentrale.exe` & `Feedback_Zentrale.exe`
    - `Haushaltsbuch_App.html` (Single-File Offline-App)
  - **Linux:** GitHub Actions kompiliert auf `ubuntu-latest` automatisch ein natives Linux-Binary:
    - `Haushaltsbuch-Linux` (über PyInstaller aus `launcher_linux.py`)
- **Automatisches GitHub-Release:** Für jeden Stand wird automatisch ein GitHub-Release erstellt und alle Windows- und Linux-Dateien als Download angehängt.
- **Saubere Trennung der Auto-Updater:**
  - Der Windows-Updater (`Program.cs`) aktualisiert die lokale `Haushaltsbuch_App.html` und Windows-Dateien.
  - Auf Linux startet `Haushaltsbuch-Linux` autark und greift direkt auf die barrierefreie App zu, ohne Konflikte mit Windows-Pfaden.

## 📌 Was KI-Agenten beachten MÜSSEN:
1. **Keine manuellen Releases oder Versionsnummern-Änderungen erzwingen:** Features und Bugfixes normal committen. Nach dem Push auf `main` übernimmt GitHub Actions das Hochzählen der Patch-Version, das Taggen und das Veröffentlichen des Releases vollautomatisch.
2. **Barrierefreiheit (WCAG 2.2 AAA & NVDA / JAWS / Orca / TalkBack):** Alle Komponenten müssen 100% barrierefrei bleiben (Screenreader-Fokus, ARIA-Live-Regionen, Farbkontraste).

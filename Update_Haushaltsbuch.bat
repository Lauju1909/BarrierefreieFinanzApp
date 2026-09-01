@echo off
chcp 65001 >nul
title Haushaltsbuch Auto-Updater
cls
echo ========================================================
echo        HAUSHALTSBUCH GITHUB AUTO-UPDATER
echo ========================================================
echo.
echo [1/3] Pruefe auf Aktualisierungen von GitHub...
echo.

set "REPO_URL=https://raw.githubusercontent.com/Lauju1909/BarrierefreieFinanzApp/main"

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri '%REPO_URL%/Haushaltsbuch_App.html' -OutFile 'Haushaltsbuch_App.html.tmp' -UseBasicParsing; Move-Item -Force 'Haushaltsbuch_App.html.tmp' 'Haushaltsbuch_App.html'; Write-Host '[2/3] Neueste Haushaltsbuch_App.html erfolgreich heruntergeladen!' -ForegroundColor Green } catch { Write-Host 'Fehler beim Herunterladen der App-Dateien: ' $_.Exception.Message -ForegroundColor Red; exit 1 }"

if errorlevel 1 (
    echo.
    echo Update fehlgeschlagen. Bitte Internetverbindung pruefen.
    pause
    exit /b 1
)

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri '%REPO_URL%/version.json' -OutFile 'version.json.tmp' -UseBasicParsing; Move-Item -Force 'version.json.tmp' 'version.json'; Write-Host '[3/3] Versionsinformationen aktualisiert!' -ForegroundColor Green } catch { Write-Host 'Hinweis: version.json konnte nicht aktualisiert werden.' -ForegroundColor Yellow }"

echo.
echo ========================================================
echo   ERFOLG: Dein Haushaltsbuch ist jetzt auf dem neuesten Stand!
echo   Deine verschluesselten Finanzdaten blieben 100%% erhalten!
echo ========================================================
echo.
timeout /t 3 >nul
start "" "Haushaltsbuch.exe"
exit /b 0

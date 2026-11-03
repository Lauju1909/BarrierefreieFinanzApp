$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot"
Set-Location "C:\Users\lauri\.gemini\antigravity\scratch\BarrierefreieFinanzApp_Android\android"
.\gradlew.bat --stop
Start-Sleep -Seconds 1
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Remove-Item -Recurse -Force "app\build\intermediates\incremental\packageDebug" -ErrorAction SilentlyContinue
.\gradlew.bat assembleDebug

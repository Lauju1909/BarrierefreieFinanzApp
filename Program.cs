using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace HaushaltsbuchApp
{
    static class Program
    {
        private const string GITHUB_RAW_BASE = "https://raw.githubusercontent.com/Lauju1909/BarrierefreieFinanzApp/main";
        private const string VERSION_URL = GITHUB_RAW_BASE + "/version.json";
        private const string APP_HTML_URL = GITHUB_RAW_BASE + "/Haushaltsbuch_App.html";

        [STAThread]
        static void Main()
        {
            try
            {
                // TLS 1.2 & TLS 1.3 fuer alle Windows Versionen
                try
                {
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288 | SecurityProtocolType.Tls12;
                }
                catch { }

                // 1. ZENTRALER, FESTE SPEICHERORT IM WINDOWS APPDATA (DATEN GEHEN AUF KEINEM PC VERLOREN!)
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string centralAppDir = Path.Combine(localAppData, "HaushaltsbuchApp");
                string centralProfileDir = Path.Combine(centralAppDir, "Profile");
                string centralHtmlPath = Path.Combine(centralAppDir, "Haushaltsbuch_App.html");
                string centralVersionPath = Path.Combine(centralAppDir, "version.json");

                if (!Directory.Exists(centralAppDir)) Directory.CreateDirectory(centralAppDir);
                if (!Directory.Exists(centralProfileDir)) Directory.CreateDirectory(centralProfileDir);

                // 2. Falls zentrales HTML noch nicht existiert, aus eingebetteter Ressource entpacken
                if (!File.Exists(centralHtmlPath))
                {
                    UnpackEmbeddedApp(centralHtmlPath);
                }

                // 3. Im Hintergrund auf GitHub nach Updates pruefen (ohne Blockieren bei Offline)
                CheckAndApplyUpdate(centralHtmlPath, centralVersionPath);

                if (!File.Exists(centralHtmlPath))
                {
                    MessageBox.Show("Die App-Datei konnte nicht geladen werden!\nPfad: " + centralHtmlPath, "Haushaltsbuch Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 4. Universeller Windows Browser-Starter (Edge, Chrome, Brave oder Standard)
                string browserPath = FindBestBrowserPath();
                string fileUri = "file:///" + centralHtmlPath.Replace('\\', '/');

                if (!string.IsNullOrEmpty(browserPath) && File.Exists(browserPath))
                {
                    string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", fileUri, centralProfileDir);
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = browserPath,
                        Arguments = args,
                        UseShellExecute = false
                    });
                }
                else
                {
                    // Fallback fuer jeden Windows-Rechner: Oeffnen im Standard-Browser
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = centralHtmlPath,
                        UseShellExecute = true
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Fehler beim Starten des Haushaltsbuchs: " + ex.Message, "Haushaltsbuch", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static string FindBestBrowserPath()
        {
            string[] candidatePaths = new string[]
            {
                // 1. Microsoft Edge (Standard auf Windows 10 & 11)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),

                // 2. Google Chrome (Sehr haeufig auf Windows 7, 8, 10, 11)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),

                // 3. Brave Browser
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"BraveSoftware\Brave-Browser\Application\brave.exe")
            };

            foreach (string path in candidatePaths)
            {
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                {
                    return path;
                }
            }

            return null;
        }

        private static void UnpackEmbeddedApp(string targetHtml)
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                string resourceName = "embedded_app.html";
                
                foreach (string name in asm.GetManifestResourceNames())
                {
                    if (name.EndsWith("embedded_app.html", StringComparison.OrdinalIgnoreCase))
                    {
                        resourceName = name;
                        break;
                    }
                }

                using (Stream stream = asm.GetManifestResourceStream(resourceName))
                {
                    if (stream != null)
                    {
                        using (FileStream fs = new FileStream(targetHtml, FileMode.Create, FileAccess.Write))
                        {
                            stream.CopyTo(fs);
                        }
                    }
                }
            }
            catch
            {
                // Fallback
            }
        }

        private static void CheckAndApplyUpdate(string targetHtml, string localVersionFile)
        {
            try
            {
                string localVer = "1.0.0";
                if (File.Exists(localVersionFile))
                {
                    string localContent = File.ReadAllText(localVersionFile);
                    Match m = Regex.Match(localContent, "\"version\"\\s*:\\s*\"([^\"]+)\"");
                    if (m.Success) localVer = m.Groups[1].Value;
                }

                using (var client = new TimeoutWebClient(2500))
                {
                    client.Headers.Add("User-Agent", "Haushaltsbuch-AutoUpdater");
                    string remoteVerJson = client.DownloadString(VERSION_URL);
                    Match rm = Regex.Match(remoteVerJson, "\"version\"\\s*:\\s*\"([^\"]+)\"");
                    
                    if (rm.Success)
                    {
                        string remoteVer = rm.Groups[1].Value;
                        if (IsNewerVersion(remoteVer, localVer) || !File.Exists(targetHtml))
                        {
                            string tmpHtml = targetHtml + ".tmp";
                            client.DownloadFile(APP_HTML_URL, tmpHtml);
                            if (File.Exists(tmpHtml) && new FileInfo(tmpHtml).Length > 1000)
                            {
                                File.Copy(tmpHtml, targetHtml, true);
                                File.Delete(tmpHtml);
                                File.WriteAllText(localVersionFile, remoteVerJson);
                            }
                        }
                    }
                }
            }
            catch
            {
                // Offline fallback
            }
        }

        private static bool IsNewerVersion(string remote, string local)
        {
            try
            {
                Version r = new Version(remote.Trim('v', 'V'));
                Version l = new Version(local.Trim('v', 'V'));
                return r > l;
            }
            catch
            {
                return !string.Equals(remote, local, StringComparison.OrdinalIgnoreCase);
            }
        }
    }

    public class TimeoutWebClient : WebClient
    {
        private readonly int _timeoutMs;

        public TimeoutWebClient(int timeoutMs)
        {
            _timeoutMs = timeoutMs;
        }

        protected override WebRequest GetWebRequest(Uri uri)
        {
            WebRequest w = base.GetWebRequest(uri);
            w.Timeout = _timeoutMs;
            return w;
        }
    }
}

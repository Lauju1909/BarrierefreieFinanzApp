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
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;

                // 1. ZENTRALER, FESTE SPEICHERORT IM APPDATA (DATEN GEHEN NIE VERLOREN!)
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

                // 3. Im Hintergrund auf GitHub nach Updates prüfen (ersetzt nur HTML, Profil bleibt 100% erhalten!)
                CheckAndApplyUpdate(centralHtmlPath, centralVersionPath);

                if (!File.Exists(centralHtmlPath))
                {
                    MessageBox.Show("Die App-Datei konnte nicht geladen werden!\nPfad: " + centralHtmlPath, "Haushaltsbuch Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 4. Edge im App-Modus mit FESTEM User-Data-Dir starten
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
                }

                string fileUri = "file:///" + centralHtmlPath.Replace('\\', '/');

                if (File.Exists(edgePath))
                {
                    string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", fileUri, centralProfileDir);
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = args,
                        UseShellExecute = false
                    });
                }
                else
                {
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

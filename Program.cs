using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
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
                try
                {
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288 | SecurityProtocolType.Tls12;
                }
                catch { }

                // 1. ZENTRALER SPEICHERORT IM WINDOWS APPDATA
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string localHtmlInBaseDir = Path.Combine(baseDir, "Haushaltsbuch_App.html");

                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                if (string.IsNullOrEmpty(localAppData)) localAppData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                if (string.IsNullOrEmpty(localAppData)) localAppData = baseDir;

                string centralAppDir = Path.Combine(localAppData, "HaushaltsbuchApp");
                string centralProfileDir = Path.Combine(centralAppDir, "Profile");
                string centralHtmlPath = Path.Combine(centralAppDir, "Haushaltsbuch_App.html");
                string centralVersionPath = Path.Combine(centralAppDir, "version.json");
                string centralVaultPath = Path.Combine(centralAppDir, "database.vault");

                try
                {
                    if (!Directory.Exists(centralAppDir)) Directory.CreateDirectory(centralAppDir);
                    if (!Directory.Exists(centralProfileDir)) Directory.CreateDirectory(centralProfileDir);
                }
                catch { }

                // 2. ENTPACKEN ODER SYNCHRONISIEREN
                if (!File.Exists(centralHtmlPath))
                {
                    UnpackEmbeddedApp(centralHtmlPath);
                }

                if (File.Exists(localHtmlInBaseDir) && !File.Exists(centralHtmlPath))
                {
                    try { File.Copy(localHtmlInBaseDir, centralHtmlPath, true); } catch { }
                }

                // 3. BACKGROUND UPDATE CHECK
                CheckAndApplyUpdate(centralHtmlPath, centralVersionPath);

                string targetHtml = File.Exists(centralHtmlPath) ? centralHtmlPath : localHtmlInBaseDir;
                if (!File.Exists(targetHtml))
                {
                    UnpackEmbeddedApp(targetHtml);
                }

                if (!File.Exists(targetHtml))
                {
                    MessageBox.Show("Die App konnte nicht initialisiert werden!", "Haushaltsbuch Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 4. AUTOMATISCHE DATENRETTUNG: Suche nach vorhandenen Daten aus frueheren Versionen
                RecoverOldVaultIfMissing(centralVaultPath, localAppData);

                // 5. CROSS-BROWSER INJEKTION: Falls database.vault existiert, in HTML einbinden
                if (File.Exists(centralVaultPath))
                {
                    try
                    {
                        string vaultJson = File.ReadAllText(centralVaultPath);
                        if (!string.IsNullOrEmpty(vaultJson) && vaultJson.Contains("salt"))
                        {
                            string htmlContent = File.ReadAllText(targetHtml);
                            string injection = "<script>window.__INITIAL_VAULT__ = " + vaultJson + ";</script>";
                            if (!htmlContent.Contains("window.__INITIAL_VAULT__"))
                            {
                                htmlContent = htmlContent.Replace("<body", injection + "\n<body");
                                File.WriteAllText(targetHtml, htmlContent);
                            }
                        }
                    }
                    catch { }
                }

                // 6. BROWSER STARTEN: 1. CHROME -> 2. FIREFOX -> 3. EDGE -> 4. BRAVE -> 5. FALLBACK
                LaunchBestBrowser(targetHtml, centralProfileDir);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Fehler beim Starten des Haushaltsbuchs: " + ex.Message, "Haushaltsbuch", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void RecoverOldVaultIfMissing(string targetVaultPath, string localAppData)
        {
            try
            {
                if (File.Exists(targetVaultPath) && new FileInfo(targetVaultPath).Length > 20)
                {
                    return; // Bereits vorhanden
                }

                // Suche nach bisherigen LevelDB-Ordnern in Edge, Chrome, Brave und AppProfile
                string[] searchDirs = new string[]
                {
                    Path.Combine(localAppData, @"Google\Chrome\User Data\Default\Local Storage\leveldb"),
                    Path.Combine(localAppData, @"Microsoft\Edge\User Data\Default\Local Storage\leveldb"),
                    Path.Combine(localAppData, @"HaushaltsbuchApp\Profile\Default\Local Storage\leveldb"),
                    Path.Combine(localAppData, @"BraveSoftware\Brave-Browser\User Data\Default\Local Storage\leveldb")
                };

                foreach (string dir in searchDirs)
                {
                    if (Directory.Exists(dir))
                    {
                        string foundJson = ScanLevelDbFolder(dir);
                        if (!string.IsNullOrEmpty(foundJson))
                        {
                            File.WriteAllText(targetVaultPath, foundJson);
                            return;
                        }
                    }
                }
            }
            catch { }
        }

        private static string ScanLevelDbFolder(string dir)
        {
            try
            {
                string bestSalt = null;
                string bestVault = null;

                string[] files = Directory.GetFiles(dir, "*.*");
                foreach (string file in files)
                {
                    if (file.EndsWith(".ldb", StringComparison.OrdinalIgnoreCase) || file.EndsWith(".log", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            byte[] bytes;
                            using (var fs = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                using (var ms = new MemoryStream())
                                {
                                    fs.CopyTo(ms);
                                    bytes = ms.ToArray();
                                }
                            }

                            string ascii = Encoding.ASCII.GetString(bytes);

                            if (ascii.Contains("barrierefreie_finanzen_salt_v1"))
                            {
                                Match mSalt = Regex.Match(ascii, @"barrierefreie_finanzen_salt_v1[^\w\d+/=]*([A-Za-z0-9+/=]{16,44})");
                                if (mSalt.Success)
                                {
                                    bestSalt = mSalt.Groups[1].Value;
                                }
                            }

                            if (ascii.Contains("barrierefreie_finanzen_enc_v1"))
                            {
                                Match mVault = Regex.Match(ascii, @"barrierefreie_finanzen_enc_v1[^\w\d+/=]*([A-Za-z0-9+/=]{50,})");
                                if (mVault.Success)
                                {
                                    bestVault = mVault.Groups[1].Value;
                                }
                            }
                        }
                        catch { }
                    }
                }

                if (!string.IsNullOrEmpty(bestSalt) && !string.IsNullOrEmpty(bestVault))
                {
                    return string.Format("{{\"salt\":\"{0}\",\"vault\":\"{1}\"}}", bestSalt, bestVault);
                }
            }
            catch { }

            return null;
        }

        private static void LaunchBestBrowser(string htmlPath, string profileDir)
        {
            string fileUri = "file:///" + htmlPath.Replace('\\', '/');

            // 1. GOOGLE CHROME
            string chromePath = FindBrowserPath(new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            });

            if (!string.IsNullOrEmpty(chromePath))
            {
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", fileUri, profileDir);
                Process.Start(new ProcessStartInfo
                {
                    FileName = chromePath,
                    Arguments = args,
                    UseShellExecute = false
                });
                return;
            }

            // 2. MOZILLA FIREFOX
            string firefoxPath = FindBrowserPath(new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Mozilla Firefox\firefox.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Mozilla Firefox\firefox.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Mozilla Firefox\firefox.exe")
            });

            if (!string.IsNullOrEmpty(firefoxPath))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = firefoxPath,
                    Arguments = string.Format("-new-window \"{0}\"", fileUri),
                    UseShellExecute = false
                });
                return;
            }

            // 3. MICROSOFT EDGE
            string edgePath = FindBrowserPath(new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
            });

            if (!string.IsNullOrEmpty(edgePath))
            {
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", fileUri, profileDir);
                Process.Start(new ProcessStartInfo
                {
                    FileName = edgePath,
                    Arguments = args,
                    UseShellExecute = false
                });
                return;
            }

            // 4. BRAVE BROWSER
            string bravePath = FindBrowserPath(new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"BraveSoftware\Brave-Browser\Application\brave.exe")
            });

            if (!string.IsNullOrEmpty(bravePath))
            {
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", fileUri, profileDir);
                Process.Start(new ProcessStartInfo
                {
                    FileName = bravePath,
                    Arguments = args,
                    UseShellExecute = false
                });
                return;
            }

            // 5. STANDARD FALLBACK
            Process.Start(new ProcessStartInfo
            {
                FileName = htmlPath,
                UseShellExecute = true
            });
        }

        private static string FindBrowserPath(string[] candidatePaths)
        {
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
                string resourceName = null;
                
                foreach (string name in asm.GetManifestResourceNames())
                {
                    if (name.IndexOf("embedded_app.html", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        resourceName = name;
                        break;
                    }
                }

                if (!string.IsNullOrEmpty(resourceName))
                {
                    using (Stream stream = asm.GetManifestResourceStream(resourceName))
                    {
                        if (stream != null)
                        {
                            string dir = Path.GetDirectoryName(targetHtml);
                            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                            {
                                Directory.CreateDirectory(dir);
                            }

                            using (FileStream fs = new FileStream(targetHtml, FileMode.Create, FileAccess.Write))
                            {
                                stream.CopyTo(fs);
                            }
                        }
                    }
                }
            }
            catch { }
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
            catch { }
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

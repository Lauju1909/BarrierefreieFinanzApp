using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

namespace HaushaltsbuchApp
{
    static class Program
    {
        private const string GITHUB_RAW_BASE = "https://raw.githubusercontent.com/Lauju1909/BarrierefreieFinanzApp/main";
        private const string VERSION_URL = GITHUB_RAW_BASE + "/version.json";
        private const string APP_HTML_URL = GITHUB_RAW_BASE + "/Haushaltsbuch_App.html";
        private const int BASE_PORT = 48123;

        private static string _centralVaultPath;
        private static string _centralBakPath;
        private static string _centralHtmlPath;
        private static TcpListener _tcpListener;
        private static Thread _serverThread;
        private static int _activePort = BASE_PORT;
        private static DateTime _lastHeartbeat = DateTime.Now;
        private static volatile bool _isRunning = true;

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

                // 1. FESTE SPEICHERPFADE IM BENUTZERVERZEICHNIS (KEINE ADMIN-RECHTE ERFORDERLICH!)
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string localHtmlInBaseDir = Path.Combine(baseDir, "Haushaltsbuch_App.html");

                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                if (string.IsNullOrEmpty(localAppData)) localAppData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                if (string.IsNullOrEmpty(localAppData)) localAppData = baseDir;

                string centralAppDir = Path.Combine(localAppData, "HaushaltsbuchApp");
                string centralProfileDir = Path.Combine(centralAppDir, "Profile");
                _centralHtmlPath = Path.Combine(centralAppDir, "Haushaltsbuch_App.html");
                string centralVersionPath = Path.Combine(centralAppDir, "version.json");
                _centralVaultPath = Path.Combine(centralAppDir, "Haushaltsbuch_Daten.vault");
                _centralBakPath = Path.Combine(centralAppDir, "Haushaltsbuch_Daten.vault.bak");

                try
                {
                    if (!Directory.Exists(centralAppDir)) Directory.CreateDirectory(centralAppDir);
                    if (!Directory.Exists(centralProfileDir)) Directory.CreateDirectory(centralProfileDir);
                }
                catch { }

                // 2. ENTPACKEN ODER SYNCHRONISIEREN
                if (!File.Exists(_centralHtmlPath))
                {
                    UnpackEmbeddedApp(_centralHtmlPath);
                }

                if (File.Exists(localHtmlInBaseDir) && !File.Exists(_centralHtmlPath))
                {
                    try { File.Copy(localHtmlInBaseDir, _centralHtmlPath, true); } catch { }
                }

                // 3. BACKGROUND UPDATE CHECK
                CheckAndApplyUpdate(_centralHtmlPath, centralVersionPath);

                string targetHtml = File.Exists(_centralHtmlPath) ? _centralHtmlPath : localHtmlInBaseDir;
                if (!File.Exists(targetHtml))
                {
                    UnpackEmbeddedApp(targetHtml);
                }

                // 4. SELBST-REPARATUR: DATEIEN PRÜFEN UND BEI BESCHÄDIGUNG AUTOMATISCH REPARIEREN
                AutoRepairVaultFiles(_centralVaultPath, _centralBakPath, localAppData);

                // 5. INJEKTION IN DIE HTML-DATEI ALS SOFORT-SICHERUNG
                InjectDiskVaultIntoHtml(targetHtml, _centralVaultPath);

                // 6. ZERO-PERMISSION LOKALEN SERVER STARTEN (TcpListener - Funktioniert ohne Admin-Rechte auf jedem PC!)
                bool serverStarted = StartLocalVaultServer();

                string launchUrl = serverStarted 
                    ? string.Format("http://127.0.0.1:{0}/", _activePort) 
                    : ("file:///" + targetHtml.Replace('\\', '/'));

                // 7. BROWSER STARTEN (Chrome -> Firefox -> Edge -> Brave -> Fallback)
                Process browserProc = LaunchBestBrowser(launchUrl, targetHtml, centralProfileDir);

                // 8. PROZESS AM LEBEN ERHALTEN (Heartbeat-Überwachung)
                _lastHeartbeat = DateTime.Now;
                int checks = 0;
                while (_isRunning)
                {
                    Thread.Sleep(1000);
                    checks++;

                    if (checks > 10)
                    {
                        TimeSpan idle = DateTime.Now - _lastHeartbeat;
                        if (idle.TotalSeconds > 12)
                        {
                            if (browserProc == null || browserProc.HasExited)
                            {
                                _isRunning = false;
                                break;
                            }
                        }
                    }
                }

                if (_tcpListener != null)
                {
                    try { _tcpListener.Stop(); } catch { }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Fehler beim Starten des Haushaltsbuchs: " + ex.Message, "Haushaltsbuch", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void AutoRepairVaultFiles(string vaultPath, string bakPath, string localAppData)
        {
            try
            {
                bool isVaultValid = IsValidVaultJsonFile(vaultPath);
                bool isBakValid = IsValidVaultJsonFile(bakPath);

                // Fall 1: Hauptdatei beschädigt/leer, aber Backup vorhanden -> Aus Backup reparieren!
                if (!isVaultValid && isBakValid)
                {
                    File.Copy(bakPath, vaultPath, true);
                    return;
                }

                // Fall 2: Hauptdatei intakt -> Backup aktualisieren
                if (isVaultValid)
                {
                    try { File.Copy(vaultPath, bakPath, true); } catch { }
                    return;
                }

                // Fall 3: Weder Haupt- noch Backup-Datei intakt -> Automatische Tiefenrettung aus Browser-LevelDB
                MigrateAllOldDataToDiskVault(vaultPath, localAppData);
            }
            catch { }
        }

        private static bool IsValidVaultJsonFile(string path)
        {
            try
            {
                if (!File.Exists(path)) return false;
                if (new FileInfo(path).Length < 20) return false;
                string text = File.ReadAllText(path, Encoding.UTF8).Trim('\ufeff', '\u200b', '\r', '\n', ' ');
                return text.StartsWith("{") && text.EndsWith("}") && text.Contains("salt") && text.Contains("vault");
            }
            catch
            {
                return false;
            }
        }

        private static bool StartLocalVaultServer()
        {
            for (int port = BASE_PORT; port <= BASE_PORT + 10; port++)
            {
                try
                {
                    var listener = new TcpListener(IPAddress.Loopback, port);
                    listener.Start();

                    _tcpListener = listener;
                    _activePort = port;

                    _serverThread = new Thread(() =>
                    {
                        while (_isRunning && _tcpListener != null)
                        {
                            try
                            {
                                var client = _tcpListener.AcceptTcpClient();
                                ThreadPool.QueueUserWorkItem((state) => HandleTcpClient(client));
                            }
                            catch { }
                        }
                    });
                    _serverThread.IsBackground = true;
                    _serverThread.Start();
                    return true;
                }
                catch { }
            }
            return false;
        }

        private static void HandleTcpClient(TcpClient client)
        {
            try
            {
                using (client)
                {
                    using (var stream = client.GetStream())
                    {
                        var buffer = new byte[65536];
                        int bytesRead = stream.Read(buffer, 0, buffer.Length);
                        if (bytesRead <= 0) return;

                        string rawReq = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                        string[] lines = rawReq.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                        if (lines.Length == 0) return;

                        string[] reqLine = lines[0].Split(' ');
                        if (reqLine.Length < 2) return;

                        string method = reqLine[0].ToUpper();
                        string url = reqLine[1];

                        // OPTIONS (CORS Pre-flight)
                        if (method == "OPTIONS")
                        {
                            SendHttpResponse(stream, 200, "text/plain", new byte[0]);
                            return;
                        }

                        // API: HEARTBEAT
                        if (url.StartsWith("/api/heartbeat"))
                        {
                            _lastHeartbeat = DateTime.Now;
                            byte[] data = Encoding.UTF8.GetBytes("{\"status\":\"alive\"}");
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        // API: GET VAULT
                        if (url.StartsWith("/api/get_vault"))
                        {
                            _lastHeartbeat = DateTime.Now;
                            string vaultJson = "{}";
                            if (File.Exists(_centralVaultPath))
                            {
                                vaultJson = File.ReadAllText(_centralVaultPath, Encoding.UTF8);
                                vaultJson = vaultJson.Trim('\ufeff', '\u200b', '\r', '\n', ' ');
                                if (string.IsNullOrEmpty(vaultJson)) vaultJson = "{}";
                            }
                            byte[] data = Encoding.UTF8.GetBytes(vaultJson);
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        // API: SAVE VAULT (POST)
                        if (url.StartsWith("/api/save_vault") && method == "POST")
                        {
                            _lastHeartbeat = DateTime.Now;
                            
                            int headerEnd = rawReq.IndexOf("\r\n\r\n");
                            string body = "";
                            if (headerEnd >= 0)
                            {
                                body = rawReq.Substring(headerEnd + 4);
                            }

                            if (!string.IsNullOrEmpty(body) && body.Contains("salt"))
                            {
                                body = body.Trim('\ufeff', '\u200b', '\r', '\n', ' ');
                                
                                string tmpPath = _centralVaultPath + ".tmp";
                                File.WriteAllText(tmpPath, body, Encoding.UTF8);

                                if (File.Exists(_centralVaultPath))
                                {
                                    try { File.Copy(_centralVaultPath, _centralBakPath, true); } catch { }
                                }

                                File.Copy(tmpPath, _centralVaultPath, true);
                                try { File.Delete(tmpPath); } catch { }

                                InjectDiskVaultIntoHtml(_centralHtmlPath, _centralVaultPath);
                            }

                            byte[] data = Encoding.UTF8.GetBytes("{\"status\":\"saved\"}");
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        // HAUPTSEITE HTML
                        if (File.Exists(_centralHtmlPath))
                        {
                            _lastHeartbeat = DateTime.Now;
                            byte[] htmlBytes = File.ReadAllBytes(_centralHtmlPath);
                            SendHttpResponse(stream, 200, "text/html", htmlBytes);
                            return;
                        }

                        SendHttpResponse(stream, 404, "text/plain", Encoding.UTF8.GetBytes("Not Found"));
                    }
                }
            }
            catch { }
        }

        private static void SendHttpResponse(Stream stream, int statusCode, string contentType, byte[] payload)
        {
            try
            {
                string statusText = statusCode == 200 ? "OK" : (statusCode == 404 ? "Not Found" : "Error");
                StringBuilder sb = new StringBuilder();
                sb.Append(string.Format("HTTP/1.1 {0} {1}\r\n", statusCode, statusText));
                sb.Append("Access-Control-Allow-Origin: *\r\n");
                sb.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
                sb.Append("Access-Control-Allow-Headers: Content-Type\r\n");
                sb.Append(string.Format("Content-Type: {0}; charset=utf-8\r\n", contentType));
                sb.Append(string.Format("Content-Length: {0}\r\n", payload.Length));
                sb.Append("Connection: close\r\n\r\n");

                byte[] headerBytes = Encoding.UTF8.GetBytes(sb.ToString());
                stream.Write(headerBytes, 0, headerBytes.Length);
                if (payload.Length > 0)
                {
                    stream.Write(payload, 0, payload.Length);
                }
                stream.Flush();
            }
            catch { }
        }

        private static void InjectDiskVaultIntoHtml(string htmlPath, string vaultPath)
        {
            try
            {
                if (!File.Exists(htmlPath)) return;
                string vaultJson = "{}";
                if (File.Exists(vaultPath))
                {
                    vaultJson = File.ReadAllText(vaultPath, Encoding.UTF8);
                    vaultJson = vaultJson.Trim('\ufeff', '\u200b', '\r', '\n', ' ');
                    if (string.IsNullOrEmpty(vaultJson) || !vaultJson.Contains("salt")) vaultJson = "{}";
                }

                string html = File.ReadAllText(htmlPath, Encoding.UTF8);
                string scriptTag = "<script id=\"disk-vault-data\">window.__DISK_VAULT__ = " + vaultJson + "; window.__LOCAL_PORT__ = " + _activePort + ";</script>";

                if (html.Contains("id=\"disk-vault-data\""))
                {
                    html = Regex.Replace(html, "<script id=\"disk-vault-data\">[\\s\\S]*?</script>", scriptTag);
                }
                else
                {
                    html = html.Replace("<body", scriptTag + "\n<body");
                }

                File.WriteAllText(htmlPath, html, Encoding.UTF8);
            }
            catch { }
        }

        private static void MigrateAllOldDataToDiskVault(string targetVaultPath, string localAppData)
        {
            try
            {
                if (File.Exists(targetVaultPath) && new FileInfo(targetVaultPath).Length > 20)
                {
                    return;
                }

                string oldVault = Path.Combine(localAppData, @"HaushaltsbuchApp\database.vault");
                if (File.Exists(oldVault) && new FileInfo(oldVault).Length > 20)
                {
                    File.Copy(oldVault, targetVaultPath, true);
                    return;
                }

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
                            File.WriteAllText(targetVaultPath, foundJson, Encoding.UTF8);
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
                                if (mSalt.Success) bestSalt = mSalt.Groups[1].Value;
                            }

                            if (ascii.Contains("barrierefreie_finanzen_enc_v1"))
                            {
                                Match mVault = Regex.Match(ascii, @"barrierefreie_finanzen_enc_v1[^\w\d+/=]*([A-Za-z0-9+/=]{50,})");
                                if (mVault.Success) bestVault = mVault.Groups[1].Value;
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

        private static Process LaunchBestBrowser(string url, string fallbackHtmlPath, string profileDir)
        {
            // 1. GOOGLE CHROME (Standard-Browser)
            string chromePath = FindBrowserPath(new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            });

            if (!string.IsNullOrEmpty(chromePath))
            {
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", url, profileDir);
                return Process.Start(new ProcessStartInfo
                {
                    FileName = chromePath,
                    Arguments = args,
                    UseShellExecute = false
                });
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
                return Process.Start(new ProcessStartInfo
                {
                    FileName = firefoxPath,
                    Arguments = string.Format("-new-window \"{0}\"", url),
                    UseShellExecute = false
                });
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
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", url, profileDir);
                return Process.Start(new ProcessStartInfo
                {
                    FileName = edgePath,
                    Arguments = args,
                    UseShellExecute = false
                });
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
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,880", url, profileDir);
                return Process.Start(new ProcessStartInfo
                {
                    FileName = bravePath,
                    Arguments = args,
                    UseShellExecute = false
                });
            }

            // 5. STANDARD FALLBACK
            return Process.Start(new ProcessStartInfo
            {
                FileName = url,
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

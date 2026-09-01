using System;
using System.Collections.Generic;
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

        private static string _activeStorageDir;
        private static string _vaultPath;
        private static string _bakPath;
        private static string _htmlPath;
        private static string _versionPath;
        private static string _profileDir;

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

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;

                // 1. SPEICHERORT: DIREKT IM ORDNER DER EXE! (Fallback auf %LOCALAPPDATA% falls keine Schreibrechte)
                _activeStorageDir = GetPrimaryExeStorageDirectory(baseDir);
                _profileDir = Path.Combine(_activeStorageDir, "Profile");
                _htmlPath = Path.Combine(_activeStorageDir, "Haushaltsbuch_App.html");
                _versionPath = Path.Combine(_activeStorageDir, "version.json");
                _vaultPath = Path.Combine(_activeStorageDir, "Haushaltsbuch_Daten.vault");
                _bakPath = Path.Combine(_activeStorageDir, "Haushaltsbuch_Daten.vault.bak");

                try
                {
                    if (!Directory.Exists(_activeStorageDir)) Directory.CreateDirectory(_activeStorageDir);
                    if (!Directory.Exists(_profileDir)) Directory.CreateDirectory(_profileDir);
                }
                catch { }

                // 2. ENTPACKEN ODER INITIALISIEREN DER HTML-DATEI
                if (!File.Exists(_htmlPath))
                {
                    UnpackEmbeddedApp(_htmlPath);
                }

                // 3. BACKGROUND UPDATE CHECK VON GITHUB
                CheckAndApplyUpdate(_htmlPath, _versionPath);

                if (!File.Exists(_htmlPath))
                {
                    UnpackEmbeddedApp(_htmlPath);
                }

                // 4. MAXIMALE TIEFENRETTUNG: DATEN AUS ALLEN ORTEN DIREKT IN DEN EXE-ORDNER RETTEN
                PerformUltimateDataRescue(_activeStorageDir, _vaultPath, _bakPath);

                // 5. INJEKTION DER DATEN IN DIE HTML
                InjectDiskVaultIntoHtml(_htmlPath, _vaultPath);

                // 6. ZERO-PERMISSION LOKALER TCP-SERVER STARTEN
                bool serverStarted = StartLocalVaultServer();

                string launchUrl = serverStarted 
                    ? string.Format("http://127.0.0.1:{0}/", _activePort) 
                    : ("file:///" + _htmlPath.Replace('\\', '/'));

                // 7. BROWSER STARTEN (Chrome -> Firefox -> Edge -> Brave -> Fallback)
                Process browserProc = LaunchBestBrowser(launchUrl, _htmlPath, _profileDir);

                // 8. PROZESS AM LEBEN ERHALTEN (Heartbeat)
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
                MessageBox.Show("Hinweis: " + ex.Message, "Haushaltsbuch", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private static string GetPrimaryExeStorageDirectory(string baseDir)
        {
            // 1. Priorität: DIREKT IM ORDNER DER EXE
            try
            {
                string testFile = Path.Combine(baseDir, ".write_test_" + Guid.NewGuid().ToString("N"));
                File.WriteAllText(testFile, "OK", Encoding.UTF8);
                if (File.Exists(testFile))
                {
                    File.Delete(testFile);
                    return baseDir;
                }
            }
            catch { }

            // 2. Priorität: %LOCALAPPDATA%\HaushaltsbuchApp
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            if (!string.IsNullOrEmpty(localApp))
            {
                string dir = Path.Combine(localApp, "HaushaltsbuchApp");
                try
                {
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                    return dir;
                }
                catch { }
            }

            // 3. Priorität: %APPDATA%\HaushaltsbuchApp
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (!string.IsNullOrEmpty(appData))
            {
                string dir = Path.Combine(appData, "HaushaltsbuchApp");
                try
                {
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                    return dir;
                }
                catch { }
            }

            return baseDir;
        }

        private static void PerformUltimateDataRescue(string activeDir, string vaultPath, string bakPath)
        {
            try
            {
                // Wenn Hauptdatei bereits intakt ist -> Backup synchronisieren & fertig
                if (IsValidVaultJsonFile(vaultPath))
                {
                    try { File.Copy(vaultPath, bakPath, true); } catch { }
                    return;
                }

                // Wenn Backup intakt ist -> Hauptdatei daraus reparieren
                if (IsValidVaultJsonFile(bakPath))
                {
                    File.Copy(bakPath, vaultPath, true);
                    return;
                }

                // Tiefenrettung aus allen früheren Ordnern, Browsern und Backups
                string foundVault = DeepScanAllPreviousSources();
                if (!string.IsNullOrEmpty(foundVault))
                {
                    File.WriteAllText(vaultPath, foundVault, Encoding.UTF8);
                    try { File.WriteAllText(bakPath, foundVault, Encoding.UTF8); } catch { }
                    return;
                }
            }
            catch { }
        }

        private static string DeepScanAllPreviousSources()
        {
            try
            {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

                // 1. Prüfe alte AppData-Ordner
                if (!string.IsNullOrEmpty(localAppData))
                {
                    string old1 = Path.Combine(localAppData, @"HaushaltsbuchApp\Haushaltsbuch_Daten.vault");
                    if (IsValidVaultJsonFile(old1)) return File.ReadAllText(old1, Encoding.UTF8);

                    string oldBak = Path.Combine(localAppData, @"HaushaltsbuchApp\Haushaltsbuch_Daten.vault.bak");
                    if (IsValidVaultJsonFile(oldBak)) return File.ReadAllText(oldBak, Encoding.UTF8);

                    string oldDb = Path.Combine(localAppData, @"HaushaltsbuchApp\database.vault");
                    if (IsValidVaultJsonFile(oldDb)) return File.ReadAllText(oldDb, Encoding.UTF8);
                }

                if (!string.IsNullOrEmpty(appData))
                {
                    string oldRoaming = Path.Combine(appData, @"HaushaltsbuchApp\Haushaltsbuch_Daten.vault");
                    if (IsValidVaultJsonFile(oldRoaming)) return File.ReadAllText(oldRoaming, Encoding.UTF8);
                }

                // 2. Scanne LevelDB-Ordner aller Browser (Chrome, Edge, Brave)
                List<string> candidateFolders = new List<string>();
                if (!string.IsNullOrEmpty(localAppData))
                {
                    candidateFolders.Add(Path.Combine(localAppData, @"Google\Chrome\User Data\Default\Local Storage\leveldb"));
                    candidateFolders.Add(Path.Combine(localAppData, @"HaushaltsbuchApp\Profile\Default\Local Storage\leveldb"));
                    candidateFolders.Add(Path.Combine(localAppData, @"Microsoft\Edge\User Data\Default\Local Storage\leveldb"));
                    candidateFolders.Add(Path.Combine(localAppData, @"BraveSoftware\Brave-Browser\User Data\Default\Local Storage\leveldb"));

                    for (int i = 1; i <= 10; i++)
                    {
                        candidateFolders.Add(Path.Combine(localAppData, string.Format(@"Google\Chrome\User Data\Profile {0}\Local Storage\leveldb", i)));
                        candidateFolders.Add(Path.Combine(localAppData, string.Format(@"Microsoft\Edge\User Data\Profile {0}\Local Storage\leveldb", i)));
                    }
                }

                foreach (string dir in candidateFolders)
                {
                    if (Directory.Exists(dir))
                    {
                        string match = ScanLevelDbWithPrintFilter(dir);
                        if (!string.IsNullOrEmpty(match)) return match;
                    }
                }

                // 3. Scanne Downloads, Desktop, Dokumente nach Backups (.json)
                string[] userDirs = new string[]
                {
                    Path.Combine(userProfile, "Downloads"),
                    Path.Combine(userProfile, "Desktop"),
                    Path.Combine(userProfile, "Documents")
                };

                foreach (string udir in userDirs)
                {
                    if (Directory.Exists(udir))
                    {
                        string[] files = Directory.GetFiles(udir, "*.json");
                        foreach (string f in files)
                        {
                            if (IsValidVaultJsonFile(f))
                            {
                                return File.ReadAllText(f, Encoding.UTF8);
                            }
                        }
                    }
                }
            }
            catch { }

            return null;
        }

        private static string ScanLevelDbWithPrintFilter(string dir)
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

                            StringBuilder sb = new StringBuilder(bytes.Length);
                            for (int i = 0; i < bytes.Length; i++)
                            {
                                byte b = bytes[i];
                                if (b >= 32 && b <= 126)
                                {
                                    sb.Append((char)b);
                                }
                            }
                            string printable = sb.ToString();

                            if (printable.Contains("barrierefreie_finanzen_salt_v1"))
                            {
                                Match mSalt = Regex.Match(printable, @"barrierefreie_finanzen_salt_v1[^\w\d+/=]*([A-Za-z0-9+/=]{16,44}?)(?:barrierefreie|$|\x00)");
                                if (mSalt.Success) bestSalt = mSalt.Groups[1].Value;
                            }

                            if (printable.Contains("barrierefreie_finanzen_enc_v1"))
                            {
                                Match mVault = Regex.Match(printable, @"barrierefreie_finanzen_enc_v1[^\w\d+/=]*([A-Za-z0-9+/=]{50,}?)(?:barrierefreie|$|\x00)");
                                if (mVault.Success) bestVault = mVault.Groups[1].Value;
                            }

                            if (string.IsNullOrEmpty(bestSalt) && printable.Contains("\"salt\""))
                            {
                                Match mSalt = Regex.Match(printable, "\"salt\"\\s*:\\s*\"([A-Za-z0-9+/=]{16,44})\"");
                                if (mSalt.Success) bestSalt = mSalt.Groups[1].Value;
                            }

                            if (string.IsNullOrEmpty(bestVault) && printable.Contains("\"vault\""))
                            {
                                Match mVault = Regex.Match(printable, "\"vault\"\\s*:\\s*\"([A-Za-z0-9+/=]{50,})\"");
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
            for (int port = BASE_PORT; port <= BASE_PORT + 12; port++)
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
                    client.ReceiveTimeout = 6000;
                    client.SendTimeout = 6000;
                    using (var stream = client.GetStream())
                    {
                        var ms = new MemoryStream();
                        var buffer = new byte[8192];
                        int headerEnd = -1;
                        int contentLength = 0;

                        while (true)
                        {
                            int read = stream.Read(buffer, 0, buffer.Length);
                            if (read <= 0) break;
                            ms.Write(buffer, 0, read);

                            string currentText = Encoding.UTF8.GetString(ms.ToArray());
                            headerEnd = currentText.IndexOf("\r\n\r\n");
                            if (headerEnd >= 0)
                            {
                                Match clMatch = Regex.Match(currentText, @"Content-Length:\s*(\d+)", RegexOptions.IgnoreCase);
                                if (clMatch.Success) contentLength = int.Parse(clMatch.Groups[1].Value);
                                break;
                            }
                        }

                        if (headerEnd < 0) return;

                        byte[] allBytes = ms.ToArray();
                        string allText = Encoding.UTF8.GetString(allBytes);
                        string headerPart = allText.Substring(0, headerEnd);
                        int headerByteCount = Encoding.UTF8.GetByteCount(headerPart) + 4;
                        int bodyBytesRead = allBytes.Length - headerByteCount;

                        while (contentLength > 0 && bodyBytesRead < contentLength)
                        {
                            int toRead = Math.Min(buffer.Length, contentLength - bodyBytesRead);
                            int read = stream.Read(buffer, 0, toRead);
                            if (read <= 0) break;
                            ms.Write(buffer, 0, read);
                            bodyBytesRead += read;
                        }

                        allBytes = ms.ToArray();
                        string body = "";
                        if (contentLength > 0 && allBytes.Length >= headerByteCount + contentLength)
                        {
                            body = Encoding.UTF8.GetString(allBytes, headerByteCount, contentLength);
                        }

                        string[] reqLines = headerPart.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                        if (reqLines.Length == 0) return;

                        string[] reqFirst = reqLines[0].Split(' ');
                        if (reqFirst.Length < 2) return;

                        string method = reqFirst[0].ToUpper();
                        string url = reqFirst[1];

                        if (method == "OPTIONS")
                        {
                            SendHttpResponse(stream, 200, "text/plain", new byte[0]);
                            return;
                        }

                        if (url.StartsWith("/api/heartbeat"))
                        {
                            _lastHeartbeat = DateTime.Now;
                            byte[] data = Encoding.UTF8.GetBytes("{\"status\":\"alive\"}");
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        if (url.StartsWith("/api/get_vault"))
                        {
                            _lastHeartbeat = DateTime.Now;
                            string vaultJson = "{}";
                            if (File.Exists(_vaultPath))
                            {
                                vaultJson = File.ReadAllText(_vaultPath, Encoding.UTF8);
                                vaultJson = vaultJson.Trim('\ufeff', '\u200b', '\r', '\n', ' ');
                                if (string.IsNullOrEmpty(vaultJson)) vaultJson = "{}";
                            }
                            byte[] data = Encoding.UTF8.GetBytes(vaultJson);
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        if (url.StartsWith("/api/deep_recovery"))
                        {
                            _lastHeartbeat = DateTime.Now;
                            string rescued = DeepScanAllPreviousSources();
                            if (string.IsNullOrEmpty(rescued)) rescued = "{}";
                            byte[] data = Encoding.UTF8.GetBytes(rescued);
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        if (url.StartsWith("/api/save_vault") && method == "POST")
                        {
                            _lastHeartbeat = DateTime.Now;

                            if (!string.IsNullOrEmpty(body) && body.Contains("salt"))
                            {
                                body = body.Trim('\ufeff', '\u200b', '\r', '\n', ' ');
                                
                                string tmpPath = _vaultPath + ".tmp";
                                File.WriteAllText(tmpPath, body, Encoding.UTF8);

                                if (File.Exists(_vaultPath))
                                {
                                    try { File.Copy(_vaultPath, _bakPath, true); } catch { }
                                }

                                File.Copy(tmpPath, _vaultPath, true);
                                try { File.Delete(tmpPath); } catch { }

                                InjectDiskVaultIntoHtml(_htmlPath, _vaultPath);
                            }

                            byte[] data = Encoding.UTF8.GetBytes("{\"status\":\"saved\"}");
                            SendHttpResponse(stream, 200, "application/json", data);
                            return;
                        }

                        if (File.Exists(_htmlPath))
                        {
                            _lastHeartbeat = DateTime.Now;
                            byte[] htmlBytes = File.ReadAllBytes(_htmlPath);
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

        private static Process LaunchBestBrowser(string url, string fallbackHtmlPath, string profileDir)
        {
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

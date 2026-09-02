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

                // 1. SPEICHERORT: AUSSCHLIESSLICH IM ORDNER DER EXE
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

                // 2. ENTPACKEN ODER SYNCHRONISIEREN DER HTML-DATEI
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

                // 4. BEREINIGUNG: LÖSCHE ALLE ALTEN SPEICHERORTE / DUPLIKATE AUSSERHALB DIESES ORDNERSS
                PurgeAllExternalStorageLocations(_activeStorageDir);

                if (!File.Exists(_vaultPath))
                {
                    try
                    {
                        string lsDir = Path.Combine(_profileDir, @"Default\Local Storage");
                        if (Directory.Exists(lsDir)) Directory.Delete(lsDir, true);
                    }
                    catch { }
                }

                // 5. ZERO-PERMISSION LOKALER TCP-SERVER STARTEN
                bool serverStarted = StartLocalVaultServer();

                // 6. INJEKTION DER DATEN UND DES AKTIVEN PORTS IN DIE HTML
                InjectDiskVaultIntoHtml(_htmlPath, _vaultPath);

                string launchUrl = serverStarted 
                    ? string.Format("http://127.0.0.1:{0}/", _activePort) 
                    : ("file:///" + _htmlPath.Replace('\\', '/'));

                // 7. BROWSER STARTEN
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

            return baseDir;
        }

        private static void PurgeAllExternalStorageLocations(string activeDir)
        {
            try
            {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);

                List<string> externalDirs = new List<string>();

                if (!string.IsNullOrEmpty(localAppData))
                {
                    externalDirs.Add(Path.Combine(localAppData, "HaushaltsbuchApp"));
                }
                if (!string.IsNullOrEmpty(appData))
                {
                    externalDirs.Add(Path.Combine(appData, "HaushaltsbuchApp"));
                }

                foreach (string dir in externalDirs)
                {
                    // Lösche nur, wenn es NICHT der aktive EXE-Ordner ist!
                    if (!string.Equals(Path.GetFullPath(dir), Path.GetFullPath(activeDir), StringComparison.OrdinalIgnoreCase))
                    {
                        if (Directory.Exists(dir))
                        {
                            try
                            {
                                string f1 = Path.Combine(dir, "Haushaltsbuch_Daten.vault");
                                string f2 = Path.Combine(dir, "Haushaltsbuch_Daten.vault.bak");
                                string f3 = Path.Combine(dir, "database.vault");

                                if (File.Exists(f1)) File.Delete(f1);
                                if (File.Exists(f2)) File.Delete(f2);
                                if (File.Exists(f3)) File.Delete(f3);

                                // Wenn der Ordner leer ist, komplett aufräumen
                                Directory.Delete(dir, true);
                            }
                            catch { }
                        }
                    }
                }
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

                        if (url.StartsWith("/api/send_feedback") && method == "POST")
                        {
                            _lastHeartbeat = DateTime.Now;
                            
                            // 1. Lokales Archiv
                            try
                            {
                                string logPath = Path.Combine(_activeStorageDir, "Feedback_Archiv.txt");
                                string entry = "\r\n[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "]\r\n" + body + "\r\n----------------------------------\r\n";
                                File.AppendAllText(logPath, entry, Encoding.UTF8);
                            }
                            catch { }

                            // 2. Sofort-Benachrichtigung an ntfy.sh (100% ohne Konto, ohne Anmeldung)
                            try
                            {
                                using (var wbNtfy = new System.Net.WebClient())
                                {
                                    wbNtfy.Headers[System.Net.HttpRequestHeader.ContentType] = "application/json";
                                    wbNtfy.Encoding = Encoding.UTF8;
                                    string cleanBody = body.Replace("\"", "'").Replace("\r", "").Replace("\n", " ");
                                    string ntfyPayload = "{\"topic\":\"lauju_haushaltsbuch_feedback\",\"title\":\"💡 Neues Haushaltsbuch Feedback\",\"message\":\"" + cleanBody + "\",\"priority\":4,\"tags\":[\"bulb\",\"moneybag\"]}";
                                    wbNtfy.UploadString("https://ntfy.sh", ntfyPayload);
                                }
                            }
                            catch { }

                            // 3. E-Mail Versand an lauju1909@gmail.com
                            try
                            {
                                using (var wbMail = new System.Net.WebClient())
                                {
                                    wbMail.Headers[System.Net.HttpRequestHeader.ContentType] = "application/json";
                                    wbMail.Headers[System.Net.HttpRequestHeader.Accept] = "application/json";
                                    wbMail.Encoding = Encoding.UTF8;
                                    wbMail.UploadString("https://formsubmit.co/ajax/lauju1909@gmail.com", body);
                                }
                            }
                            catch { }

                            byte[] okData = Encoding.UTF8.GetBytes("{\"status\":\"success\"}");
                            SendHttpResponse(stream, 200, "application/json", okData);
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
                            else if (!string.IsNullOrEmpty(body) && body.Trim() == "{}")
                            {
                                try { if (File.Exists(_vaultPath)) File.Delete(_vaultPath); } catch { }
                                try { if (File.Exists(_bakPath)) File.Delete(_bakPath); } catch { }
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

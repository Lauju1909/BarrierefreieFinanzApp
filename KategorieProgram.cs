using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace KategorieApp
{
    static class Program
    {
        private const int BASE_PORT = 48129;
        private static string _htmlPath;
        private static string _jsonPath;
        private static string _baseDir;
        private static TcpListener _tcpListener;
        private static Thread _serverThread;
        private static int _activePort = BASE_PORT;
        private static volatile bool _isRunning = true;

        [STAThread]
        static void Main()
        {
            try
            {
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288 | SecurityProtocolType.Tls12;
            }
            catch { }

            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _htmlPath = Path.Combine(_baseDir, "Kategorie_Zentrale.html");
            _jsonPath = Path.Combine(_baseDir, "categories.json");

            if (!File.Exists(_htmlPath))
            {
                UnpackEmbeddedHtml(_htmlPath);
            }

            StartLocalServer();

            string chromePath = FindBrowser();
            string profileDir = Path.Combine(_baseDir, "Profile_Kategorien");

            string url = "file:///" + _htmlPath.Replace('\\', '/') + "?port=" + _activePort;

            if (!string.IsNullOrEmpty(chromePath))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = chromePath,
                    Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1120,860", url, profileDir),
                    UseShellExecute = false
                });
            }
            else
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }

            while (_isRunning)
            {
                Thread.Sleep(2000);
            }
        }

        private static void StartLocalServer()
        {
            for (int offset = 0; offset < 10; offset++)
            {
                int port = BASE_PORT + offset;
                try
                {
                    var listener = new TcpListener(IPAddress.Loopback, port);
                    listener.Start();
                    _activePort = port;
                    _tcpListener = listener;

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
                    break;
                }
                catch { }
            }
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

                        if (url.StartsWith("/api/get_token") && method == "GET")
                        {
                            string token = GetGhToken();
                            byte[] tokenBytes = Encoding.UTF8.GetBytes("{\"token\":\"" + token + "\"}");
                            SendHttpResponse(stream, 200, "application/json", tokenBytes);
                            return;
                        }

                        if (url.StartsWith("/api/save_local") && method == "POST")
                        {
                            if (!string.IsNullOrEmpty(body) && body.Trim().StartsWith("{"))
                            {
                                File.WriteAllText(_jsonPath, body, Encoding.UTF8);
                                SyncWithLocalGitRepos(body);
                                byte[] ok = Encoding.UTF8.GetBytes("{\"status\":\"saved\",\"path\":\"" + _jsonPath.Replace("\\", "\\\\") + "\"}");
                                SendHttpResponse(stream, 200, "application/json", ok);
                                return;
                            }
                        }

                        if (url.StartsWith("/categories.json") && method == "GET")
                        {
                            if (File.Exists(_jsonPath))
                            {
                                byte[] data = File.ReadAllBytes(_jsonPath);
                                SendHttpResponse(stream, 200, "application/json", data);
                                return;
                            }
                        }

                        byte[] notFound = Encoding.UTF8.GetBytes("{\"error\":\"Not Found\"}");
                        SendHttpResponse(stream, 404, "application/json", notFound);
                    }
                }
            }
            catch { }
        }

        private static string GetGhToken()
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "gh",
                    Arguments = "auth token",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (var proc = Process.Start(psi))
                {
                    string outStr = proc.StandardOutput.ReadToEnd().Trim();
                    proc.WaitForExit();
                    if (!string.IsNullOrEmpty(outStr)) return outStr;
                }
            }
            catch { }
            return "";
        }

        private static void SyncWithLocalGitRepos(string jsonBody)
        {
            try
            {
                string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                string repoDesktop = Path.Combine(userProfile, @".gemini\antigravity\scratch\BarrierefreieFinanzApp");
                if (Directory.Exists(repoDesktop))
                {
                    string target = Path.Combine(repoDesktop, "categories.json");
                    File.WriteAllText(target, jsonBody, Encoding.UTF8);
                }

                string repoAndroid = Path.Combine(userProfile, @".gemini\antigravity\scratch\BarrierefreieFinanzApp_Android\www");
                if (Directory.Exists(repoAndroid))
                {
                    string target = Path.Combine(repoAndroid, "categories.json");
                    File.WriteAllText(target, jsonBody, Encoding.UTF8);
                }
            }
            catch { }
        }

        private static void SendHttpResponse(Stream stream, int statusCode, string contentType, byte[] bodyBytes)
        {
            try
            {
                string statusText = statusCode == 200 ? "OK" : (statusCode == 404 ? "Not Found" : "Error");
                string headers = string.Format(
                    "HTTP/1.1 {0} {1}\r\n" +
                    "Content-Type: {2}; charset=utf-8\r\n" +
                    "Content-Length: {3}\r\n" +
                    "Access-Control-Allow-Origin: *\r\n" +
                    "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                    "Access-Control-Allow-Headers: Content-Type, Authorization\r\n" +
                    "Connection: close\r\n\r\n",
                    statusCode, statusText, contentType, bodyBytes.Length);

                byte[] headerBytes = Encoding.UTF8.GetBytes(headers);
                stream.Write(headerBytes, 0, headerBytes.Length);
                if (bodyBytes.Length > 0)
                {
                    stream.Write(bodyBytes, 0, bodyBytes.Length);
                }
                stream.Flush();
            }
            catch { }
        }

        private static string FindBrowser()
        {
            string[] paths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static void UnpackEmbeddedHtml(string target)
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                foreach (string name in asm.GetManifestResourceNames())
                {
                    if (name.IndexOf("Kategorie_Zentrale.html", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        using (Stream s = asm.GetManifestResourceStream(name))
                        using (FileStream fs = new FileStream(target, FileMode.Create, FileAccess.Write))
                        {
                            s.CopyTo(fs);
                        }
                        break;
                    }
                }
            }
            catch { }
        }
    }
}

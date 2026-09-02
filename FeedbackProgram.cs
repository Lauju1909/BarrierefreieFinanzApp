using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;

namespace FeedbackApp
{
    static class Program
    {
        private static string _htmlPath;

        [STAThread]
        static void Main()
        {
            try
            {
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288 | SecurityProtocolType.Tls12;
            }
            catch { }

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _htmlPath = Path.Combine(baseDir, "Feedback_Inbox.html");

            if (!File.Exists(_htmlPath))
            {
                UnpackEmbeddedHtml(_htmlPath);
            }

            string chromePath = FindBrowser();
            string profileDir = Path.Combine(baseDir, "Profile_Feedback");

            string url = "file:///" + _htmlPath.Replace('\\', '/');

            if (!string.IsNullOrEmpty(chromePath))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = chromePath,
                    Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=980,780", url, profileDir),
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
                    if (name.IndexOf("Feedback_Inbox.html", StringComparison.OrdinalIgnoreCase) >= 0)
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

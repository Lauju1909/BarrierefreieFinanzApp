#![windows_subsystem = "windows"]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const EMBEDDED_INBOX_HTML: &str = include_str!("../../Feedback_Inbox.html");

fn find_browser() -> Option<PathBuf> {
    let mut candidates = Vec::new();
    if let Ok(pf) = std::env::var("ProgramFiles") {
        candidates.push(PathBuf::from(&pf).join(r"Google\Chrome\Application\chrome.exe"));
        candidates.push(PathBuf::from(&pf).join(r"Microsoft\Edge\Application\msedge.exe"));
    }
    if let Ok(pf86) = std::env::var("ProgramFiles(x86)") {
        candidates.push(PathBuf::from(&pf86).join(r"Google\Chrome\Application\chrome.exe"));
        candidates.push(PathBuf::from(&pf86).join(r"Microsoft\Edge\Application\msedge.exe"));
    }
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        candidates.push(PathBuf::from(&local).join(r"Google\Chrome\Application\chrome.exe"));
        candidates.push(PathBuf::from(&local).join(r"Microsoft\Edge\Application\msedge.exe"));
    }
    candidates.into_iter().find(|p| p.is_file())
}

fn main() {
    let exe_path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    let base_dir = exe_path.parent().unwrap_or_else(|| Path::new(".")).to_path_buf();
    let html_path = base_dir.join("Feedback_Inbox.html");

    if !html_path.exists() {
        let _ = fs::write(&html_path, EMBEDDED_INBOX_HTML);
    }

    let local_app_data = std::env::var("LOCALAPPDATA")
        .unwrap_or_else(|_| r"C:\Users\Default\AppData\Local".to_string());
    let profile_dir = PathBuf::from(local_app_data)
        .join("HaushaltsbuchFeedback")
        .join("Profile");
    let _ = fs::create_dir_all(&profile_dir);

    let file_uri = format!(
        "file:///{}",
        html_path.to_string_lossy().replace('\\', "/")
    );

    if let Some(browser) = find_browser() {
        let _ = Command::new(browser)
            .arg(format!("--app={}", file_uri))
            .arg(format!("--user-data-dir={}", profile_dir.display()))
            .arg("--window-size=1280,860")
            .arg("--no-first-run")
            .arg("--no-default-browser-check")
            .arg("--force-renderer-accessibility")
            .spawn();
    } else {
        let _ = Command::new("cmd")
            .args(["/C", "start", "", &html_path.to_string_lossy()])
            .spawn();
    }
}

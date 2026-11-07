#![windows_subsystem = "windows"]

use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const EMBEDDED_KATEGORIE_HTML: &str = include_str!("../../Kategorie_Zentrale.html");
const EMBEDDED_CATEGORIES_JSON: &str = include_str!("../../categories.json");
const BASE_PORT: u16 = 48190;

struct ZentraleState {
    base_dir: PathBuf,
    html_path: PathBuf,
    json_path: PathBuf,
    last_heartbeat: AtomicU64,
    running: AtomicBool,
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn get_gh_token() -> String {
    if let Ok(output) = Command::new("gh").args(["auth", "token"]).output() {
        if output.status.success() {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                return s;
            }
        }
    }
    String::new()
}

fn sync_with_local_git_repos(json_body: &str) {
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        let base = PathBuf::from(user_profile).join(r".gemini\antigravity\scratch");
        let desktop_repo = base.join("BarrierefreieFinanzApp");
        if desktop_repo.is_dir() {
            let _ = fs::write(desktop_repo.join("categories.json"), json_body);
        }
        let android_repo = base.join(r"BarrierefreieFinanzApp_Android\www");
        if android_repo.is_dir() {
            let _ = fs::write(android_repo.join("categories.json"), json_body);
        }
    }
}

fn send_http_response(stream: &mut TcpStream, status_code: u16, content_type: &str, body: &[u8]) {
    let status_text = match status_code {
        200 => "OK",
        204 => "No Content",
        404 => "Not Found",
        _ => "Error",
    };
    let header = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}; charset=utf-8\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type, Authorization\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
        status_code,
        status_text,
        content_type,
        body.len()
    );
    let _ = stream.write_all(header.as_bytes());
    if !body.is_empty() {
        let _ = stream.write_all(body);
    }
    let _ = stream.flush();
}

fn handle_client(mut stream: TcpStream, state: Arc<ZentraleState>) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(5)));

    let mut buf = vec![0u8; 65536];
    let mut total_read = 0usize;
    let mut header_end = None;

    while total_read < buf.len() {
        match stream.read(&mut buf[total_read..]) {
            Ok(0) => break,
            Ok(n) => {
                total_read += n;
                if let Some(pos) = buf[..total_read]
                    .windows(4)
                    .position(|w| w == b"\r\n\r\n")
                {
                    header_end = Some(pos + 4);
                    break;
                }
            }
            Err(_) => break,
        }
    }

    let header_end = match header_end {
        Some(h) => h,
        None => return,
    };

    let header_str = String::from_utf8_lossy(&buf[..header_end]).to_string();
    let mut lines = header_str.lines();
    let request_line = match lines.next() {
        Some(l) => l,
        None => return,
    };
    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return;
    }
    let method = parts[0].to_uppercase();
    let url = parts[1];

    let mut content_length = 0usize;
    for line in lines {
        let lower = line.to_lowercase();
        if let Some(rest) = lower.strip_prefix("content-length:") {
            content_length = rest.trim().parse::<usize>().unwrap_or(0);
        }
    }

    let already_body = total_read.saturating_sub(header_end);
    let mut body_bytes = Vec::with_capacity(content_length.max(already_body));
    body_bytes.extend_from_slice(&buf[header_end..total_read]);

    while body_bytes.len() < content_length {
        let mut chunk = [0u8; 8192];
        match stream.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => body_bytes.extend_from_slice(&chunk[..n]),
            Err(_) => break,
        }
    }

    state.last_heartbeat.store(now_secs(), Ordering::SeqCst);

    if method == "OPTIONS" {
        send_http_response(&mut stream, 204, "text/plain", b"");
        return;
    }

    if url.starts_with("/api/heartbeat") {
        send_http_response(&mut stream, 200, "application/json", b"{\"ok\":true}");
        return;
    }

    if url.starts_with("/api/gh-token") && method == "GET" {
        let token = get_gh_token().replace('"', "");
        let resp = format!("{{\"token\":\"{}\"}}", token);
        send_http_response(&mut stream, 200, "application/json", resp.as_bytes());
        return;
    }

    if url.starts_with("/api/categories") && method == "GET" {
        let data = fs::read(&state.json_path)
            .unwrap_or_else(|_| EMBEDDED_CATEGORIES_JSON.as_bytes().to_vec());
        send_http_response(&mut stream, 200, "application/json", &data);
        return;
    }

    if url.starts_with("/api/categories") && method == "POST" {
        let body_str = String::from_utf8_lossy(&body_bytes).to_string();
        if !body_str.trim().is_empty() {
            let _ = fs::write(&state.json_path, body_str.as_bytes());
            sync_with_local_git_repos(&body_str);
            let _ = state.base_dir.as_path();
            send_http_response(&mut stream, 200, "application/json", b"{\"saved\":true}");
        } else {
            send_http_response(&mut stream, 400, "application/json", b"{\"error\":\"Empty body\"}");
        }
        return;
    }

    if (url == "/" || url.starts_with("/index.html") || url.starts_with("/Kategorie_Zentrale.html"))
        && method == "GET"
    {
        let data = fs::read(&state.html_path)
            .unwrap_or_else(|_| EMBEDDED_KATEGORIE_HTML.as_bytes().to_vec());
        send_http_response(&mut stream, 200, "text/html", &data);
        return;
    }

    if url.starts_with("/categories.json") && method == "GET" {
        let data = fs::read(&state.json_path)
            .unwrap_or_else(|_| EMBEDDED_CATEGORIES_JSON.as_bytes().to_vec());
        send_http_response(&mut stream, 200, "application/json", &data);
        return;
    }

    send_http_response(&mut stream, 404, "application/json", b"{\"error\":\"Not Found\"}");
}

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
    let html_path = base_dir.join("Kategorie_Zentrale.html");
    let json_path = base_dir.join("categories.json");

    if !html_path.exists() {
        let _ = fs::write(&html_path, EMBEDDED_KATEGORIE_HTML);
    }
    if !json_path.exists() {
        let _ = fs::write(&json_path, EMBEDDED_CATEGORIES_JSON);
    }

    let mut bound_listener = None;
    let mut active_port = BASE_PORT;
    for port in BASE_PORT..=(BASE_PORT + 15) {
        if let Ok(l) = TcpListener::bind(format!("127.0.0.1:{}", port)) {
            bound_listener = Some(l);
            active_port = port;
            break;
        }
    }

    let listener = match bound_listener {
        Some(l) => l,
        None => return,
    };

    let state = Arc::new(ZentraleState {
        base_dir,
        html_path,
        json_path,
        last_heartbeat: AtomicU64::new(now_secs()),
        running: AtomicBool::new(true),
    });

    let server_state = Arc::clone(&state);
    thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            if !server_state.running.load(Ordering::SeqCst) {
                break;
            }
            let st = Arc::clone(&server_state);
            thread::spawn(move || handle_client(stream, st));
        }
    });

    let local_app_data = std::env::var("LOCALAPPDATA")
        .unwrap_or_else(|_| r"C:\Users\Default\AppData\Local".to_string());
    let profile_dir = PathBuf::from(local_app_data)
        .join("HaushaltsbuchKategorien")
        .join("Profile");
    let _ = fs::create_dir_all(&profile_dir);

    let url = format!("http://127.0.0.1:{}/", active_port);
    let mut browser_proc = if let Some(browser) = find_browser() {
        Command::new(browser)
            .arg(format!("--app={}", url))
            .arg(format!("--user-data-dir={}", profile_dir.display()))
            .arg("--window-size=1320,880")
            .arg("--no-first-run")
            .arg("--no-default-browser-check")
            .arg("--force-renderer-accessibility")
            .spawn()
            .ok()
    } else {
        let _ = Command::new("cmd").args(["/C", "start", "", &url]).spawn();
        None
    };

    let mut checks = 0u32;
    while state.running.load(Ordering::SeqCst) {
        thread::sleep(Duration::from_secs(1));
        checks += 1;
        if checks > 10 {
            let idle = now_secs().saturating_sub(state.last_heartbeat.load(Ordering::SeqCst));
            if idle > 15 {
                let exited = browser_proc
                    .as_mut()
                    .and_then(|c| c.try_wait().ok())
                    .map(|w| w.is_some())
                    .unwrap_or(true);
                if exited {
                    state.running.store(false, Ordering::SeqCst);
                    break;
                }
            }
        }
    }
}

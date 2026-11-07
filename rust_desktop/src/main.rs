#![windows_subsystem = "windows"]

use std::fs;
use std::io::{Read, Write};
use std::net::{Shutdown, TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

const APP_VERSION: &str = "6.9.62";
const BASE_PORT: u16 = 48123;
const MAX_PORT_OFFSET: u16 = 15;
const EMBEDDED_APP_HTML: &str = include_str!("../embedded_app.html");

#[repr(C)]
struct SystemTimeWin {
    w_year: u16,
    w_month: u16,
    w_day_of_week: u16,
    w_day: u16,
    w_hour: u16,
    w_minute: u16,
    w_second: u16,
    w_milliseconds: u16,
}

#[link(name = "kernel32")]
extern "system" {
    fn GetLocalTime(lp_system_time: *mut SystemTimeWin);
}

#[link(name = "bcrypt")]
extern "system" {
    fn BCryptGenRandom(
        h_algorithm: *mut std::ffi::c_void,
        pb_buffer: *mut u8,
        cb_buffer: u32,
        dw_flags: u32,
    ) -> i32;
}

fn generate_session_token() -> String {
    let mut bytes = [0u8; 16];
    let ret = unsafe { BCryptGenRandom(std::ptr::null_mut(), bytes.as_mut_ptr(), 16, 2) };
    if ret == 0 {
        return bytes.iter().map(|b| format!("{:02x}", b)).collect();
    }
    // Fallback pseudo-random
    let t = Instant::now().elapsed().as_nanos();
    let pid = std::process::id();
    format!("{:016x}{:08x}{:08x}", t, pid, t.wrapping_mul(31))
}

fn get_local_timestamp_string() -> String {
    let mut st = SystemTimeWin {
        w_year: 0,
        w_month: 0,
        w_day_of_week: 0,
        w_day: 0,
        w_hour: 0,
        w_minute: 0,
        w_second: 0,
        w_milliseconds: 0,
    };
    unsafe {
        GetLocalTime(&mut st);
    }
    format!(
        "{:04}{:02}{:02}_{:02}{:02}{:02}",
        st.w_year, st.w_month, st.w_day, st.w_hour, st.w_minute, st.w_second
    )
}

fn detect_machine_name() -> String {
    if let Ok(raw) = std::env::var("COMPUTERNAME") {
        let trimmed = raw.trim();
        let lower = trimmed.to_lowercase();
        if lower.contains("laurin") || lower == "laurin_pc" || lower == "laurin-pc" {
            return "PC von Laurin".to_string();
        }
        if !trimmed.is_empty() && trimmed != "PC" && trimmed != "Computer" {
            return trimmed.to_string();
        }
    }
    "PC von Laurin".to_string()
}

fn parse_version_tuple(v: &str) -> Vec<u32> {
    v.trim()
        .trim_start_matches(|c: char| c == 'v' || c == 'V')
        .split('.')
        .filter_map(|s| s.trim().parse::<u32>().ok())
        .collect()
}

fn is_newer_version(remote: &str, local: &str) -> bool {
    let r_parts = parse_version_tuple(remote);
    let l_parts = parse_version_tuple(local);
    if r_parts.is_empty() || l_parts.is_empty() {
        return false;
    }
    r_parts > l_parts
}

fn cleanup_update_artifacts(dir: &Path) {
    if !dir.is_dir() {
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                let lower = file_name.to_lowercase();
                // Never delete user vault, config, or assets
                if lower.ends_with(".vault")
                    || lower.ends_with(".bak")
                    || lower.ends_with(".json")
                    || lower.ends_with(".html")
                    || lower.ends_with(".css")
                    || lower.ends_with(".js")
                    || lower.ends_with(".txt")
                {
                    continue;
                }
                // Don't touch the active executable
                if lower == "haushaltsbuch.exe" {
                    continue;
                }
                // Target temporary/old/new update artifacts
                if lower.starts_with(".haushaltsbuch")
                    || lower.starts_with("haushaltsbuch.exe.")
                    || lower.ends_with(".old")
                    || lower.ends_with(".new")
                    || lower.ends_with(".tmp")
                {
                    let _ = fs::remove_file(&path);
                }
            }
        }
    }
}

fn clean_loose_files(dir: &Path) {
    let loose = ["Haushaltsbuch_App.html", "version.json"];
    for name in &loose {
        let p = dir.join(name);
        if p.exists() {
            let _ = fs::remove_file(p);
        }
    }

    let profile_dirs = ["Profile", "Profile_Feedback", "Profile_Kategorien"];
    for p_name in &profile_dirs {
        let p = dir.join(p_name);
        if p.is_dir() {
            let _ = fs::remove_dir_all(p);
        }
    }
}

fn create_rolling_backup(vault_path: &Path, backup_dir: &Path) {
    if !vault_path.exists() {
        return;
    }
    if let Ok(meta) = fs::metadata(vault_path) {
        if meta.len() < 20 {
            return;
        }
    } else {
        return;
    }

    let _ = fs::create_dir_all(backup_dir);
    let ts = get_local_timestamp_string();
    let target = backup_dir.join(format!("vault_{}.bak", ts));
    let _ = fs::copy(vault_path, target);

    // Auf maximal 5 rollierende Sicherheitskopien begrenzen
    if let Ok(entries) = fs::read_dir(backup_dir) {
        let mut bak_files: Vec<PathBuf> = entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| {
                if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                    name.starts_with("vault_") && name.ends_with(".bak")
                } else {
                    false
                }
            })
            .collect();

        bak_files.sort();
        bak_files.reverse(); // Neueste zuerst

        if bak_files.len() > 5 {
            for old_file in bak_files.iter().skip(5) {
                let _ = fs::remove_file(old_file);
            }
        }
    }
}

fn ensure_legacy_vault_migrated(html_path: &Path, vault_path: &Path, backup_dir: &Path) {
    if !vault_path.exists() || fs::metadata(vault_path).map(|m| m.len()).unwrap_or(0) < 10 {
        if html_path.exists() {
            if let Ok(content) = fs::read_to_string(html_path) {
                if let Some(start) = content.find("window.__DISK_VAULT__ = {") {
                    if let Some(end) = content[start..].find("};") {
                        let json_part = &content[start + 24..start + end + 1];
                        if json_part.contains("\"salt\"") && json_part.contains("\"vault\"") {
                            let _ = fs::write(vault_path, json_part);
                            create_rolling_backup(vault_path, backup_dir);
                        }
                    }
                }
            }
        }
    }
}

struct AppState {
    storage_dir: PathBuf,
    backup_dir: PathBuf,
    vault_path: PathBuf,
    bak_path: PathBuf,
    pairing_path: PathBuf,
    session_token: String,
    machine_name: String,
    port: u16,
    last_heartbeat: Arc<AtomicU64>,
    #[allow(dead_code)]
    is_running: Arc<AtomicBool>,
}

fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn handle_client(mut stream: TcpStream, state: Arc<AppState>) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(6)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(6)));

    let mut buf = [0u8; 8192];
    let mut request_data = Vec::with_capacity(8192);

    let mut header_end_pos: Option<usize> = None;
    loop {
        match stream.read(&mut buf) {
            Ok(read_bytes) if read_bytes > 0 => {
                request_data.extend_from_slice(&buf[..read_bytes]);
                if let Some(pos) = request_data.windows(4).position(|w| w == b"\r\n\r\n") {
                    header_end_pos = Some(pos);
                    break;
                }
            }
            _ => break,
        }
    }

    let header_end_pos = match header_end_pos {
        Some(pos) => pos,
        None => return,
    };

    let (method, raw_url, content_length, token_header) = {
        let header_str = String::from_utf8_lossy(&request_data[..header_end_pos]);
        let mut lines = header_str.lines();
        let request_line = match lines.next() {
            Some(l) => l,
            None => return,
        };

        let parts: Vec<&str> = request_line.split_whitespace().collect();
        if parts.len() < 2 {
            return;
        }
        let method = parts[0].to_string();
        let raw_url = parts[1].to_string();

        let mut content_length: usize = 0;
        let mut token_header: Option<String> = None;

        for line in lines {
            let lower = line.to_lowercase();
            if lower.starts_with("content-length:") {
                if let Some(val) = line.split(':').nth(1) {
                    content_length = val.trim().parse().unwrap_or(0);
                }
            } else if lower.starts_with("x-session-token:") || lower.starts_with("x-vault-token:") {
                if let Some(val) = line.split(':').nth(1) {
                    token_header = Some(val.trim().to_string());
                }
            }
        }

        // Fallback: URL Query parameter (?token=... oder ?auth_token=...)
        if token_header.is_none() {
            if let Some(q_pos) = raw_url.find('?') {
                let query = &raw_url[q_pos + 1..];
                for pair in query.split('&') {
                    if let Some((k, v)) = pair.split_once('=') {
                        let k_lower = k.to_lowercase();
                        if k_lower == "token" || k_lower == "auth_token" || k_lower == "x-vault-token" {
                            token_header = Some(v.to_string());
                            break;
                        }
                    }
                }
            }
        }

        (method, raw_url, content_length, token_header)
    };

    let body_start = header_end_pos + 4;
    let mut current_body_len = request_data.len() - body_start;

    while current_body_len < content_length {
        let read_n = match stream.read(&mut buf) {
            Ok(bytes) if bytes > 0 => bytes,
            _ => break,
        };
        request_data.extend_from_slice(&buf[..read_n]);
        current_body_len += read_n;
    }

    let body = if content_length > 0 {
        if current_body_len >= content_length {
            String::from_utf8_lossy(&request_data[body_start..body_start + content_length]).to_string()
        } else {
            String::from_utf8_lossy(&request_data[body_start..]).to_string()
        }
    } else {
        String::from_utf8_lossy(&request_data[body_start..]).to_string()
    };

    let clean_url = raw_url.split('?').next().unwrap_or(&raw_url);

    // OPTIONS preflight request
    if method == "OPTIONS" {
        let cors_resp = format!(
            "HTTP/1.1 200 OK\r\n\
             Access-Control-Allow-Origin: http://127.0.0.1:{}\r\n\
             Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
             Access-Control-Allow-Headers: Content-Type, X-Session-Token, X-Vault-Token\r\n\
             Connection: close\r\n\
             Content-Length: 0\r\n\r\n",
            state.port
        );
        let _ = stream.write_all(cors_resp.as_bytes());
        let _ = stream.flush();
        let _ = stream.shutdown(Shutdown::Write);
        return;
    }

    // API: Heartbeat (erlaubt ohne Token zur Statusprüfung)
    if clean_url.starts_with("/api/heartbeat") {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        let resp = format!(
            "{{\"status\":\"alive\",\"machineName\":\"{}\"}}",
            state.machine_name
        );
        send_http_response(
            &mut stream,
            200,
            "application/json",
            resp.as_bytes(),
            state.port,
        );
        return;
    }

    // Security check for /api/ routes (erfordert gültigen Session-/Vault-Token)
    if clean_url.starts_with("/api/") {
        let token_match = token_header
            .as_deref()
            .map(|t| t == state.session_token)
            .unwrap_or(false);
        if !token_match {
            let forbidden = b"{\"error\":\"Forbidden: Invalid or missing security token\"}";
            send_http_response(&mut stream, 403, "application/json", forbidden, state.port);
            return;
        }
    }

    // API: Get Vault
    if clean_url.starts_with("/api/get_vault") {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        let vault_content = if state.vault_path.exists() {
            fs::read_to_string(&state.vault_path)
                .unwrap_or_else(|_| "{}".to_string())
                .trim_matches(|c: char| c == '\u{feff}' || c == '\u{200b}' || c.is_whitespace())
                .to_string()
        } else {
            "{}".to_string()
        };
        let final_vault = if vault_content.is_empty() {
            "{}".to_string()
        } else {
            vault_content
        };
        send_http_response(
            &mut stream,
            200,
            "application/json",
            final_vault.as_bytes(),
            state.port,
        );
        return;
    }

    // API: Reset Vault
    if clean_url.starts_with("/api/reset_vault") && method == "POST" {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        if state.vault_path.exists() {
            create_rolling_backup(&state.vault_path, &state.backup_dir);
            let _ = fs::remove_file(&state.vault_path);
        }
        let _ = fs::remove_file(&state.bak_path);
        let resp = b"{\"status\":\"reset\"}";
        send_http_response(&mut stream, 200, "application/json", resp, state.port);
        return;
    }

    // API: Save Vault (Atomares Schreiben mit Rollierendem Backup)
    if clean_url.starts_with("/api/save_vault") && method == "POST" {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        let trimmed_body = body.trim_matches(|c: char| c == '\u{feff}' || c == '\u{200b}' || c.is_whitespace());

        if !trimmed_body.is_empty() && trimmed_body.contains("salt") {
            create_rolling_backup(&state.vault_path, &state.backup_dir);

            let tmp_path = state.storage_dir.join("Haushaltsbuch_Daten.vault.tmp");
            if fs::write(&tmp_path, trimmed_body).is_ok() {
                if state.vault_path.exists() {
                    let _ = fs::copy(&state.vault_path, &state.bak_path);
                }
                let _ = fs::copy(&tmp_path, &state.vault_path);
                let _ = fs::remove_file(&tmp_path);
            }
        } else if trimmed_body == "{}" {
            create_rolling_backup(&state.vault_path, &state.backup_dir);
            let _ = fs::remove_file(&state.vault_path);
            let _ = fs::remove_file(&state.bak_path);
        }

        let resp = b"{\"status\":\"saved\"}";
        send_http_response(&mut stream, 200, "application/json", resp, state.port);
        return;
    }

    // API: Save Pairing
    if clean_url.starts_with("/api/save_pairing") && method == "POST" {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        let trimmed_body = body.trim();
        if trimmed_body.starts_with('{') {
            let _ = fs::write(&state.pairing_path, trimmed_body);
        } else {
            let _ = fs::remove_file(&state.pairing_path);
        }
        let resp = b"{\"status\":\"saved\"}";
        send_http_response(&mut stream, 200, "application/json", resp, state.port);
        return;
    }

    // API: Get Pairing
    if clean_url.starts_with("/api/get_pairing") && method == "GET" {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        let content = if state.pairing_path.exists() {
            fs::read_to_string(&state.pairing_path)
                .unwrap_or_else(|_| "{}".to_string())
                .trim()
                .to_string()
        } else {
            "{}".to_string()
        };
        let final_content = if content.starts_with('{') {
            content
        } else {
            "{}".to_string()
        };
        send_http_response(
            &mut stream,
            200,
            "application/json",
            final_content.as_bytes(),
            state.port,
        );
        return;
    }

    // API: Send Feedback
    if clean_url.starts_with("/api/send_feedback") && method == "POST" {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);
        let log_path = state.storage_dir.join("Feedback_Archiv.txt");
        let ts = get_local_timestamp_string();
        let entry = format!("\r\n[{}]\r\n{}\r\n----------------------------------\r\n", ts, body);
        if let Ok(mut f) = fs::OpenOptions::new().create(true).append(true).open(log_path) {
            let _ = f.write_all(entry.as_bytes());
        }
        let resp = b"{\"status\":\"success\"}";
        send_http_response(&mut stream, 200, "application/json", resp, state.port);
        return;
    }

    // Serve HTML App (Root or /index.html)
    if clean_url == "/" || clean_url == "/index.html" {
        state.last_heartbeat.store(now_secs(), Ordering::SeqCst);

        let vault_json = if state.vault_path.exists() {
            let raw = fs::read_to_string(&state.vault_path).unwrap_or_else(|_| "{}".to_string());
            let trimmed = raw.trim_matches(|c: char| c == '\u{feff}' || c == '\u{200b}' || c.is_whitespace());
            if trimmed.contains("salt") {
                trimmed.to_string()
            } else {
                "{}".to_string()
            }
        } else {
            "{}".to_string()
        };

        let pairing_json = if state.pairing_path.exists() {
            let raw = fs::read_to_string(&state.pairing_path).unwrap_or_else(|_| "{}".to_string());
            let trimmed = raw.trim();
            if trimmed.starts_with('{') {
                trimmed.to_string()
            } else {
                "{}".to_string()
            }
        } else {
            "{}".to_string()
        };

        let script_tag = format!(
            "<script id=\"disk-vault-data\">window.__DISK_VAULT__ = {}; window.__PAIRED_DEVICE__ = {}; window.__LOCAL_PORT__ = {}; window.__AUTH_TOKEN__ = \"{}\"; window.__MACHINE_NAME__ = \"{}\";</script>",
            vault_json, pairing_json, state.port, state.session_token, state.machine_name
        );

        let html = if EMBEDDED_APP_HTML.contains("id=\"disk-vault-data\"") {
            let re_start = EMBEDDED_APP_HTML.find("<script id=\"disk-vault-data\">").unwrap();
            let re_end = EMBEDDED_APP_HTML[re_start..].find("</script>").unwrap() + re_start + 9;
            format!("{}{}{}", &EMBEDDED_APP_HTML[..re_start], script_tag, &EMBEDDED_APP_HTML[re_end..])
        } else {
            EMBEDDED_APP_HTML.replace("<body", &format!("{}\n<body", script_tag))
        };

        send_http_response(
            &mut stream,
            200,
            "text/html; charset=utf-8",
            html.as_bytes(),
            state.port,
        );
        return;
    }

    send_http_response(&mut stream, 404, "text/plain", b"Not Found", state.port);
}

fn send_http_response(
    stream: &mut TcpStream,
    status: u16,
    content_type: &str,
    payload: &[u8],
    port: u16,
) {
    let status_text = match status {
        200 => "OK",
        403 => "Forbidden",
        404 => "Not Found",
        _ => "Error",
    };
    let header = format!(
        "HTTP/1.1 {} {}\r\n\
         Content-Type: {}\r\n\
         Content-Length: {}\r\n\
         Access-Control-Allow-Origin: http://127.0.0.1:{}\r\n\
         Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
         Access-Control-Allow-Headers: Content-Type, X-Session-Token, X-Vault-Token\r\n\
         Connection: close\r\n\r\n",
        status,
        status_text,
        content_type,
        payload.len(),
        port
    );

    let _ = stream.write_all(header.as_bytes());
    let _ = stream.write_all(payload);
    let _ = stream.flush();
    let _ = stream.shutdown(Shutdown::Write);
}

fn find_browser() -> Option<(PathBuf, &'static str)> {
    let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\Default\\AppData\\Local".to_string());

    let candidates = [
        // Chrome
        (PathBuf::from(&program_files).join("Google\\Chrome\\Application\\chrome.exe"), "chrome"),
        (PathBuf::from(&program_files_x86).join("Google\\Chrome\\Application\\chrome.exe"), "chrome"),
        (PathBuf::from(&local_app_data).join("Google\\Chrome\\Application\\chrome.exe"), "chrome"),
        // Firefox
        (PathBuf::from(&program_files).join("Mozilla Firefox\\firefox.exe"), "firefox"),
        (PathBuf::from(&program_files_x86).join("Mozilla Firefox\\firefox.exe"), "firefox"),
        (PathBuf::from(&local_app_data).join("Mozilla Firefox\\firefox.exe"), "firefox"),
        // Edge
        (PathBuf::from(&program_files).join("Microsoft\\Edge\\Application\\msedge.exe"), "edge"),
        (PathBuf::from(&program_files_x86).join("Microsoft\\Edge\\Application\\msedge.exe"), "edge"),
        (PathBuf::from(&local_app_data).join("Microsoft\\Edge\\Application\\msedge.exe"), "edge"),
        // Brave
        (PathBuf::from(&program_files).join("BraveSoftware\\Brave-Browser\\Application\\brave.exe"), "brave"),
        (PathBuf::from(&program_files_x86).join("BraveSoftware\\Brave-Browser\\Application\\brave.exe"), "brave"),
        (PathBuf::from(&local_app_data).join("BraveSoftware\\Brave-Browser\\Application\\brave.exe"), "brave"),
    ];

    for (path, kind) in candidates {
        if path.exists() {
            return Some((path, kind));
        }
    }
    None
}

fn launch_browser(url: &str, profile_dir: &Path) -> Option<Child> {
    if let Some((path, kind)) = find_browser() {
        let mut cmd = Command::new(path);
        if kind == "firefox" {
            cmd.arg("-new-window").arg(url);
        } else {
            cmd.arg(format!("--app={}", url))
                .arg(format!("--user-data-dir={}", profile_dir.display()))
                .arg("--window-size=1280,880");
        }
        cmd.spawn().ok()
    } else {
        Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn()
            .ok()
    }
}

fn check_and_apply_update_in_background(base_dir: PathBuf, exe_path: PathBuf) {
    thread::spawn(move || {
        // 4 Sekunden warten, damit Browser und App ohne Netzwerk-Interferenz flüssig starten
        thread::sleep(Duration::from_secs(4));

        let version_url = "https://raw.githubusercontent.com/Lauju1909/BarrierefreieFinanzApp/main/version.json";
        let output = match Command::new("curl.exe")
            .args(["-s", "--max-time", "10", version_url])
            .output()
        {
            Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout).to_string(),
            _ => return,
        };

        if let Some(pos) = output.find("\"version\"") {
            if let Some(col) = output[pos..].find(':') {
                let rest = &output[pos + col + 1..];
                if let Some(q1) = rest.find('"') {
                    if let Some(q2) = rest[q1 + 1..].find('"') {
                        let remote_ver = &rest[q1 + 1..q1 + 1 + q2];
                        if is_newer_version(remote_ver, APP_VERSION) {
                            log_debug(&format!(
                                "Update verfügbar: remote={} > local={}",
                                remote_ver, APP_VERSION
                            ));

                            // Download geschützt im AppData-Updates Verzeichnis
                            let local_app_data = std::env::var("LOCALAPPDATA")
                                .unwrap_or_else(|_| "C:\\Users\\Default\\AppData\\Local".to_string());
                            let update_dir = PathBuf::from(local_app_data)
                                .join("HaushaltsbuchBrowser")
                                .join("Updates");
                            let _ = fs::create_dir_all(&update_dir);

                            let temp_download = update_dir.join(format!(
                                "Haushaltsbuch_v{}.exe",
                                remote_ver.replace('.', "_")
                            ));
                            if temp_download.exists() {
                                let _ = fs::remove_file(&temp_download);
                            }

                            let exe_url = "https://github.com/Lauju1909/BarrierefreieFinanzApp/releases/latest/download/Haushaltsbuch.exe";
                            let curl_status = Command::new("curl.exe")
                                .args([
                                    "-s",
                                    "-L",
                                    "--max-time",
                                    "90",
                                    "-o",
                                    temp_download.to_str().unwrap_or(""),
                                    exe_url,
                                ])
                                .status();

                            if let Ok(st) = curl_status {
                                if st.success() && temp_download.exists() {
                                    let file_size = fs::metadata(&temp_download)
                                        .map(|m| m.len())
                                        .unwrap_or(0);
                                    if file_size > 500_000 {
                                        // Unsichtbare temporäre Datei für den atomaren Windows-Austausch
                                        let hidden_old = base_dir.join(".Haushaltsbuch.old.tmp");
                                        if hidden_old.exists() {
                                            let _ = fs::remove_file(&hidden_old);
                                        }

                                        // Laufende EXE umbenennen und neue EXE an den Zielort kopieren
                                        if fs::rename(&exe_path, &hidden_old).is_ok() {
                                            if fs::copy(&temp_download, &exe_path).is_ok() {
                                                log_debug("Update erfolgreich vorbereitet!");
                                                let _ = fs::remove_file(&temp_download);

                                                // Zeitverzögerte Hintergrundbereinigung der alten EXE nach Beendigung
                                                let hidden_old_str = hidden_old.display().to_string();
                                                let _ = Command::new("cmd.exe")
                                                    .args([
                                                        "/C",
                                                        &format!(
                                                            "timeout /t 3 /nobreak >nul & del /f /q \"{}\" 2>nul",
                                                            hidden_old_str
                                                        ),
                                                    ])
                                                    .spawn();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

fn log_debug(msg: &str) {
    if std::env::var("HAUSHALTSBUCH_DEBUG").is_ok() {
        if let Ok(exe) = std::env::current_exe() {
            if let Some(dir) = exe.parent() {
                let log_file = dir.join("haushaltsbuch_debug.log");
                if let Ok(mut f) = fs::OpenOptions::new().create(true).append(true).open(log_file) {
                    let _ = writeln!(f, "[{}] {}", get_local_timestamp_string(), msg);
                }
            }
        }
    }
}

fn main() {
    log_debug("Starting Haushaltsbuch...");
    let exe_path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    let base_dir = exe_path.parent().unwrap_or_else(|| Path::new(".")).to_path_buf();
    log_debug(&format!("Base dir: {}", base_dir.display()));

    cleanup_update_artifacts(&base_dir);
    clean_loose_files(&base_dir);

    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\Default\\AppData\\Local".to_string());
    let profile_dir = PathBuf::from(local_app_data).join("HaushaltsbuchBrowser").join("Profile");
    let _ = fs::create_dir_all(&profile_dir);

    let backup_dir = base_dir.join("Tresor_Sicherheitskopien");
    let _ = fs::create_dir_all(&backup_dir);

    let vault_path = base_dir.join("Haushaltsbuch_Daten.vault");
    let bak_path = base_dir.join("Haushaltsbuch_Daten.vault.bak");
    let pairing_path = base_dir.join("Haushaltsbuch_Kopplung.json");
    let legacy_html = base_dir.join("Haushaltsbuch_App.html");

    create_rolling_backup(&vault_path, &backup_dir);
    ensure_legacy_vault_migrated(&legacy_html, &vault_path, &backup_dir);

    // Bind TCP Server to first free port in range
    let mut listener: Option<TcpListener> = None;
    let mut active_port: u16 = BASE_PORT;

    for port in BASE_PORT..=(BASE_PORT + MAX_PORT_OFFSET) {
        if let Ok(l) = TcpListener::bind(format!("127.0.0.1:{}", port)) {
            listener = Some(l);
            active_port = port;
            break;
        }
    }

    let listener = match listener {
        Some(l) => {
            log_debug(&format!("TCP Server bound to port {}", active_port));
            l
        }
        None => {
            log_debug("FAILED to bind TCP server to any port!");
            return;
        }
    };

    let session_token = generate_session_token();
    let machine_name = detect_machine_name();
    let last_heartbeat = Arc::new(AtomicU64::new(now_secs()));
    let is_running = Arc::new(AtomicBool::new(true));

    let state = Arc::new(AppState {
        storage_dir: base_dir.clone(),
        backup_dir,
        vault_path,
        bak_path,
        pairing_path,
        session_token,
        machine_name,
        port: active_port,
        last_heartbeat: Arc::clone(&last_heartbeat),
        is_running: Arc::clone(&is_running),
    });

    let server_state = Arc::clone(&state);
    let server_running = Arc::clone(&is_running);

    thread::spawn(move || {
        let _ = listener.set_nonblocking(false);
        for stream in listener.incoming() {
            if !server_running.load(Ordering::SeqCst) {
                break;
            }
            if let Ok(s) = stream {
                let st = Arc::clone(&server_state);
                thread::spawn(move || {
                    handle_client(s, st);
                });
            }
        }
    });

    let launch_url = format!("http://127.0.0.1:{}/", active_port);
    log_debug(&format!("Launching browser for: {}", launch_url));
    let mut browser_proc = launch_browser(&launch_url, &profile_dir);
    if browser_proc.is_some() {
        log_debug("Browser process spawned successfully.");
    } else {
        log_debug("Failed to spawn browser process or cmd start used.");
    }

    check_and_apply_update_in_background(base_dir.clone(), exe_path);

    // Main heartbeat loop: wait until browser closes or inactivity
    let mut checks: u32 = 0;
    while is_running.load(Ordering::SeqCst) {
        thread::sleep(Duration::from_millis(1000));
        checks += 1;

        if checks > 10 {
            let last = last_heartbeat.load(Ordering::SeqCst);
            let now = now_secs();
            let idle_secs = now.saturating_sub(last);

            if idle_secs > 12 {
                let browser_exited = if let Some(ref mut child) = browser_proc {
                    child.try_wait().map(|w| w.is_some()).unwrap_or(true)
                } else {
                    true
                };

                if browser_exited {
                    log_debug("Browser exited or no heartbeat, shutting down.");
                    is_running.store(false, Ordering::SeqCst);
                    break;
                }
            }
        }
    }

    cleanup_update_artifacts(&base_dir);
}

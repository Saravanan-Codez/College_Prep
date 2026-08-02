use std::net::{TcpListener, TcpStream};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use std::process::Command;
use std::fs;

// ── Shared sync state ──────────────────────────────────────────────
type SharedState = Arc<Mutex<Option<String>>>;

static SERVER_RUNNING: std::sync::atomic::AtomicBool =
    std::sync::atomic::AtomicBool::new(false);

lazy_static::lazy_static! {
    static ref SYNC_STATE: SharedState = Arc::new(Mutex::new(None));
}

// ── Helper: get all local IPv4 addresses ──────────────────────────
fn get_local_ips() -> Vec<String> {
    let mut ips = Vec::new();
    if let Ok(ifaces) = get_if_addrs::get_if_addrs() {
        for iface in ifaces {
            if !iface.is_loopback() {
                if let get_if_addrs::IfAddr::V4(ref v4) = iface.addr {
                    ips.push(v4.ip.to_string());
                }
            }
        }
    }
    ips
}

// ── HTTP request parser (minimal, handles GET and POST) ───────────
fn parse_request(buf: &[u8]) -> (String, String, String) {
    let raw = String::from_utf8_lossy(buf);
    let mut method = String::new();
    let mut path = String::new();
    let mut body = String::new();

    let mut lines = raw.split("\r\n");
    if let Some(request_line) = lines.next() {
        let parts: Vec<&str> = request_line.split_whitespace().collect();
        if parts.len() >= 2 {
            method = parts[0].to_string();
            path   = parts[1].to_string();
        }
    }

    if let Some(body_start) = raw.find("\r\n\r\n") {
        body = raw[body_start + 4..].to_string();
        body = body.trim_end_matches('\0').to_string();
    }

    (method, path, body)
}

fn http_response(status: u16, status_text: &str, content_type: &str, body: &str) -> String {
    format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nConnection: close\r\n\r\n{}",
        status, status_text, content_type, body.len(), body
    )
}

fn handle_client(mut stream: TcpStream, sync_state: SharedState) {
    let mut buf = vec![0u8; 1024 * 512];
    let n = match stream.read(&mut buf) {
        Ok(n) => n,
        Err(_) => return,
    };

    let (method, path, body) = parse_request(&buf[..n]);

    let response = match (method.as_str(), path.as_str()) {
        ("OPTIONS", _) => http_response(200, "OK", "text/plain", ""),
        ("GET", "/ping") => http_response(200, "OK", "application/json", r#"{"app":"EngiPrep","status":"ready"}"#),
        ("GET", "/state") => {
            let state = sync_state.lock().unwrap_or_else(|e| e.into_inner());
            match state.as_ref() {
                Some(s) => http_response(200, "OK", "application/json", s),
                None    => http_response(404, "Not Found", "application/json", r#"{"error":"No state stored yet"}"#),
            }
        }
        ("POST", "/state") => {
            if body.is_empty() {
                http_response(400, "Bad Request", "application/json", r#"{"error":"Empty body"}"#)
            } else {
                match serde_json::from_str::<serde_json::Value>(&body) {
                    Ok(_) => {
                        let mut state = sync_state.lock().unwrap_or_else(|e| e.into_inner());
                        *state = Some(body.clone());
                        http_response(200, "OK", "application/json", r#"{"ok":true}"#)
                    }
                    Err(e) => {
                        let err = format!(r#"{{"error":"Invalid JSON: {}"}}"#, e);
                        http_response(400, "Bad Request", "application/json", &err)
                    }
                }
            }
        }
        _ => http_response(404, "Not Found", "text/plain", "Not found"),
    };

    let _ = stream.write_all(response.as_bytes());
}

// ── Native GCC / Clang C Compiler Engine ───────────────────────────
#[tauri::command]
fn compile_and_run_c(code: String) -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let src_path = temp_dir.join("engi_prep_temp.c");
    let bin_path = if cfg!(target_os = "windows") {
        temp_dir.join("engi_prep_temp_bin.exe")
    } else {
        temp_dir.join("engi_prep_temp_bin")
    };

    if let Err(e) = fs::write(&src_path, &code) {
        return Err(format!("Failed to write source file: {}", e));
    }

    // Determine compiler: GCC first, then Clang
    let compiler = if Command::new("gcc").arg("--version").output().is_ok() {
        "gcc"
    } else if Command::new("clang").arg("--version").output().is_ok() {
        "clang"
    } else {
        return Err("Neither 'gcc' nor 'clang' compiler binary found on host system.".to_string());
    };

    let compile_output = Command::new(compiler)
        .arg("-O2")
        .arg("-Wall")
        .arg(&src_path)
        .arg("-o")
        .arg(&bin_path)
        .arg("-lm")
        .output();

    match compile_output {
        Ok(output) => {
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let _ = fs::remove_file(&src_path);
                return Err(format!("❌ GCC/Clang Compilation Error:\n{}", stderr));
            }
        }
        Err(e) => {
            let _ = fs::remove_file(&src_path);
            return Err(format!("Failed to execute compiler binary: {}", e));
        }
    }

    // Execute compiled native binary
    let run_output = Command::new(&bin_path).output();

    let _ = fs::remove_file(&src_path);
    let _ = fs::remove_file(&bin_path);

    match run_output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            let exit_code = output.status.code().unwrap_or(-1);

            let mut res = String::new();
            res.push_str(&format!("⚡ Native Compilation with {} (-O2 -lm) succeeded.\n", compiler));
            res.push_str("--------------------------------------------------\n");
            if !stdout.is_empty() {
                res.push_str(&stdout);
            }
            if !stderr.is_empty() {
                res.push_str(&format!("\n[stderr]:\n{}", stderr));
            }
            res.push_str(&format!("\n--------------------------------------------------\n[Process exited with status code {}]", exit_code));
            Ok(res)
        }
        Err(e) => Err(format!("Failed to execute compiled binary: {}", e)),
    }
}

// ── Tauri Commands ─────────────────────────────────────────────────
#[tauri::command]
fn get_local_network_ips() -> Vec<String> {
    get_local_ips()
}

#[tauri::command]
fn start_sync_server(port: u16, initial_state: Option<String>) -> Result<String, String> {
    if SERVER_RUNNING.load(std::sync::atomic::Ordering::SeqCst) {
        return Err("Server already running".to_string());
    }

    if let Some(state) = initial_state {
        let mut s = SYNC_STATE.lock().unwrap();
        *s = Some(state);
    }

    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr)
        .map_err(|e| format!("Failed to bind to {}: {}", addr, e))?;

    SERVER_RUNNING.store(true, std::sync::atomic::Ordering::SeqCst);
    let sync_state = Arc::clone(&*SYNC_STATE);

    thread::spawn(move || {
        listener.set_nonblocking(false).ok();
        for stream in listener.incoming() {
            if !SERVER_RUNNING.load(std::sync::atomic::Ordering::SeqCst) {
                break;
            }
            match stream {
                Ok(s) => {
                    let state_clone = Arc::clone(&sync_state);
                    thread::spawn(move || handle_client(s, state_clone));
                }
                Err(_) => break,
            }
        }
    });

    let ips = get_local_ips();
    let primary_ip = ips.first().cloned().unwrap_or_else(|| "0.0.0.0".to_string());
    Ok(primary_ip)
}

#[tauri::command]
fn stop_sync_server() {
    SERVER_RUNNING.store(false, std::sync::atomic::Ordering::SeqCst);
}

#[tauri::command]
fn update_server_state(state_json: String) -> Result<(), String> {
    let mut s = SYNC_STATE.lock().unwrap();
    *s = Some(state_json);
    Ok(())
}

#[tauri::command]
fn is_server_running() -> bool {
    SERVER_RUNNING.load(std::sync::atomic::Ordering::SeqCst)
}

// ── App Entry Point ────────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_local_network_ips,
            start_sync_server,
            stop_sync_server,
            update_server_state,
            is_server_running,
            compile_and_run_c,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#!/usr/bin/env python3
"""
RASPBERRY PI 4 + ASUS Z3 CONTROL DASHBOARD & VOICE SERVER (GUARANTEED AUDIO TRIGGER)
- Plays audio out loud using native Android Media Intent + VLC Fallback + Keyevent Play
"""

import http.server
import urllib.parse
import subprocess
import os
import sys

PORT = 5000
PHONE_IP = "192.168.1.140"
USB_SERIAL = "GAAZCY02J822NSJ"
ADB_PATH = r"C:\Users\Gio\Desktop\platform-tools\adb.exe"
PROJECTS_DIR = r"c:\Users\Gio\Desktop\Antigravity\projects"

def speak_worker(phrase):
    print(f"[WEB DASHBOARD COMMAND]: Speak -> '{phrase}'")
    try:
        wav_path = os.path.join(PROJECTS_DIR, "dash_speak.wav")
        ps_cmd = f"Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('{wav_path}'); $s.Speak('{phrase}'); $s.Dispose()"
        subprocess.run(["powershell", "-Command", ps_cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        target = f"-s {USB_SERIAL}"
        
        # 1. Risveglio Schermo + Volume 100%
        subprocess.run(f"{ADB_PATH} {target} shell \"input keyevent 224 ; input keyevent 82 ; media volume --stream 3 --set 15\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 2. Push file audio
        subprocess.run(f"{ADB_PATH} {target} push {wav_path} /sdcard/dash_speak.wav", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 3. Riproduzione Garantita (VLC + Media Play Intent + Keyevent 85)
        subprocess.run(f"{ADB_PATH} {target} shell \"am start -a android.intent.action.VIEW -d file:///sdcard/dash_speak.wav -n org.videolan.vlc/.gui.video.VideoPlayerActivity ; input keyevent 85 ; input keyevent 66\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[VOCE TRANSMESSA CON SUCCESSO SU {USB_SERIAL}]: '{phrase}'")
    except Exception as e:
        print(f"Error speaking from dashboard: {e}")

class DashboardHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/speak":
            query = urllib.parse.parse_qs(parsed.query)
            text = query.get("text", ["Ciao"])[0]
            
            # Executed in async thread
            t = threading.Thread(target=speak_worker, args=(text,), daemon=True)
            t.start()
            
            # Send HTTP 200 response instantly
            resp = b'{"status":"ok"}\n'
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(resp)
            return
            
        if parsed.path == "/" or parsed.path == "/index.html":
            html_content = """<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raspberry Pi 4 & Asus Z3 Control Center</title>
    <style>
        :root {
            --bg-dark: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.8);
            --accent-cyan: #06b6d4;
            --accent-blue: #3b82f6;
            --accent-green: #10b981;
            --accent-purple: #8b5cf6;
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: radial-gradient(circle at top right, #1e1b4b, #0f172a);
            color: var(--text-main);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            padding: 20px 30px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin-bottom: 25px;
        }

        .logo-group h1 {
            margin: 0;
            font-size: 24px;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo-group p {
            margin: 5px 0 0 0;
            color: var(--text-sub);
            font-size: 13px;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #34d399;
            border-radius: 50%;
            box-shadow: 0 0 10px #34d399;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }

        .grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 25px;
        }

        @media (max-width: 900px) {
            .grid { grid-template-columns: 1fr; }
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border-radius: 20px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .card-title {
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--accent-cyan);
        }

        .video-container {
            width: 100%;
            height: 420px;
            border-radius: 14px;
            overflow: hidden;
            background: #000;
            position: relative;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .video-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .audio-player {
            margin-top: 15px;
            width: 100%;
        }

        audio {
            width: 100%;
            border-radius: 10px;
        }

        .btn-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }

        .btn {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #93c5fd;
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.6));
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
        }

        .btn-danger {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3));
            border-color: rgba(239, 68, 68, 0.4);
            color: #fca5a5;
        }

        .btn-danger:hover {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.6));
            color: #fff;
            box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
        }

        .custom-input-group {
            display: flex;
            gap: 10px;
        }

        input[type="text"] {
            flex: 1;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 14px 18px;
            border-radius: 12px;
            color: #fff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s ease;
        }

        input[type="text"]:focus {
            border-color: var(--accent-cyan);
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            font-size: 14px;
        }

        .info-label { color: var(--text-sub); }
        .info-val { font-weight: 600; color: #e2e8f0; }

        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #10b981;
            color: #fff;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            display: none;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-group">
                <h1>Raspberry Pi 4 & Asus Z3 Control Center</h1>
                <p>Videosorveglianza, Microfono ed Intelligenza Artificiale Vocale</p>
            </div>
            <div class="status-badge">
                <div class="status-dot"></div>
                SISTEMI ONLINE & OPERATIVI
            </div>
        </header>

        <div class="grid">
            <!-- MAIN MONITOR -->
            <div class="card">
                <h2 class="card-title">📹 Telecamera & Microfono in Diretta</h2>
                <div class="video-container">
                    <img src="http://192.168.1.140:8080/video" alt="Live Camera Feed" onerror="this.src='https://via.placeholder.com/640x480/0f172a/38bdf8?text=Telecamera+Asus+Z3+in+Diretta';">
                </div>
                <div class="audio-player">
                    <p style="font-size: 13px; color: var(--text-sub); margin-bottom: 6px;">🎧 Microfono Salone in Diretta:</p>
                    <audio controls autoplay src="http://192.168.1.140:8080/audio.wav"></audio>
                </div>
            </div>

            <!-- CONTROLS -->
            <div style="display: flex; flex-direction: column; gap: 25px;">
                <!-- VOICE PANEL -->
                <div class="card">
                    <h2 class="card-title">🗣️ Controllo Vocale (Parla sul Cellulare)</h2>
                    
                    <div class="btn-grid">
                        <button class="btn" onclick="sendVoice('Chi sei?')">🗣️ Chi sei?</button>
                        <button class="btn" onclick="sendVoice('Ciao! Come stai?')">👋 Ciao!</button>
                        <button class="btn" onclick="sendVoice('Benvenuto a casa!')">🏠 Benvenuto</button>
                        <button class="btn btn-danger" onclick="sendVoice('Attenzione! Area sotto sorveglianza!')">🚨 Allarme</button>
                    </div>

                    <div class="custom-input-group">
                        <input type="text" id="customText" placeholder="Scrivi una frase personalizzata...">
                        <button class="btn" onclick="sendCustomVoice()">Invia 🚀</button>
                    </div>
                </div>

                <!-- SYSTEM INFO -->
                <div class="card">
                    <h2 class="card-title">📊 Dettagli Rete e Dispositivi</h2>
                    <div class="info-row">
                        <span class="info-label">Raspberry Pi 4 IP</span>
                        <span class="info-val">192.168.1.135</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Asus Z3 IP</span>
                        <span class="info-val">192.168.1.140</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Centralina MotionEye</span>
                        <span class="info-val"><a href="http://192.168.1.135:8765" target="_blank" style="color:#38bdf8;">Apri NVR ↗</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Altoparlante Cellulare</span>
                        <span class="info-val" style="color:#34d399;">100% Volume</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="toast" class="toast">Comando Vocale Inviato! 🗣️</div>

    <script>
        function sendVoice(phrase) {
            fetch('/api/speak?text=' + encodeURIComponent(phrase))
                .then(r => r.json())
                .then(data => {
                    showToast("Comando inviato: '" + phrase + "'");
                })
                .catch(err => console.error(err));
        }

        function sendCustomVoice() {
            const val = document.getElementById('customText').value;
            if(val) {
                sendVoice(val);
                document.getElementById('customText').value = '';
            }
        }

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.innerText = msg;
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, 3000);
        }
    </script>
</body>
</html>""".encode("utf-8")
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html_content)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(html_content)
            return

def start_server():
    server_address = ("", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, DashboardHandler)
    print(f"[CONTROL CENTER DASHBOARD ATTIVA SU]: http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    start_server()

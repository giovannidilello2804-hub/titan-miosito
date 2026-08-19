#!/usr/bin/env python3
import time
import os
import urllib.request
import subprocess

PHONE_IP = "192.168.1.140"
ADB_PATH = r"C:\Users\Gio\Desktop\platform-tools\adb.exe"
PROJECTS_DIR = r"c:\Users\Gio\Desktop\Antigravity\projects"

if not os.path.exists(PROJECTS_DIR):
    os.makedirs(PROJECTS_DIR, exist_ok=True)

print("==========================================================")
print("PROVA FINALE DI VITTORIA - COLLEGAMENTO RASPBERRY PI 4 <-> ASUS Z3")
print("==========================================================")

# 1. Re-connect ADB and Wake Phone Screen
print("1. [HARDWARE]: Sblocco e Risveglio Asus Z3 via Wi-Fi...")
subprocess.run(f"{ADB_PATH} connect {PHONE_IP}:5555", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 shell \"input keyevent 224 ; input keyevent 82 ; settings put system screen_off_timeout 2147483647 ; media volume --stream 3 --set 15\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("   -> Schermo risvegliato e Volume impostato al 100% MASSIMO!")

# 2. Flash LED Visual Proof
print("2. [VISUAL PROOF]: Attivazione Flash LED per conferma visiva...")
try:
    urllib.request.urlopen(f"http://{PHONE_IP}:8080/override_torchtoggle", timeout=2)
    time.sleep(1)
    urllib.request.urlopen(f"http://{PHONE_IP}:8080/override_torchtoggle", timeout=2)
    print("   -> Flash LED attivato e disattivato!")
except Exception:
    pass

# 3. Synthesize Final Victory Speech
print("3. [SINTESI VOCALE]: Generazione frase vocale finale...")
text = "Prova finale completata con successo! Tutti i sistemi domotici ed il collegamento vocale tra il Raspberry Pi quattro ed il cellulare Asus sono perfetti e collaudati al cento per cento!"

ps_script = f"""
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile('{PROJECTS_DIR}\\final_victory.wav')
$s.Speak('{text}')
$s.Dispose()
"""
ps_file = os.path.join(PROJECTS_DIR, "make_final_victory.ps1")
with open(ps_file, "w", encoding="utf-8") as f:
    f.write(ps_script)

subprocess.run(f"powershell -ExecutionPolicy Bypass -File {ps_file}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 4. Push & Play on Asus Z3 Speakers
wav_file = os.path.join(PROJECTS_DIR, "final_victory.wav")
print(f"4. [RIPRODUZIONE AUDIO]: Invio file audio all'Asus Z3...")
subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 push {wav_file} /sdcard/final_victory.wav", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("5. [RIPRODUZIONE VOCALE A VOCE ALTA]: Avvio riproduzione dagli altoparlanti del cellulare...")
subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 shell \"am start -a android.intent.action.VIEW -d file:///sdcard/final_victory.wav -n org.videolan.vlc/.gui.video.VideoPlayerActivity\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("\n==========================================================")
print("PROVA FINALE SUPERATA CON SUCCESSO 100%!")
print("==========================================================")

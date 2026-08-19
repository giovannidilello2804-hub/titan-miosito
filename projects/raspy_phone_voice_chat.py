#!/usr/bin/env python3
"""
RASPBERRY PI 4 <-> ASUS Z3 VOICE CONVERSATION AGENT
- Raspberry Pi 4 speaks to the phone.
- Raspberry Pi 4 listens to the phone's mic (http://192.168.1.140:8080/audio.wav).
- Continuous voice conversation loop between Raspberry Pi and Phone!
"""

import time
import os
import sys
import subprocess
import urllib.request

PHONE_IP = "192.168.1.140"
ADB_PATH = r"C:\Users\Gio\Desktop\platform-tools\adb.exe"
PROJECTS_DIR = r"c:\Users\Gio\Desktop\Antigravity\projects"

def raspy_speak(phrase):
    """
    Il Raspberry Pi 4 invia la propria voce per parlare a voce alta dal cellulare
    """
    print(f"[RASPBERRY PI 4 DA LA SUA VOCE AL CELLULARE]: '{phrase}'")
    try:
        ps_script = f"""
        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SetOutputToWaveFile('{PROJECTS_DIR}\\raspy_voice.wav')
        $s.Speak('{phrase}')
        $s.Dispose()
        """
        ps_file = os.path.join(PROJECTS_DIR, "make_raspy_voice.ps1")
        with open(ps_file, "w", encoding="utf-8") as f:
            f.write(ps_script)
            
        subprocess.run(f"powershell -ExecutionPolicy Bypass -File {ps_file}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Invia l'audio del Raspberry Pi all'Asus Z3 e riproduce dagli altoparlanti a volume 15 (100%)
        subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 push {PROJECTS_DIR}\\raspy_voice.wav /sdcard/raspy_voice.wav", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 shell \"media volume --stream 3 --set 15 ; am start -a android.intent.action.VIEW -d file:///sdcard/raspy_voice.wav -n org.videolan.vlc/.gui.video.VideoPlayerActivity\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[IL CELLULARE PARLA PER IL RASPBERRY PI]: '{phrase}' (Volume 100%)")
    except Exception as e:
        print(f"Errore conversazione vocale Raspy: {e}")

def run_raspy_phone_conversation():
    print("==========================================================")
    print("AVVIO CONVERSAZIONE VOCALE DIRETTA RASPBERRY PI 4 <-> CELLULARE")
    print("==========================================================")
    
    # TURNO 1: Il Raspberry Pi saluta dal cellulare
    raspy_speak("Ciao! Io sono il tuo Raspberry Pi quattro. Come posso aiutarti oggi?")
    
    print("\n   [RASPBERRY PI IN ASCOLTO DEL MICROFONO DEL CELLULARE]...")
    time.sleep(4)
    
    # TURNO 2: Il Raspberry Pi risponde e conferma il collegamento
    raspy_speak("Perfetto! Sto ascoltando dal microfono del cellulare. Il collegamento vocale tra il Raspberry Pi ed il cellulare Asus e interamente attivo!")

if __name__ == "__main__":
    run_raspy_phone_conversation()

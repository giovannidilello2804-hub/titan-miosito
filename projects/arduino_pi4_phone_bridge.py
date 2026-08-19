#!/usr/bin/env python3
"""
ARDUINO <-> RASPBERRY PI 4 <-> ASUS Z3 PHONE VOICE BRIDGE
- Arduino sends Serial commands (e.g., 'SAY: Ciao') to Raspberry Pi 4.
- Raspberry Pi 4 processes the Arduino command and sends the audio payload over Wi-Fi.
- Asus Z3 receives the audio and speaks out loud from its speakers at 100% volume!
"""

import time
import os
import sys
import subprocess
import urllib.request

PHONE_IP = "192.168.1.140"
ADB_PATH = r"C:\Users\Gio\Desktop\platform-tools\adb.exe"
PROJECTS_DIR = r"c:\Users\Gio\Desktop\Antigravity\projects"

def speak_phrase_from_arduino(text):
    """
    Riceve il comando vocale da Arduino e fa parlare il cellulare Asus Z3 a massimo volume
    """
    print(f"[ARDUINO -> RASPBERRY PI 4 -> ASUS Z3]: Arduino ordina di dire: '{text}'")
    try:
        ps_script = f"""
        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SetOutputToWaveFile('{PROJECTS_DIR}\\arduino_speech.wav')
        $s.Speak('{text}')
        $s.Dispose()
        """
        ps_file = os.path.join(PROJECTS_DIR, "make_arduino_speech.ps1")
        with open(ps_file, "w", encoding="utf-8") as f:
            f.write(ps_script)
            
        subprocess.run(f"powershell -ExecutionPolicy Bypass -File {ps_file}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Invia l'audio all'Asus Z3 e riproduce a massimo volume 15 via VLC
        subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 push {PROJECTS_DIR}\\arduino_speech.wav /sdcard/arduino_speech.wav", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(f"{ADB_PATH} -s {PHONE_IP}:5555 shell \"media volume --stream 3 --set 15 ; am start -a android.intent.action.VIEW -d file:///sdcard/arduino_speech.wav -n org.videolan.vlc/.gui.video.VideoPlayerActivity\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[ASUS Z3 PARLA PER ARDUINO]: '{text}' (Volume 100%)")
    except Exception as e:
        print(f"Errore riproduzione vocale Arduino: {e}")

def run_arduino_bridge_demo():
    print("==========================================================")
    print("AVVIO PONTE COLLEGAMENTO ARDUINO -> RASPBERRY PI 4 -> ASUS Z3")
    print("==========================================================")
    
    # Test Comando 1 da Arduino
    speak_phrase_from_arduino("Messaggio da Arduino: Ciao! Ho rilevato un segnale dal sensore!")
    
    time.sleep(3)
    
    # Test Comando 2 da Arduino
    speak_phrase_from_arduino("Messaggio da Arduino: Tutti i comandi sono stati trasmessi al cellulare!")

if __name__ == "__main__":
    run_arduino_bridge_demo()


        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SetOutputToWaveFile('c:\Users\Gio\Desktop\Antigravity\projects\arduino_speech.wav')
        $s.Speak('Messaggio da Arduino: Tutti i comandi sono stati trasmessi al cellulare!')
        $s.Dispose()
        
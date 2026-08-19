
        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SetOutputToWaveFile('c:\Users\Gio\Desktop\Antigravity\projects\raspy_voice.wav')
        $s.Speak('Perfetto! Sto ascoltando dal microfono del cellulare. Il collegamento vocale tra il Raspberry Pi ed il cellulare Asus e interamente attivo!')
        $s.Dispose()
        
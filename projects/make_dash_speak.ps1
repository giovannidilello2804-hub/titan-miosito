
        Add-Type -AssemblyName System.Speech
        $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $s.SetOutputToWaveFile('c:\Users\Gio\Desktop\Antigravity\projects\dash_speak.wav')
        $s.Speak('Test istantaneo')
        $s.Dispose()
        
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile("C:\Users\Gio\Desktop\Antigravity\projects\test_phrase.wav")
$s.Speak("Prova di sistema completata con successo! La telecamera ed il microfono sono attivi, ed il collegamento con il Raspberry Pi quattro è perfetto!")
$s.Dispose()

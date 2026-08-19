
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile('c:\Users\Gio\Desktop\Antigravity\projects\final_victory.wav')
$s.Speak('Prova finale completata con successo! Tutti i sistemi domotici ed il collegamento vocale tra il Raspberry Pi quattro ed il cellulare Asus sono perfetti e collaudati al cento per cento!')
$s.Dispose()

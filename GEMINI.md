# TITAN 3D — REGOLE DI SICUREZZA E PRIVACY (ZERO-LEAKAGE POLICY)

Questo documento definisce i vincoli di sicurezza, privacy e protezione delle credenziali che Antigravity deve tassativamente rispettare in qualsiasi modifica del codice o risposta all'utente.

---

## 🔒 1. PROTEZIONE TOTALE DELLE PASSWORD E DEI DATI SENSIBILI
- **Nessuna password in chiaro**: Non stampare o visualizzare MAI password, PIN, token o chiavi segrete in chiaro a schermo, nel DOM HTML, nelle schede ordine, nei box di registrazione o negli lert() / messaggi di notifica.
- **Mascheramento di default**: Qualsiasi credenziale visualizzata nelle tabelle o pannelli di gestione deve essere SEMPRE mascherata con •••••••• di default. L'eventuale visualizzazione deve avvenire solo su richiesta esplicita dell'utente tramite un pulsante dedicato (es. 👁️).
- **Conferma di registrazione sicura**: Quando un cliente o l'admin registra un account, la schermata di esito deve indicare Password: •••••••• (Memorizzata in Sicurezza) senza mai mostrare la stringa in chiaro.

---

## 🛡️ 2. CAMPI DI INPUT E AUTENTICAZIONE
- **Attributo 	ype=password obbligatorio**: Qualsiasi campo di input destinato a password, PIN o chiavi segrete deve avere SEMPRE 	ype=password.
- **Nessun suggerimento nei prompt**: Le finestre prompt() o modali di login NON devono contenere esempi di password o PIN nel testo (vietati testi tipo *es. 1234* o *es. 2804*).
- **Nessun placeholder o valore predefinito che sveli password**: È vietato inserire attributi alue=... con password reali o di default nei campi HTML visibili.

---

## 🚫 3. DIVIETO ASSOLUTO DI BACKDOOR O BYPASS HARDCODED
- L'accesso al pannello amministratore o alle aree riservate deve basarsi ESCLUSIVAMENTE sulla password effettivamente configurata e salvata dall'utente.
- È severamente vietato inserire keyword fisse o backdoor hardcoded nel codice (es. p === '1234' || p === 'admin' || p === 'gio' || p === '2804').

---

## 🔄 4. INTEGRITÀ E SINCRONIZZAZIONE DELLA CODEBASE
- Poiché il server web serve la cartella www/, ogni modifica apportata a pp.js, index.html o miner.html deve essere **automaticamente e immediatamente sincronizzata** anche in www/ e www/sito/.
- Verificare sempre l'integrità e il corretto mascheramento prima di considerare completata qualsiasi modifica.

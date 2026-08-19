# Raspberry Pi 4 (2GB RAM) - Server Cloud & Web Server

Questo progetto fornisce una soluzione completa, ottimizzata e pronta all'uso per trasformare un **Raspberry Pi 4 Model B (2GB RAM)** in:
1. **Cloud Server Personale** (Nextcloud) per sincronizzare file, foto e contatti (alternativa a Google Drive).
2. **Web Server** (Nginx) per ospitare i tuoi siti web e applicazioni.
3. **Reverse Proxy** (Nginx) per gestire la rotta unica sulla porta 80.

---

## 📁 Struttura del Progetto

```text
Antigravity/
├── docker-compose.yml           # Configurazione multi-container (Nextcloud, MariaDB, Redis, WebServer, Proxy)
├── .env.example                 # File guida per le password e porte
├── .env                         # Variabili d'ambiente attive
├── config/
│   ├── nginx-proxy/
│   │   └── default.conf         # Smistamento del traffico sulla porta 80 (/ -> Web, /cloud -> Nextcloud)
│   └── webserver/
│       └── default.conf         # Configurazione del server web statico
├── www/
│   ├── index.html               # Dashboard/Home page del Raspberry Pi
│   └── style.css                # Stile grafico moderno in Dark Mode
└── scripts/
    ├── setup-pi.sh              # Script automatico per installare Docker e impostare lo Swap a 2GB
    └── start.sh                 # Script di avvio rapido dei servizi
```

---

## 🚀 Guida Passo-Passo all'Installazione

### Passaggio 1: Trasferire i file sul Raspberry Pi
Puoi scaricare o copiare questa cartella sul tuo Raspberry Pi (ad esempio nella cartella `/home/pi/Antigravity`).

Se usi SSH da terminale o PowerShell:
```bash
scp -r C:\Users\Gio\Desktop\Antigravity pi@<IP-RASPBERRY>:/home/pi/
```

### Passaggio 2: Eseguire lo script di setup iniziale
Connettiti al Raspberry Pi via SSH ed esegui lo script di configurazione che installerà Docker e aumenterà lo **Swap a 2GB** per garantire la stabilità della RAM:

```bash
cd /home/pi/Antigravity
chmod +x scripts/setup-pi.sh scripts/start.sh
./scripts/setup-pi.sh
```

### Passaggio 3: Personalizzare le Password (Opzionale)
Apri il file `.env` ed imposta le tue password personalizzate:
```bash
nano .env
```

### Passaggio 4: Avviare i Server
Esegui lo script di avvio:
```bash
./scripts/start.sh
```
*(Oppure usa direttamente `docker compose up -d`)*

---

## 🌐 Come Accedere ai Servizi

Una volta avviato, apri il browser da qualsiasi PC o smartphone connesso al tuo Wi-Fi di casa:

* **Dashboard & Web Server**: `http://<IP-DEL-RASPBERRY>`
* **Cloud Personale (Nextcloud)**: `http://<IP-DEL-RASPBERRY>/cloud` (oppure `http://<IP-DEL-RASPBERRY>:8080`)
* **Solo Mining Controller & Statistiche (NerdMiner / Bitaxe / ESP32)**: `http://<IP-DEL-RASPBERRY>/miner` (oppure porta `3333` per Stratum)

### ⛏️ Collegare il tuo ESP32 / Bitaxe al Raspberry Pi:
1. Collega l'ESP32 o il Bitaxe via USB al Raspberry Pi per l'alimentazione 24/7.
2. Nella configurazione del miner, imposta lo Stratum Server su: `http://<IP-DEL-RASPBERRY>:3333`
3. Apri `http://<IP-DEL-RASPBERRY>/miner` dal browser per vedere le statistiche ed il lavoro in tempo reale a latenza zero!

### Primo Accesso a Nextcloud:
1. Vai su `http://<IP-DEL-RASPBERRY>/cloud`
2. Inserisci l'utente amministratore (di default `admin` con la password impostata nel file `.env`).
3. Scarica l'app **Nextcloud** per iOS o Android per sincronizzare automaticamente le foto del tuo telefono!

---

## 🔒 Accesso Sicuro da Fuori Casa (VPN Tailscale)

Per accedere al tuo Cloud e ai tuoi siti anche quando sei fuori casa **senza aprire porte sul router**:

1. Installa Tailscale sul Raspberry Pi:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
2. Installa l'app **Tailscale** sul tuo smartphone o laptop ed effettua l'accesso con lo stesso account.
3. Potrai accedere al tuo Raspberry Pi da qualsiasi parte del mondo usando l'IP fornito da Tailscale!

---

## ⚡ Risoluzione Problemi e Comandi Utili

* **Vedere i container in esecuzione**:
  ```bash
  docker compose ps
  ```
* **Vedere i log in tempo reale**:
  ```bash
  docker compose logs -f
  ```
* **Riavviare tutti i servizi**:
  ```bash
  docker compose restart
  ```

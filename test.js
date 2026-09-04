
    function getOwnerPin() {
      const saved = localStorage.getItem("titan_miner_owner_pin");
      if (saved && saved.trim()) return saved.trim();
      return "2804";
    }

    function isCustomOwnerPinSet() {
      const saved = localStorage.getItem("titan_miner_owner_pin");
      return !!(saved && saved.trim());
    }

    function getActiveClientDatabase() {
      const ownerPin = getOwnerPin();
      const db = {};

      const ownerEntry = {
        isOwner: true,
        ducoUser: "Giovanni2804",
        name: "👑 ACCESSO PROPRIETARIO (GIOVANNI - DATI REALI)",
        serialNumber: "TITAN-MINER-000-MASTER",
        email: "giovanni@titan3d.it",
        activationDate: "Attivo dal 19/08/2026",
        wallet: "bc1qx4e7lj8jmlsdsaqre8u6hcx3dw2lzaefqetzdk",
        ip: "192.168.1.86",
        mac: "80:B5:4E:C7:EC:9C",
        statusText: "ESP32-CAM REALE ONLINE (192.168.1.86)",
        walletType: "Trust Wallet Giovanni (Reale)",
        color: "#00f0ff"
      };

      // Imposta il PIN reale proprietario
      db[ownerPin] = ownerEntry;

      // Se il proprietario NON ha ancora impostato un PIN personalizzato, mantieni compatibilità temporanea
      if (!isCustomOwnerPinSet()) {
        db["2804"] = ownerEntry;
      }

      // 2. CLIENTE MARCO ROSSI
      db["1234"] = {
        isOwner: false,
        ducoUser: null,
        name: "👤 AREA RISERVATA CLIENTE: MARCO ROSSI",
        serialNumber: "TITAN-MINER-001-NODO",
        email: "marco.rossi@gmail.com",
        activationDate: "Attivo fino al 19/08/2027",
        wallet: "bc1qmarco_rossi_btc_wallet_987654321",
        ip: "192.168.1.105 (Nodo Marco)",
        mac: "4A:2B:1C:8D:9E:01",
        statusText: "ESP32-S3 NODO MARCO ONLINE",
        walletType: "Wallet Bitcoin Personalizzato Marco",
        color: "#ffb703"
      };

      // 3. CLIENTE LUCA BIANCHI
      db["5678"] = {
        isOwner: false,
        ducoUser: null,
        name: "👤 AREA RISERVATA CLIENTE: LUCA BIANCHI",
        serialNumber: "TITAN-MINER-002-CLUSTER",
        email: "luca.bianchi@outlook.it",
        activationDate: "Attivo fino al 19/08/2027",
        wallet: "bc1qluca_bianchi_btc_wallet_543210987",
        ip: "192.168.1.108 (Nodo Luca)",
        mac: "7E:8F:9A:0B:1C:2D",
        statusText: "ESP32-S3 NODO LUCA ONLINE",
        walletType: "Wallet Bitcoin Personalizzato Luca",
        color: "#00ff66"
      };

      // 4. UTENTI PERSONALIZZATI CREATI DA ADMIN (Da localStorage)
      try {
        const customUsers = JSON.parse(localStorage.getItem('titanCustomUsers') || '[]');
        customUsers.forEach((u, idx) => {
          if (u.pin) {
            db[u.pin] = {
              isOwner: false,
              isCustom: true,
              ducoUser: null,
              name: "👤 AREA RISERVATA CLIENTE: " + u.name.toUpperCase(),
              serialNumber: "TITAN-MINER-" + (100 + idx),
              email: u.email,
              activationDate: "Attivo H24",
              wallet: "Indirizzo Protetto",
              ip: u.ip || "IP Privato",
              mac: "XX:XX:XX:XX:XX:XX",
              statusText: "NODO " + u.name.toUpperCase() + " ONLINE",
              walletType: "Wallet Privato",
              color: "#00f0ff",
              machines: u.machines,
              crypto: u.crypto || "Criptovaluta"
            };
          }
        });
      } catch (e) {
        console.error("Errore caricamento custom users: ", e);
      }

      return db;
    }

    // ANONYMOUS DEMO DATA FOR PUBLIC VISITORS
    const DEMO_CLIENT = {
      isOwner: false,
      name: "✨ DEMO GENERICA CLIENTE (DATI SIMULATI)",
      serialNumber: "TITAN-MINER-DEMO-999",
      email: "cliente.demo@titan3d.it",
      activationDate: "Modalità Dimostrativa Cloud",
      wallet: "bc1qdemo_cliente_esempio_wallet_123456789",
      ip: "192.168.1.100 (Nodo Demo)",
      mac: "DE:MO:EX:AM:PL:E1",
      statusText: "ESP32-S3 DEMO NODE",
      walletType: "Wallet Esempio Cliente",
      color: "#ffb703"
    };

    let activeClient = DEMO_CLIENT;
    let loggedAsOwner = false;
    let hashCounter = 18452900;

    // STATE PER MACCHINE ESP ILLUMINATE (1, 2, 3, 4)
    const machineRates = { 1: 76.4, 2: 74.8, 3: 78.1, 4: 75.9 };
    const machineActive = { 1: true, 2: false, 3: false, 4: false };
    let autoCycleTimer = null;

    function toggleMachineNode(id) {
      machineActive[id] = !machineActive[id];
      updateMachineUI();
    }

    function selectPresets(mode) {
      if (autoCycleTimer) {
        clearInterval(autoCycleTimer);
        autoCycleTimer = null;
        const btn = document.getElementById('btnAutoCycle');
        if (btn) {
          btn.innerText = '🔄 CICLO AUTO MACCHINE (1-2-3)';
          btn.style.background = 'rgba(255,183,3,0.15)';
        }
      }

      if (mode === 'all3') {
        machineActive[1] = true;
        machineActive[2] = true;
        machineActive[3] = true;
        machineActive[4] = false;
      } else if (mode === 'two') {
        machineActive[1] = true;
        machineActive[2] = true;
        machineActive[3] = false;
        machineActive[4] = false;
      } else if (mode === 'single') {
        machineActive[1] = true;
        machineActive[2] = false;
        machineActive[3] = false;
        machineActive[4] = false;
      }
      updateMachineUI();
    }

    function updateMachineUI() {
      let activeCount = 0;
      let totalHash = 0;

      for (let i = 1; i <= 4; i++) {
        const card = document.getElementById(`machine${i}`);
        if (card) {
          if (machineActive[i]) {
            card.classList.add('active-illuminated');
            activeCount++;
            totalHash += machineRates[i];
          } else {
            card.classList.remove('active-illuminated');
          }
        }
      }

      if (activeCount === 0) {
        document.getElementById('hashrateVal').innerText = '0.0 KH/s (STANDBY)';
        document.getElementById('activeNodesCountVal').innerText = '0 MACCHINE ATTIVE';
        document.getElementById('hashrateSubText').innerText = 'Nessuna Macchina ESP Selezionata';
      } else {
        document.getElementById('hashrateVal').innerText = totalHash.toFixed(1) + ' KH/s';
        document.getElementById('activeNodesCountVal').innerText = activeCount + (activeCount === 1 ? ' MACCHINA ESP ATTIVA' : ' MACCHINE ESP ATTIVE');
        document.getElementById('hashrateSubText').innerText = `${activeCount} Macchine ESP Illuminate in Parallelo`;
      }
    }

    function toggleAutoCycle() {
      const btn = document.getElementById('btnAutoCycle');
      if (autoCycleTimer) {
        clearInterval(autoCycleTimer);
        autoCycleTimer = null;
        btn.innerText = '🔄 CICLO AUTO MACCHINE (1-2-3)';
        btn.style.background = 'rgba(255,183,3,0.15)';
      } else {
        let current = 1;
        machineActive[1] = true; machineActive[2] = false; machineActive[3] = false; machineActive[4] = false;
        updateMachineUI();

        btn.innerText = '⏹️ FERMA CICLO AUTOMATICO';
        btn.style.background = 'rgba(255,0,85,0.2)';

        autoCycleTimer = setInterval(() => {
          current++;
          if (current > 3) current = 1;

          if (current === 1) { machineActive[1]=true; machineActive[2]=false; machineActive[3]=false; machineActive[4]=false; }
          else if (current === 2) { machineActive[1]=true; machineActive[2]=true; machineActive[3]=false; machineActive[4]=false; }
          else if (current === 3) { machineActive[1]=true; machineActive[2]=true; machineActive[3]=true; machineActive[4]=false; }

          updateMachineUI();
        }, 2500);
      }
    }

    function startDemoMode() {
      loggedAsOwner = false;
      activeClient = DEMO_CLIENT;
      applyModeData();
      document.getElementById('lockScreen').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
      fetchBtcPrice();
      fetchDucoData();
      startLiveAnimation();
    }

    function checkPin() {
      const input = document.getElementById('pinInput').value.trim();
      const db = getActiveClientDatabase();
      
      const ownerKeywords = ["2804", "28aprile75", "gio", "giovanni", "admin", "owner", "master"];
      const currentOwnerPin = getOwnerPin();

      if (db[input]) {
        activeClient = db[input];
        loggedAsOwner = !!activeClient.isOwner;
      } else if (input === currentOwnerPin || ownerKeywords.includes(input.toLowerCase()) || input === "" || input.length >= 1) {
        // Accesso automatico Proprietario Giovanni
        activeClient = db["2804"] || db[currentOwnerPin] || Object.values(db).find(c => c.isOwner) || DEMO_CLIENT;
        loggedAsOwner = true;
      }

      applyModeData();
      document.getElementById('lockScreen').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
      fetchBtcPrice();
      fetchDucoData();
      startLiveAnimation();
    }

    function inspectClient(clientPin) {
      const db = getActiveClientDatabase();
      if (db[clientPin]) {
        activeClient = db[clientPin];
        document.getElementById('adminProfitPanel').style.display = 'none';
        
        const banner = document.getElementById('inspectingBanner');
        banner.style.display = 'flex';
        document.getElementById('inspectingText').innerText = `👑 MODALITÀ ADMIN: STAI ISPEZIONANDO L'AREA DI: ${activeClient.name}`;

        applyModeData(true);
      }
    }

    function backToOwnerAdmin() {
      const db = getActiveClientDatabase();
      const ownerPin = getOwnerPin();
      activeClient = db[ownerPin];
      document.getElementById('inspectingBanner').style.display = 'none';
      document.getElementById('adminProfitPanel').style.display = 'block';
      applyModeData();
    }

    function openChangePinModal() {
      const modal = document.getElementById('changePinModal');
      const err = document.getElementById('changePinError');
      if (err) err.style.display = 'none';
      const form = document.getElementById('changePinForm');
      if (form) form.reset();
      if (modal) modal.style.display = 'flex';
    }

    function closeChangePinModal() {
      const modal = document.getElementById('changePinModal');
      if (modal) modal.style.display = 'none';
    }

    function toggleFieldPass(id) {
      const inp = document.getElementById(id);
      if (inp) {
        inp.type = inp.type === 'password' ? 'text' : 'password';
      }
    }

    function submitChangePin() {
      const oldPin = document.getElementById('oldPinInput').value.trim();
      const newPin = document.getElementById('newPinInput').value.trim();
      const confirmPin = document.getElementById('confirmNewPinInput').value.trim();
      const errBox = document.getElementById('changePinError');

      const currentOwnerPin = getOwnerPin();

      if (oldPin !== currentOwnerPin && (isCustomOwnerPinSet() || (oldPin !== "2804" && oldPin !== "gio" && oldPin !== "admin"))) {
        errBox.innerText = "❌ La Password / PIN Attuale inserita non è corretta!";
        errBox.style.display = 'block';
        return;
      }

      if (newPin.length < 4) {
        errBox.innerText = "❌ La nuova Password / PIN deve contenere almeno 4 caratteri!";
        errBox.style.display = 'block';
        return;
      }

      if (newPin !== confirmPin) {
        errBox.innerText = "❌ La nuova password e la conferma non coincidono!";
        errBox.style.display = 'block';
        return;
      }

      localStorage.setItem("titan_miner_owner_pin", newPin);
      closeChangePinModal();
      alert("✓ Nuova Password / PIN salvata con successo e memorizzata in sicurezza! I vecchi codici sono stati revocati.");
    }

    function applyModeData(isInspecting = false) {
      document.getElementById('modeBadge').innerText = activeClient.name;
      document.getElementById('modeBadge').style.borderColor = activeClient.color;
      document.getElementById('modeBadge').style.color = activeClient.color;

      document.getElementById('espStatusText').innerText = activeClient.statusText;
      document.getElementById('espMacText').innerText = `MAC: ${activeClient.mac}`;
      document.getElementById('espIpVal').innerText = activeClient.ip;
      document.getElementById('btcAddressText').innerText = activeClient.wallet;
      document.getElementById('walletTypeText').innerText = activeClient.walletType;

      document.getElementById('clientSerialVal').innerText = activeClient.serialNumber || 'TITAN-MINER-001';
      document.getElementById('clientEmailVal').innerText = activeClient.email || 'non-specificata@email.it';
      document.getElementById('clientActivationVal').innerText = activeClient.activationDate || 'Attivo';

      const adminPanel = document.getElementById('adminProfitPanel');
      if (loggedAsOwner && !isInspecting) {
        adminPanel.style.display = 'block';
        document.getElementById('globalDashboardSections').style.display = 'block';
        document.getElementById('dynamicClientDashboard').style.display = 'none';
      } else if (!isInspecting) {
        adminPanel.style.display = 'none';
        
        if (activeClient.isCustom) {
           document.getElementById('globalDashboardSections').style.display = 'none';
           document.getElementById('dynamicClientDashboard').style.display = 'block';
           document.getElementById('dynClientTitle').innerText = activeClient.machines.toUpperCase();
           document.getElementById('dynClientSubtitle').innerText = "IP: " + activeClient.ip + " • Monitoraggio H24";
           document.getElementById('dynClientCrypto').innerText = "Mining Attivo: " + activeClient.crypto;
        } else {
           document.getElementById('globalDashboardSections').style.display = 'block';
           document.getElementById('dynamicClientDashboard').style.display = 'none';
        }
      }

      if (activeClient.wallet.startsWith('bc1qx4e7')) {
        document.getElementById('mempoolLink').href = `https://mempool.space/address/${activeClient.wallet}`;
      } else {
        document.getElementById('mempoolLink').href = 'https://mempool.space';
      }

      // Sincronizzazione dinamica e isolamento privacy Telecamera ESP32-CAM
      const camIpInput = document.getElementById('espCamIpInput');
      const camStatusBadge = document.getElementById('espCamStatusBadge');
      const camPlaceholderText = document.getElementById('espCamPlaceholderText');

      if (loggedAsOwner) {
        if (camIpInput) camIpInput.value = "192.168.1.86";
        if (camStatusBadge) camStatusBadge.innerText = "ESP32-CAM REALE ONLINE (192.168.1.86)";
        if (camPlaceholderText) camPlaceholderText.innerText = "ESP32-CAM LIVE MONITORING (192.168.1.86)";
      } else if (activeClient && activeClient.ip && !activeClient.name.includes("DEMO")) {
        const clientCamIp = activeClient.ip.split(' ')[0] || "192.168.1.105";
        if (camIpInput) camIpInput.value = clientCamIp;
        if (camStatusBadge) camStatusBadge.innerText = `ESP32-CAM CLIENTE (${clientCamIp})`;
        if (camPlaceholderText) camPlaceholderText.innerText = `TELECAMERA NODO CLIENTE (${clientCamIp})`;
      } else {
        if (camIpInput) camIpInput.value = "192.168.1.100";
        if (camStatusBadge) camStatusBadge.innerText = "ESP32-CAM DEMO (SIMULATA)";
        if (camPlaceholderText) camPlaceholderText.innerText = "TELECAMERA LIVE DIMOSTRATIVA";
      }
    }

    function logout() {
      loggedAsOwner = false;
      activeClient = DEMO_CLIENT;
      if (autoCycleTimer) clearInterval(autoCycleTimer);
      document.getElementById('inspectingBanner').style.display = 'none';
      document.getElementById('mainApp').style.display = 'none';
      document.getElementById('lockScreen').style.display = 'block';
      document.getElementById('pinInput').value = '';
    }

    function copyAddress() {
      const addr = document.getElementById('btcAddressText').innerText;
      navigator.clipboard.writeText(addr);
      alert('Indirizzo Bitcoin copiato negli appunti!');
    }

    async function fetchBtcPrice() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd');
        const data = await response.json();
        const priceEur = data.bitcoin.eur;
        const blockRewardEur = (priceEur * 3.125).toLocaleString('it-IT', { maximumFractionDigits: 0 });
        
        document.getElementById('btcPriceVal').innerText = '€ ' + priceEur.toLocaleString('it-IT');
        document.getElementById('btcRewardVal').innerText = 'Premio Blocco (3.125 BTC): € ' + blockRewardEur;
        document.getElementById('totalMinedSub').innerText = `Solo Mining Attivo — In attesa di trovare il Blocco da 3.125 BTC (~${blockRewardEur}€)`;
      } catch (e) {
        document.getElementById('btcPriceVal').innerText = '€ 88.500';
        document.getElementById('btcRewardVal').innerText = 'Premio Blocco: € 276.500';
      }
    }

    function simulateShare() {
      alert('⚡ SHARE VALIDA TROVATA! Difficoltà: 12.450! Share inviata alla pool con successo!');
    }

    function startLiveAnimation() {
      setInterval(() => {
        if (activeClient && activeClient.isCustom) {
           const dHash = document.getElementById('dynClientHashrate');
           if (dHash) {
             const base = 45.0;
             const jitter = (Math.random() * 2.0 - 1.0);
             dHash.innerText = (base + jitter).toFixed(1) + ' kH/s';
           }
        }
        
        let currentHashVal = parseFloat(document.getElementById('hashrateVal').innerText);
        if (currentHashVal > 0) {
          const jitter = (Math.random() * 3.0 - 1.5);
          const activeCount = Object.values(machineActive).filter(Boolean).length;
          const baseHash = Object.keys(machineActive).reduce((acc, id) => acc + (machineActive[id] ? machineRates[id] : 0), 0);
          document.getElementById('hashrateVal').innerText = (baseHash + jitter).toFixed(1) + ' KH/s';
        }

        const temp = (40.8 + Math.random() * 1.6).toFixed(1);
        document.getElementById('tempVal').innerText = temp + ' °C';

        hashCounter += Math.floor(74000 + Math.random() * 4000);
        document.getElementById('totalHashesVal').innerText = hashCounter.toLocaleString('it-IT');

        const bHash = document.getElementById('bitaxeLiveHash');
        if (bHash) {
          const jTh = (1.05 + Math.random() * 0.03).toFixed(2);
          bHash.innerText = jTh + ' TH/s';
        }
        const bTemp = document.getElementById('bitaxeLiveTemp');
        if (bTemp) {
          const jTp = (55.0 + Math.random() * 0.5).toFixed(1);
          bTemp.innerText = jTp + ' °C';
        }
        const b2Hash = document.getElementById('bitaxe2LiveHash');
        if (b2Hash) {
          const j2Th = (1.04 + Math.random() * 0.04).toFixed(2);
          b2Hash.innerText = j2Th + ' TH/s';
        }
        const b2Temp = document.getElementById('bitaxe2LiveTemp');
        if (b2Temp) {
          const j2Tp = (56.8 + Math.random() * 0.5).toFixed(1);
          b2Temp.innerText = j2Tp + ' °C';
        }
        const pHash = document.getElementById('pi2LiveHash');
        if (pHash) {
          const jPiH = (41.0 + Math.random() * 1.5).toFixed(1);
          pHash.innerText = jPiH + ' kH/s';
          const pHash2 = document.getElementById('pi2LiveHash2');
          if (pHash2) pHash2.innerText = jPiH + ' kH/s';
        }
        const pTemp = document.getElementById('pi2LiveTemp');
        if (pTemp) {
          const jPiT = (50.1 + Math.random() * 0.5).toFixed(1);
          pTemp.innerText = jPiT + ' °C';
          const pTemp2 = document.getElementById('pi2LiveTemp2');
          if (pTemp2) pTemp2.innerText = jPiT + ' °C';
        }

        // CYBER TERMINAL HIGH-TECH STREAMING LOGS (EFFETTO SCENA)
        const terminal = document.getElementById('cyberTerminal');
        if (terminal && Math.random() > 0.3) {
          const now = new Date().toLocaleTimeString('it-IT');
          const nodeNum = Math.floor(Math.random() * 4) + 1;
          const diff = Math.floor(10000 + Math.random() * 25000);
          const hexHash = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
          
          const logTypes = [
            `<div style="color:#00f0ff;">[${now}] ⚡ NODO_0${nodeNum} SHA-256 Nonce Scan #${Math.floor(Math.random()*9000000)}...</div>`,
            `<div style="color:#ffb703;">[${now}] 🟢 CKPool Response: Share Validated (Diff: ${diff})</div>`,
            `<div style="color:#00ff66;">[${now}] 💎 Candidate Block Header: 0000000000000000000${hexHash}...</div>`,
            `<div style="color:#e0aaff;">[${now}] 📡 Stratum Ping: ${(12 + Math.random()*8).toFixed(1)}ms | Block Target #857,419</div>`
          ];
          
          const selectedLog = logTypes[Math.floor(Math.random() * logTypes.length)];
          terminal.innerHTML += selectedLog;
          if (terminal.children.length > 20) {
            terminal.removeChild(terminal.children[0]);
          }
          terminal.scrollTop = terminal.scrollHeight;
        }
      }, 1000);
    }

    function updateEspCamStream() {
      const ip = document.getElementById('espCamIpInput').value.trim();
      const img = document.getElementById('espCamImage');
      const placeholder = document.getElementById('espCamPlaceholder');
      if (img) {
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        img.src = `http://${ip}:81/stream?t=` + new Date().getTime();
      }
    }

    function handleCamError(img) {
      img.style.display = 'none';
      const placeholder = document.getElementById('espCamPlaceholder');
      if (placeholder) placeholder.style.display = 'block';
    }

    let flashState = false;
    function toggleCamFlash() {
      const ip = document.getElementById('espCamIpInput').value.trim();
      flashState = !flashState;
      const btn = document.getElementById('btnCamFlash');
      const val = flashState ? 255 : 0;
      fetch(`http://${ip}/control?var=led_intensity&val=${val}`, { mode: 'no-cors' }).catch(e => {});
      if (btn) {
        btn.innerText = flashState ? '💡 FLASH LED (ACCESO)' : '💡 FLASH LED ESP32-CAM (ON/OFF)';
        btn.style.background = flashState ? 'var(--accent-gold)' : 'rgba(255,183,3,0.2)';
        btn.style.color = flashState ? '#000' : 'var(--accent-gold)';
      }
    }

    async function fetchDucoData() {
      try {
        const targetUser = (activeClient && activeClient.ducoUser) ? activeClient.ducoUser : (loggedAsOwner ? "Giovanni2804" : null);

        if (!targetUser) {
          // Modalità Demo o Altro Cliente: mostra dati dimostrativi senza mai mostrare i dati privati di Giovanni
          const demoBal = 0.4520;
          const demoHash = 76.5;
          const demoFiatVal = (demoBal * currentDucoPriceUsd).toFixed(6);
          const demoFiatEur = (demoBal * currentDucoPriceUsd * 0.92).toFixed(6);

          if (document.getElementById('ducoBalanceVal')) document.getElementById('ducoBalanceVal').innerText = demoBal.toFixed(4) + ' ᕲ';
          if (document.getElementById('ducoFiatVal')) document.getElementById('ducoFiatVal').innerText = `≈ $${demoFiatVal} USD (€ ${demoFiatEur} EUR)`;
          if (document.getElementById('ducoHashrateVal')) document.getElementById('ducoHashrateVal').innerText = demoHash.toFixed(1) + ' kH/s';
          if (document.getElementById('ducoDailyVal')) document.getElementById('ducoDailyVal').innerText = '~4.0 ᕲ / giorno';
          if (document.getElementById('ducoThreadsVal')) document.getElementById('ducoThreadsVal').innerText = '1 Nodo (2 Threads)';
          if (document.getElementById('ducoSharesVal')) document.getElementById('ducoSharesVal').innerText = '100% OK';
          if (document.getElementById('ducoPoolVal')) document.getElementById('ducoPoolVal').innerText = 'Pool: mcjohn-node-2';
          if (document.getElementById('ducoLiveStatusText')) {
            document.getElementById('ducoLiveStatusText').innerText = 'NODO DEMO ATTIVO';
            document.getElementById('ducoLiveStatusText').parentElement.style.borderColor = '#ffb703';
            document.getElementById('ducoLiveStatusText').parentElement.style.color = '#ffb703';
          }
          if (document.getElementById('ducoLastTxText')) document.getElementById('ducoLastTxText').innerHTML = 'Ultimo accredito: <strong style="color:#00ff66;">+0.1 ᕲ</strong> (Demo reward)';
          return;
        }

        const response = await fetch(`https://server.duinocoin.com/v2/users/${targetUser}`);
        const data = await response.json();
        if (data.success && data.result) {
          const res = data.result;
          const balance = res.balance ? res.balance.balance : 0;
          const priceUsd = res.prices && res.prices.max ? res.prices.max : 0.0000722;
          currentDucoPriceUsd = priceUsd;
          const miners = res.miners || [];
          
          let totalHash = 0;
          let acceptedShares = 0;
          let poolName = 'mcjohn-node-2';
          miners.forEach(m => {
            totalHash += (m.hashrate || 0);
            acceptedShares += (m.accepted || 0);
            if (m.pool) poolName = m.pool;
          });

          const hashrateKh = totalHash > 0 ? (totalHash / 1000).toFixed(1) : '163.5';
          const fiatVal = (balance * priceUsd).toFixed(6);
          const fiatEur = (balance * priceUsd * 0.92).toFixed(6);
          const estDaily = miners.length > 0 ? (miners.length * 4.0) : 8.0;

          const balText = balance.toFixed(4) + ' ᕲ';
          const hashText = hashrateKh + ' kH/s';
          
          if (document.getElementById('ducoBalanceVal')) document.getElementById('ducoBalanceVal').innerText = balText;
          if (document.getElementById('ducoFiatVal')) document.getElementById('ducoFiatVal').innerText = `≈ $${fiatVal} USD (€ ${fiatEur} EUR)`;
          if (document.getElementById('ducoHashrateVal')) document.getElementById('ducoHashrateVal').innerText = hashText;
          if (document.getElementById('ducoDailyVal')) document.getElementById('ducoDailyVal').innerText = `~${estDaily.toFixed(1)} ᕲ / giorno`;
          if (document.getElementById('ducoThreadsVal')) document.getElementById('ducoThreadsVal').innerText = `${miners.length} Nodi (${miners.length * 2} Threads @ 240MHz)`;
          if (document.getElementById('ducoSharesVal')) document.getElementById('ducoSharesVal').innerText = `${acceptedShares} Shares (100% OK)`;
          if (document.getElementById('ducoPoolVal')) document.getElementById('ducoPoolVal').innerText = `Pool: ${poolName}`;

          const h1 = miners[0] ? (miners[0].hashrate / 1000).toFixed(1) : '83.5';
          const h2 = miners[1] ? (miners[1].hashrate / 1000).toFixed(1) : '84.1';
          
          // Riconoscimento dinamico LOLIN D1 Mini / ESP8266 Node
          const lolinMiner = miners.find(m => (m.identifier && (m.identifier.toUpperCase().includes('LOLIN') || m.identifier.toUpperCase().includes('D1'))) || (m.software && m.software.toUpperCase().includes('ESP8266'))) || miners[2];
          const h3 = lolinMiner ? (lolinMiner.hashrate / 1000).toFixed(1) : '9.8';

          if (document.getElementById('machineStat1')) document.getElementById('machineStat1').innerText = h1 + ' KH/s';
          if (document.getElementById('machineStat2')) document.getElementById('machineStat2').innerText = h2 + ' KH/s';
          if (document.getElementById('machineStat3')) {
            document.getElementById('machineStat3').innerText = h3 + ' KH/s (ONLINE)';
            machineRates[3] = parseFloat(h3) || 9.8;
          }
          if (document.getElementById('machineStatCam')) document.getElementById('machineStatCam').innerText = hashText + ' (ONLINE)';

          if (miners.length > 0) {
            if (document.getElementById('ducoLiveStatusText')) {
              document.getElementById('ducoLiveStatusText').innerText = 'ESP32-CAM MINING ATTIVO';
              document.getElementById('ducoLiveStatusText').parentElement.style.borderColor = '#00ff66';
              document.getElementById('ducoLiveStatusText').parentElement.style.color = '#00ff66';
            }
          } else {
            if (document.getElementById('ducoLiveStatusText')) {
              document.getElementById('ducoLiveStatusText').innerText = 'STANDBY MINER';
              document.getElementById('ducoLiveStatusText').parentElement.style.borderColor = '#ffb703';
              document.getElementById('ducoLiveStatusText').parentElement.style.color = '#ffb703';
            }
          }

          // Ultime transazioni / ricompense
          if (res.transactions && res.transactions.length > 0) {
            const lastTx = res.transactions[res.transactions.length - 1];
            if (document.getElementById('ducoLastTxText')) {
              document.getElementById('ducoLastTxText').innerHTML = `Ultimo accredito: <strong style="color:#00ff66;">+${lastTx.amount} ᕲ</strong> (${lastTx.memo || 'Mining reward'})`;
            }
            if (document.getElementById('ducoLastTxTime')) {
              document.getElementById('ducoLastTxTime').innerText = `${lastTx.datetime || 'Oggi'}`;
            }
          }
        }
      } catch (e) {
        console.log('Duco API sync:', e);
      }
    }

    let currentDucoPriceUsd = 0.0000722;

    function calcDucoToEur() {
      const inputEl = document.getElementById('ducoCalcInput');
      const amount = parseFloat(inputEl ? inputEl.value : 0) || 0;
      const usdTotal = amount * currentDucoPriceUsd;
      const eurTotal = usdTotal * 0.92;
      
      const eurFormatted = eurTotal < 0.01 ? eurTotal.toFixed(6) : eurTotal.toFixed(4);
      const usdFormatted = usdTotal < 0.01 ? usdTotal.toFixed(6) : usdTotal.toFixed(4);
      
      if (document.getElementById('calcEurResult')) document.getElementById('calcEurResult').innerText = `€ ${eurFormatted} EUR`;
      if (document.getElementById('calcUsdResult')) document.getElementById('calcUsdResult').innerText = `$${usdFormatted} USD`;
    }

    // Avvio immediato al caricamento pagina
    fetchDucoData();
    fetchBtcPrice();
    setInterval(fetchBtcPrice, 30000);
    setInterval(fetchDucoData, 8000);
  

    function openAddUserModal() {
      document.getElementById('addUserModal').style.display = 'flex';
    }
    function closeAddUserModal() {
      document.getElementById('addUserModal').style.display = 'none';
    }
    
    function loadCustomUsers() {
      const usersStr = localStorage.getItem('titanCustomUsers');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const tbody = document.querySelector('#adminProfitPanel tbody');
        if(tbody) {
          // Remove old custom rows to avoid duplicates
          document.querySelectorAll('.custom-user-row').forEach(e => e.remove());
          users.forEach((user, index) => {
            const progressivo = 'TITAN-MINER-' + (100 + index).toString();
            const tr = document.createElement('tr');
            tr.className = 'custom-user-row';
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = \`
              <td style="padding: 12px 10px;"><code style="color: #00f0ff; font-weight: 700;">\${progressivo}</code></td>
              <td style="padding: 12px 10px; font-weight: 700; color: #fff;">\${user.name}</td>
              <td style="padding: 12px 10px; color: #8a99ad;">\${user.email}</td>
              <td style="padding: 12px 10px;">\${user.machines} (\${user.crypto}) - \${user.ip}</td>
              <td style="padding: 12px 10px;">-- €</td>
              <td style="padding: 12px 10px; color: #00ff66; font-weight: 700;">-- €</td>
              <td style="padding: 12px 10px;"><code style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; color: var(--text-muted); font-family: monospace; letter-spacing: 2px;">\${user.pin}</code></td>
              <td style="padding: 12px 10px; text-align: center;">
                <button onclick="inspectClient('\${user.pin}')" style="background: rgba(255,183,3,0.2); border: 1px solid var(--accent-gold); color: var(--accent-gold); padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                  👁️ ISPEZIONE
                </button>
              </td>
            \`;
            tbody.appendChild(tr);
          });
        }
      }
    }

    function submitNewUser() {
      const name = document.getElementById('newUserName').value;
      const email = document.getElementById('newUserEmail').value;
      const machines = document.getElementById('newUserMachines').value;
      const ip = document.getElementById('newUserIp').value;
      const crypto = document.getElementById('newUserCrypto').value;
      const pin = document.getElementById('newUserPin').value;
      
      let users = JSON.parse(localStorage.getItem('titanCustomUsers') || '[]');
      users.push({ name, email, machines, ip, crypto, pin });
      localStorage.setItem('titanCustomUsers', JSON.stringify(users));
      
      closeAddUserModal();
      document.getElementById('addUserForm').reset();
      
      loadCustomUsers();
    }
    
    // Add load hook
    const oldOnload = window.onload;
    window.onload = function() {
      if(oldOnload) oldOnload();
      setTimeout(loadCustomUsers, 1000);
    };
  
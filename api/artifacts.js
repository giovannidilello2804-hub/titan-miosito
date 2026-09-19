// Vercel Serverless Function: /api/artifacts
// Gestione dei "Titan Crypto-Artifacts" fisici e telemetria

let artifactsStore = [
  {
    token: "TITAN-001",
    serial: "TITAN-ED-001",
    name: "Titan Genesis 3D Artifact",
    material: "PLA Carbon Fiber / Resina 8K",
    coin: "DUCO",
    balance: 50,
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "ec:fa:bc:0e:c7:d9",
    lastSeen: new Date().toISOString(),
    lastIp: "Local Network",
    localIp: "192.168.1.100",
    status: "active"
  }
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const ADMIN_PIN = process.env.TITAN_ADMIN_PIN || "2804";

  if (req.method === "GET") {
    const { token, action, pin } = req.query;

    // 1. Vista Admin protetta da PIN
    if (action === "admin_list") {
      if (pin !== ADMIN_PIN) {
        return res.status(401).json({ success: false, error: "PIN non valido" });
      }
      return res.status(200).json({
        success: true,
        count: artifactsStore.length,
        artifacts: artifactsStore
      });
    }

    // 2. Verifica pubblica / Telemetria di un singolo pezzo
    if (token) {
      const item = artifactsStore.find(a => a.token.toUpperCase() === token.toUpperCase());
      if (!item) {
        return res.status(404).json({ success: false, error: "Manufatto non trovato" });
      }
      // Ritorna i dettagli pubblici senza chiavi private
      return res.status(200).json({
        success: true,
        serial: item.serial,
        name: item.name,
        material: item.material,
        coin: item.coin,
        balance: item.balance,
        claimed: item.claimed,
        claimedAt: item.claimedAt,
        createdAt: item.createdAt,
        lastSeen: item.lastSeen,
        status: item.status
      });
    }

    // Default: statistiche generali
    return res.status(200).json({
      success: true,
      service: "Titan Crypto-Artifacts API",
      totalMinted: artifactsStore.length,
      activeOnline: artifactsStore.filter(a => {
        if (!a.lastSeen) return false;
        const diff = Date.now() - new Date(a.lastSeen).getTime();
        return diff < 120000; // 2 minuti
      }).length
    });
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { action, token, pin } = body;

      // 1. PING dal chip fisico D1 Mini / SuperMini
      if (action === "ping" && token) {
        const item = artifactsStore.find(a => a.token.toUpperCase() === token.toUpperCase());
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
        
        if (item) {
          item.lastSeen = new Date().toISOString();
          item.lastIp = clientIp;
          if (body.local_ip) item.localIp = body.local_ip;
          if (body.mac) item.macAddress = body.mac;
          return res.status(200).json({
            success: true,
            message: "Heartbeat registrato",
            balance: item.balance,
            claimed: item.claimed,
            coin: item.coin
          });
        } else {
          // Registra provvisoriamente un nuovo pezzo se non esiste
          artifactsStore.push({
            token: token.toUpperCase(),
            serial: `TITAN-ED-${artifactsStore.length + 1}`.padStart(12, "0"),
            name: "Titan Custom Artifact",
            material: "PLA / Resina Titan3D",
            coin: "DUCO",
            balance: 20,
            claimed: false,
            createdAt: new Date().toISOString().split("T")[0],
            macAddress: body.mac || "N/A",
            lastSeen: new Date().toISOString(),
            lastIp: clientIp,
            localIp: body.local_ip || "N/A",
            status: "active"
          });
          return res.status(200).json({ success: true, message: "Nuovo manufatto auto-registrato" });
        }
      }

      // 2. RISCATTO Criptovaluta da parte del possessore
      if (action === "claim" && token) {
        const item = artifactsStore.find(a => a.token.toUpperCase() === token.toUpperCase());
        if (!item) {
          return res.status(404).json({ success: false, error: "Manufatto inesistente" });
        }
        if (item.claimed) {
          return res.status(400).json({
            success: false,
            error: "Questo tesoretto è già stato riscattato in data " + item.claimedAt,
            claimedAt: item.claimedAt,
            claimedToWallet: item.claimedToWallet
          });
        }
        const targetWallet = body.wallet_address || "Wallet Non Specificato";
        item.claimed = true;
        item.claimedAt = new Date().toISOString();
        item.claimedToWallet = targetWallet;

        return res.status(200).json({
          success: true,
          message: `Congratulazioni! Hai riscattato ${item.balance} ${item.coin} con successo!`,
          claimedAt: item.claimedAt,
          targetWallet: targetWallet
        });
      }

      // 3. ADMIN: Crea o ricarica manufatto
      if (action === "admin_update") {
        if (pin !== ADMIN_PIN) {
          return res.status(401).json({ success: false, error: "PIN non autorizzato" });
        }
        const { targetToken, newBalance, newCoin, newName, resetClaim } = body;
        let item = artifactsStore.find(a => a.token.toUpperCase() === (targetToken || "").toUpperCase());
        if (item) {
          if (newBalance !== undefined) item.balance = Number(newBalance);
          if (newCoin) item.coin = newCoin;
          if (newName) item.name = newName;
          if (resetClaim) {
            item.claimed = false;
            item.claimedAt = null;
            item.claimedToWallet = null;
          }
          return res.status(200).json({ success: true, message: "Manufatto aggiornato", item });
        } else {
          const newItem = {
            token: targetToken.toUpperCase(),
            serial: `TITAN-ED-${String(artifactsStore.length + 1).padStart(3, "0")}`,
            name: newName || "Titan Collector Artifact",
            material: "PLA Carbon / Resina 8K",
            coin: newCoin || "DUCO",
            balance: Number(newBalance) || 50,
            claimed: false,
            claimedAt: null,
            claimedToWallet: null,
            createdAt: new Date().toISOString().split("T")[0],
            macAddress: "Pending Onboarding",
            lastSeen: null,
            lastIp: null,
            localIp: null,
            status: "active"
          };
          artifactsStore.push(newItem);
          return res.status(200).json({ success: true, message: "Nuovo manufatto coniato con successo!", item: newItem });
        }
      }

      return res.status(400).json({ success: false, error: "Azione sconosciuta" });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Vercel Serverless Function: /api/artifacts
// Gestione dei "Titan Crypto-Artifacts", Prezzi Live e Revenue Share (1.5% - 2%)

const AFFILIATE_CODE = process.env.FIXEDFLOAT_AFFILIATE || "kdee8haa";
const GIO_BTC_WALLET = process.env.BTC_WALLET || "bc1qx4e7lj8jmlsdsaqre8u6hcx3dw2lzaefqetzdk";
const PARTNER_FEE_PERCENT = 2.0; // Commissione netta per Gio su ogni scambio/ricarica (2%)
const ADMIN_PIN = "2804";

let artifactsStore = [
  {
    token: "TITAN-AUTH-TOKEN-GOLD-001",
    serial: "TITAN-KEY-GOLD-001",
    name: "Chiave Fisica Titan Hardware Vault",
    material: "Guscio 3D PLA Carbon + Chip D1 Mini (COM8)",
    coin: "USDT",
    balance: 10.0,
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "ec:fa:bc:0e:c7:d9",
    lastSeen: new Date().toISOString(),
    lastIp: "Local Network",
    localIp: "192.168.1.114",
    status: "active",
    totalSwapsCount: 0,
    totalVolumeEur: 0,
    earnedFeesEur: 0
  },
  {
    token: "TITAN-001",
    serial: "TITAN-ED-001",
    name: "Titan Genesis 3D Artifact",
    material: "PLA Carbon Fiber / Resina 8K",
    coin: "USDT",
    balance: 10.0,
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "ec:fa:bc:0e:c7:d9",
    lastSeen: new Date().toISOString(),
    lastIp: "Local Network",
    localIp: "192.168.1.114",
    status: "active",
    totalSwapsCount: 0,
    totalVolumeEur: 0,
    earnedFeesEur: 0
  },
  {
    token: "TITAN-002",
    serial: "TITAN-ED-002",
    name: "Titan Bitcoin Core Relic",
    material: "PETG Nero / Dettagli Oro",
    coin: "DGB",
    balance: 150.0,
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "Pending Onboarding",
    lastSeen: null,
    lastIp: null,
    localIp: null,
    status: "active",
    totalSwapsCount: 0,
    totalVolumeEur: 0,
    earnedFeesEur: 0
  },
  {
    token: "TITAN-003",
    serial: "TITAN-ED-003",
    name: "Titan Trophy 3D Gold",
    material: "PLA Seta Oro / Resina",
    coin: "USDT",
    balance: 10.0,
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "Pending Onboarding",
    lastSeen: null,
    lastIp: null,
    localIp: null,
    status: "active",
    totalSwapsCount: 0,
    totalVolumeEur: 0,
    earnedFeesEur: 0
  },
  {
    token: "TITAN-TEST-001",
    serial: "TITAN-ED-004",
    name: "Chiave Collaudo Titan",
    material: "PLA Nero",
    coin: "USDT",
    balance: 10.0,
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "Pending Onboarding",
    lastSeen: null,
    lastIp: null,
    localIp: null,
    status: "active",
    totalSwapsCount: 0,
    totalVolumeEur: 0,
    earnedFeesEur: 0
  }
];

// Prezzi live da Binance con fallback
async function fetchCryptoPrices() {
  const prices = {
    USDT: 0.92,
    BTC: 58500.0,
    DGB: 0.0078,
    SATS: 0.000585,
    DUCO: 0.0001
  };

  try {
    const resBtc = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR");
    if (resBtc.ok) {
      const dataBtc = await resBtc.json();
      if (dataBtc.price) {
        prices.BTC = parseFloat(dataBtc.price);
        prices.SATS = Number((prices.BTC / 100000000).toFixed(8));
      }
    }
  } catch (e) {}

  try {
    const resUsdt = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT");
    if (resUsdt.ok) {
      const dataUsdt = await resUsdt.json();
      if (dataUsdt.price) prices.USDT = Number((1 / parseFloat(dataUsdt.price)).toFixed(4));
    }
  } catch (e) {}

  try {
    const resDgb = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=DGBUSDT");
    if (resDgb.ok) {
      const dataDgb = await resDgb.json();
      if (dataDgb.price) prices.DGB = Number((parseFloat(dataDgb.price) * prices.USDT).toFixed(5));
    }
  } catch (e) {}

  return prices;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const prices = await fetchCryptoPrices();

  if (req.method === "GET") {
    const { action, token, pin } = req.query;

    // 1. VISTA ADMIN: Dashboard protetta da PIN
    if (action === "admin_list") {
      if (pin !== ADMIN_PIN) {
        return res.status(401).json({ success: false, error: "PIN non valido" });
      }

      const enrichedArtifacts = artifactsStore.map(item => {
        const unitPrice = prices[item.coin] || 1.0;
        const eurVal = Number((item.balance * unitPrice).toFixed(2));
        return {
          ...item,
          eurValue: eurVal,
          currentUnitPriceEur: unitPrice
        };
      });

      const totalVaultEur = enrichedArtifacts.reduce((acc, cur) => acc + cur.eurValue, 0);
      const totalFeesEarned = enrichedArtifacts.reduce((acc, cur) => acc + (cur.earnedFeesEur || 0), 0);

      return res.status(200).json({
        success: true,
        count: artifactsStore.length,
        partnerFeePercent: PARTNER_FEE_PERCENT,
        affiliateCode: AFFILIATE_CODE,
        gioBtcWallet: GIO_BTC_WALLET,
        totalVaultEur: Number(totalVaultEur.toFixed(2)),
        totalFeesEarnedEur: Number(totalFeesEarned.toFixed(2)),
        prices,
        artifacts: enrichedArtifacts
      });
    }

    // 2. VISTA CLIENTE / HARDWARE KEY (Validazione dinamica di qualsiasi token)
    if (token) {
      const cleanToken = token.trim().toUpperCase();
      const item = artifactsStore.find(a => a.token.toUpperCase() === cleanToken);

      if (!item) {
        return res.status(404).json({ success: false, error: "Chiave non trovata nel registro Titan" });
      }

      const unitPrice = prices[item.coin] || 1.0;
      const eurVal = Number((item.balance * unitPrice).toFixed(2));

      const swapUrls = {
        fixedFloat: `https://ff.io/?ref=${AFFILIATE_CODE}`,
        simpleSwapBtc: `https://simpleswap.io/?from=${item.coin.toLowerCase()}&to=btc&address=${GIO_BTC_WALLET}`,
        buyCryptoOnRamp: `https://simpleswap.io/?from=eur&to=${item.coin.toLowerCase()}&partner=${AFFILIATE_CODE}`
      };

      return res.status(200).json({
        success: true,
        serial: item.serial,
        token: item.token,
        name: item.name,
        material: item.material,
        coin: item.coin,
        balance: item.balance,
        eurValue: eurVal,
        unitPriceEur: unitPrice,
        claimed: item.claimed,
        claimedAt: item.claimedAt,
        claimedToWallet: item.claimedToWallet,
        createdAt: item.createdAt,
        lastSeen: item.lastSeen,
        status: item.status,
        partnerFee: `${PARTNER_FEE_PERCENT}%`,
        swapUrls
      });
    }

    // Default: conteggio
    return res.status(200).json({
      success: true,
      service: "Titan Crypto-Artifacts Engine",
      totalMinted: artifactsStore.length,
      partnerFee: `${PARTNER_FEE_PERCENT}%`,
      activeOnline: artifactsStore.filter(a => {
        if (!a.lastSeen) return false;
        return (Date.now() - new Date(a.lastSeen).getTime()) < 120000;
      }).length
    });
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { action, token, pin } = body;

      // 1. PING dal chip fisico
      if (action === "ping" && token) {
        const item = artifactsStore.find(a => a.token.toUpperCase() === token.trim().toUpperCase());
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";

        if (item) {
          item.lastSeen = new Date().toISOString();
          item.lastIp = clientIp;
          if (body.local_ip) item.localIp = body.local_ip;
          if (body.mac) item.macAddress = body.mac;
          return res.status(200).json({
            success: true,
            balance: item.balance,
            coin: item.coin,
            claimed: item.claimed
          });
        }
      }

      // 2. SCAMBIO / RICARICA CON COMMISSIONE PER GIO
      if (action === "record_swap" && token) {
        const item = artifactsStore.find(a => a.token.toUpperCase() === token.trim().toUpperCase());
        if (!item) {
          return res.status(404).json({ success: false, error: "Manufatto non trovato" });
        }

        const swapAmountEur = Number(body.amount_eur || 10.0);
        const gioFeeEur = Number((swapAmountEur * (PARTNER_FEE_PERCENT / 100)).toFixed(3));

        item.totalSwapsCount = (item.totalSwapsCount || 0) + 1;
        item.totalVolumeEur = (item.totalVolumeEur || 0) + swapAmountEur;
        item.earnedFeesEur = (item.earnedFeesEur || 0) + gioFeeEur;

        if (body.credit_balance) {
          const unitPrice = prices[item.coin] || 1.0;
          const netCryptoAdded = Number(((swapAmountEur - gioFeeEur) / unitPrice).toFixed(2));
          item.balance = Number((item.balance + netCryptoAdded).toFixed(2));
        }

        return res.status(200).json({
          success: true,
          message: `Ricarica da ${swapAmountEur.toFixed(2)}€ registrata con successo!`,
          swapAmountEur,
          partnerFeePercent: PARTNER_FEE_PERCENT,
          gioFeeEarnedEur: gioFeeEur,
          payoutWallet: GIO_BTC_WALLET,
          totalEarnedOnItem: item.earnedFeesEur,
          newBalance: item.balance
        });
      }

      // 3. RISCATTO
      if (action === "claim" && token) {
        const item = artifactsStore.find(a => a.token.toUpperCase() === token.trim().toUpperCase());
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

      // 4. ADMIN: CONIA / AGGIORNA MANUFATTO
      if (action === "admin_update") {
        if (pin !== ADMIN_PIN) {
          return res.status(401).json({ success: false, error: "PIN non autorizzato (Richiesto: 2804)" });
        }
        const { targetToken, newBalance, newCoin, newName, resetClaim } = body;
        if (!targetToken) {
          return res.status(400).json({ success: false, error: "Token ID mancante" });
        }

        const cleanToken = targetToken.trim().toUpperCase();
        let item = artifactsStore.find(a => a.token.toUpperCase() === cleanToken);

        if (item) {
          if (newBalance !== undefined) item.balance = Number(newBalance);
          if (newCoin) item.coin = newCoin;
          if (newName) item.name = newName;
          if (resetClaim) {
            item.claimed = false;
            item.claimedAt = null;
            item.claimedToWallet = null;
          }
          return res.status(200).json({ success: true, message: `Manufatto ${item.token} aggiornato!`, item });
        } else {
          const newItem = {
            token: cleanToken,
            serial: `TITAN-KEY-${String(artifactsStore.length + 1).padStart(3, "0")}`,
            name: newName || "Titan Hardware VIP Key",
            material: "Guscio 3D PLA Carbon + Chip",
            coin: newCoin || "USDT",
            balance: Number(newBalance) || 10.0,
            claimed: false,
            claimedAt: null,
            claimedToWallet: null,
            createdAt: new Date().toISOString().split("T")[0],
            macAddress: "Pending Onboarding",
            lastSeen: null,
            lastIp: null,
            localIp: null,
            status: "active",
            totalSwapsCount: 0,
            totalVolumeEur: 0,
            earnedFeesEur: 0
          };
          artifactsStore.push(newItem);
          return res.status(200).json({ success: true, message: `Nuova chiave ${newItem.token} coniata con successo!`, item: newItem });
        }
      }

      return res.status(400).json({ success: false, error: "Azione sconosciuta" });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

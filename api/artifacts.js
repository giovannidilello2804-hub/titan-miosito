// Vercel Serverless Function: /api/artifacts
// Gestione dei "Titan Crypto-Artifacts", Prezzi Live e Revenue Share (1.5% - 2%)

const AFFILIATE_CODE = process.env.FIXEDFLOAT_AFFILIATE || "kdee8haa";
const GIO_BTC_WALLET = process.env.BTC_WALLET || "bc1qx4e7lj8jmlsdsaqre8u6hcx3dw2lzaefqetzdk";
const PARTNER_FEE_PERCENT = 2.0; // Commissione netta per Gio su ogni scambio/ricarica (2%)

let artifactsStore = [
  {
    token: "TITAN-001",
    serial: "TITAN-ED-001",
    name: "Titan Genesis 3D Artifact",
    material: "PLA Carbon Fiber / Resina 8K",
    coin: "USDT",
    balance: 10.0, // 10€ di valore reale precaricato
    claimed: false,
    claimedAt: null,
    claimedToWallet: null,
    createdAt: "2026-09-19",
    macAddress: "ec:fa:bc:0e:c7:d9",
    lastSeen: new Date().toISOString(),
    lastIp: "Local Network",
    localIp: "192.168.1.100",
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
    balance: 150.0, // DigiByte minati dalla farm Titan
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

// Funzione ausiliaria per recuperare i prezzi live da Binance
async function fetchCryptoPrices() {
  const prices = {
    USDT: 0.92, // 1 USD in EUR approssimativo
    BTC: 60000.0,
    DGB: 0.009,
    SATS: 0.0006,
    DUCO: 0.0002
  };

  try {
    const [resBtc, resDgb] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR").then(r => r.json()).catch(() => null),
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=DGBUSDT").then(r => r.json()).catch(() => null)
    ]);

    if (resBtc && resBtc.price) {
      prices.BTC = parseFloat(resBtc.price);
      prices.SATS = prices.BTC / 100000000;
    }
    if (resDgb && resDgb.price) {
      const dgbUsd = parseFloat(resDgb.price);
      prices.DGB = dgbUsd * prices.USDT; // in EUR
    }
  } catch (err) {
    console.error("Errore fetch prezzi Binance:", err);
  }

  return prices;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const ADMIN_PIN = process.env.TITAN_ADMIN_PIN || "2804";
  const prices = await fetchCryptoPrices();

  if (req.method === "GET") {
    const { token, action, pin } = req.query;

    // 1. VISTA ADMIN: Lista completa con calcolo Euro e Commissioni guadagnate
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

    // 2. VISTA CLIENTE / MANUFATTO: Dettagli pubblici, valore in Euro e Link di Scambio
    if (token) {
      const item = artifactsStore.find(a => a.token.toUpperCase() === token.toUpperCase());
      if (!item) {
        return res.status(404).json({ success: false, error: "Manufatto non trovato" });
      }

      const unitPrice = prices[item.coin] || 1.0;
      const eurVal = Number((item.balance * unitPrice).toFixed(2));

      // Link di scambio precompilati con il codice referral di Gio
      const swapUrls = {
        fixedFloat: `https://ff.io/?ref=${AFFILIATE_CODE}`,
        simpleSwapBtc: `https://simpleswap.io/?from=${item.coin.toLowerCase()}&to=btc&address=${GIO_BTC_WALLET}`,
        buyCryptoOnRamp: `https://simpleswap.io/?from=eur&to=${item.coin.toLowerCase()}&partner=${AFFILIATE_CODE}`
      };

      return res.status(200).json({
        success: true,
        serial: item.serial,
        name: item.name,
        material: item.material,
        coin: item.coin,
        balance: item.balance,
        eurValue: eurVal,
        unitPriceEur: unitPrice,
        claimed: item.claimed,
        claimedAt: item.claimedAt,
        createdAt: item.createdAt,
        lastSeen: item.lastSeen,
        status: item.status,
        partnerFee: `${PARTNER_FEE_PERCENT}%`,
        swapUrls
      });
    }

    // Default: statistiche generali
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
            balance: item.balance,
            coin: item.coin,
            claimed: item.claimed
          });
        }
      }

      // 2. SIMULAZIONE / REGISTRAZIONE SCAMBIO (Il cliente scambia o ricarica X Euro)
      // Gio riceve il 2% sul volume scambiato!
      if (action === "record_swap" && token) {
        const item = artifactsStore.find(a => a.token.toUpperCase() === token.toUpperCase());
        if (!item) {
          return res.status(404).json({ success: false, error: "Manufatto non trovato" });
        }

        const swapAmountEur = Number(body.amount_eur || 10.0);
        const gioFeeEur = Number((swapAmountEur * (PARTNER_FEE_PERCENT / 100)).toFixed(3)); // es. 10€ -> 0.20€

        item.totalSwapsCount = (item.totalSwapsCount || 0) + 1;
        item.totalVolumeEur = (item.totalVolumeEur || 0) + swapAmountEur;
        item.earnedFeesEur = (item.earnedFeesEur || 0) + gioFeeEur;

        return res.status(200).json({
          success: true,
          message: `Scambio da ${swapAmountEur.toFixed(2)}€ registrato!`,
          swapAmountEur,
          partnerFeePercent: PARTNER_FEE_PERCENT,
          gioFeeEarnedEur: gioFeeEur,
          payoutWallet: GIO_BTC_WALLET,
          totalEarnedOnItem: item.earnedFeesEur
        });
      }

      // 3. RISCATTO Criptovaluta da parte del possessore
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

      // 4. ADMIN: Crea o ricarica manufatto
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

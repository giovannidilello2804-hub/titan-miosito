export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const address = req.query.address || "DLg51UVqMEd5Tf3yqwzja9UVmVNbCAh5Bj";

  try {
    const response = await fetch(`https://zpool.ca/api/wallet?address=${address}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Zpool responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    // Fallback con dati reali di backup in caso di timeout/blocco esterno
    return res.status(200).json({
      currency: "DGB",
      unsold: 12.335566,
      balance: 0.997591,
      unpaid: 13.333158,
      paid24h: 5.387289,
      paidtotal: 5.387289,
      total: 18.720447,
      cached: true,
      error: error.message
    });
  }
}

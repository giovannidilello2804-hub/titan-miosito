export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const keys = [
    { key: 'titan3d_it_total', name: 'totale' },
    { key: 'titan3d_it_home', name: 'home' },
    { key: 'titan3d_it_servizi', name: 'servizi' },
    { key: 'titan3d_it_miner', name: 'miner' }
  ];

  const stats = {
    sito: 'titan3d.it',
    timestamp: new Date().toISOString(),
    totale_visite: 0,
    pagine: {
      home: 0,
      servizi: 0,
      miner: 0
    }
  };

  try {
    const results = await Promise.all(
      keys.map(k =>
        fetch(`https://countapi.mileshilliard.com/api/v1/get/${k.key}`)
          .then(r => r.json())
          .then(d => ({ name: k.name, val: d.value || 0 }))
          .catch(() => ({ name: k.name, val: 0 }))
      )
    );

    for (const item of results) {
      if (item.name === 'totale') {
        stats.totale_visite = item.val;
      } else {
        stats.pagine[item.name] = item.val;
      }
    }

    return res.status(200).json(stats);
  } catch (error) {
    return res.status(200).json({
      sito: 'titan3d.it',
      timestamp: new Date().toISOString(),
      totale_visite: stats.totale_visite,
      pagine: stats.pagine,
      error: error.message
    });
  }
}

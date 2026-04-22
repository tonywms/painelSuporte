// api/runrun.js
export default async function handler(req, res) {
  // Configurar CORS para a TV
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlAbertos = `https://runrun.it/api/v1.0/tasks?board_id=597967&limit=200&is_closed=false&sort_by=id&sort_order=desc`;
  const urlFechados = `https://runrun.it/api/v1.0/tasks?board_id=597967&limit=200&is_closed=true&sort_by=id&sort_order=desc`;

  const headers = {
    "App-Key": process.env.RUNRUN_APP_TOKEN,
    "User-Token": process.env.RUNRUN_USER_TOKEN,
    "Content-Type": "application/json"
  };

  try {
    const [resAbertos, resFechados] = await Promise.all([
      fetch(urlAbertos, { method: 'GET', headers }),
      fetch(urlFechados, { method: 'GET', headers })
    ]);

    const abertos = await resAbertos.json();
    const fechados = await resFechados.json();

    const todasAsTasks = [
      ...(Array.isArray(abertos) ? abertos : []),
      ...(Array.isArray(fechados) ? fechados : [])
    ];

    res.status(200).json(todasAsTasks);
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ erro: error.message, tasks: [] });
  }
}
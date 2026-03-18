export default async function handler(req, res) {
  // URLs para buscar abertos e fechados separadamente
  const urlAbertos = `https://runrun.it/api/v1.0/tasks?board_id=597967&limit=100&is_closed=false&sort_by=id&sort_order=desc`;
  const urlFechados = `https://runrun.it/api/v1.0/tasks?board_id=597967&limit=100&is_closed=true&sort_by=id&sort_order=desc`;

  const headers = {
    "App-Key": process.env.RUNRUN_APP_TOKEN, 
    "User-Token": process.env.RUNRUN_USER_TOKEN,
    "Content-Type": "application/json"
  };

  try {
    // Faz as duas buscas ao mesmo tempo
    const [resAbertos, resFechados] = await Promise.all([
      fetch(urlAbertos, { method: 'GET', headers }),
      fetch(urlFechados, { method: 'GET', headers })
    ]);

    const abertos = await resAbertos.json();
    const fechados = await resFechados.json();

    // Junta as duas listas em um único array
    const todasAsTasks = [
      ...(Array.isArray(abertos) ? abertos : []),
      ...(Array.isArray(fechados) ? fechados : [])
    ];

    res.status(200).json(todasAsTasks);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
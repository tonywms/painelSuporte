export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://runrun.it/api/v1.1/tasks?board_id=597967&limit=100",
      {
        method: 'GET',
        headers: {
          "App-Token": "5d34905dc4f5b7bbd96616fd27111300",
          "User-Token": "3dt0GbitZvU4bvGC8RGs",
          "Accept": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro na API Runrun.it", details: data });
    }

    // Retorna os dados prontos para o seu componente Main
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Falha na requisição", message: error.message });
  }
}
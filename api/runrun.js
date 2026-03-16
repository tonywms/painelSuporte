export default async function handler(req, res) {
  try {
    // A URL deve conter exatamente o board_id do seu JSON
    const response = await fetch(
    "https://runrun.it/api/v1.0/tasks?board_id=597967&limit=100", 
    {
        method: 'GET',
        headers: {
        "App-Key": process.env.RUNRUN_APP_TOKEN, 
        "User-Token": process.env.RUNRUN_USER_TOKEN,
        "Content-Type": "application/json",
        "Accept": "application/json"
        }
    }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        erro: "O Runrun.it recusou a chave", 
        detalhes: data 
      });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ 
      erro: "Falha no servidor da Vercel", 
      mensagem: error.message 
    });
  }
}
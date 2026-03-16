export default async function handler(req, res) {
  try {

    const response = await fetch(
      "https://runrun.it/api/v1.0/tasks?board_id=597967&limit=100",
      {
        method: "GET",
        headers: {
          "App-Token": process.env.RUNRUN_APP_TOKEN,
          "User-Token": process.env.RUNRUN_USER_TOKEN,
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      }
    );

    const data = await response.text();

    res.status(response.status).send(data);

  } catch (error) {

    res.status(500).json({
      error: "Erro conexão Runrun",
      message: error.message
    });

  }
}
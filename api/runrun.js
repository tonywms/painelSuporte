export default async function handler(req, res) {
  try {

    const url = "https://runrun.it/api/v1.0/tasks?board_id=597967&limit=100";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "App-Token": process.env.RUNRUN_APP_TOKEN,
        "User-Token": process.env.RUNRUN_USER_TOKEN
      }
    });

    const data = await response.text();

    res.status(response.status).send(data);

  } catch (error) {

    res.status(500).json({
      error: "Erro ao conectar com Runrun",
      message: error.message
    });

  }
}
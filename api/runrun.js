export default async function handler(req, res) {

  const response = await fetch(
    "https://runrun.it/api/v1.1/tasks?board_id=597967&limit=100",
    {
      method: "GET",
      headers: {
        "App-Token": process.env.RUNRUN_APP_TOKEN,
        "User-Token": process.env.RUNRUN_USER_TOKEN,
        "Accept": "application/json"
      }
    }
  );

  const text = await response.text();

  res.status(response.status).send(text);
}
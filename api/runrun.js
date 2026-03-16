export default async function handler(req, res) {

  const response = await fetch(
    "https://runrun.it/api/v1.1/tasks?board_id=597967&limit=100",
    {
      headers: {
        "App-Token": process.env.RUNRUN_APP_TOKEN,
        "User-Token": process.env.RUNRUN_USER_TOKEN,
        "Accept": "application/json"
      }
    }
  );

  const data = await response.json();

  res.status(200).json(data);
}
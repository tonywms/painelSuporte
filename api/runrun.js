export default async function handler(req, res) {
  const { page = 1 } = req.query; 
  const url = `https://runrun.it/api/v1.0/tasks?board_id=597967&limit=100&is_closed=all&page=${page}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "App-Key": process.env.RUNRUN_APP_TOKEN, 
        "User-Token": process.env.RUNRUN_USER_TOKEN,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}
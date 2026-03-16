export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {

    const boardId = '597967';

    const response = await fetch(
      `https://runrun.it/api/v1.0/tasks?board_id=${boardId}&limit=100`,
      {
        method: 'GET',
        headers: {
          'app-token': process.env.RUNRUN_APP_TOKEN,
          'user-token': process.env.RUNRUN_USER_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({
        error: "Erro Runrun",
        details: error
      });
    }

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: "Erro interno",
      message: err.message
    });
  }
}
import https from "https";

export default async function handler(req, res) {

  const options = {
    hostname: "runrun.it",
    path: "/api/v1.0/tasks?board_id=597967",
    method: "GET",
    headers: {
      "App-Token": process.env.RUNRUN_APP_TOKEN,
      "User-Token": process.env.RUNRUN_USER_TOKEN
    }
  };

  const request = https.request(options, response => {

    let data = "";

    response.on("data", chunk => {
      data += chunk;
    });

    response.on("end", () => {
      res.status(response.statusCode).send(data);
    });

  });

  request.on("error", error => {
    res.status(500).json({
      error: "Erro conexão",
      message: error.message
    });
  });

  request.end();
}
// api/runrun.js
export default async function handler(req, res) {
    try {
        // A documentação exige que filtros como board_id sejam passados na Query String
        const boardId = '597967';
        const url = `https://runrun.it/api/v1.1/tasks?board_id=${boardId}&limit=100`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'App-Token': '5d34905dc4f5b7bbd96616fd27111300',
                'User-Token': '3dt0GbitZvU4bvGC8RGs',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Se o Runrun.it retornar erro, repassamos para o log para você ver
        if (!response.ok) {
            const errorData = await response.text();
            console.error("Erro do Runrun.it:", errorData);
            return res.status(response.status).json({ error: "Erro na API externa", details: errorData });
        }

        const data = await response.json();
        
        // Retornamos os dados limpos para o seu painel
        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro interno:", error);
        return res.status(500).json({ error: "Erro interno no servidor", message: error.message });
    }
}
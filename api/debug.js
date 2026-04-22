export default function handler(req,res){
  res.json({
    app: process.env.RUNRUN_APP_TOKEN,
    user: process.env.RUNRUN_USER_TOKEN
  })
}
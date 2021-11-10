const config = require('./services/config')
const express = require('express')
const app = express()
const { bot, listen } = require('./services/bot')

app.use(express.json())

app.post(`/bot${config.TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

listen()

const start = async () => {
  try {
    await bot.setWebHook(`${config.URL}/bot${config.TOKEN}`)
    app.listen(config.PORT, () => {
      console.log(`Server is listening on port ${config.PORT} ...`)
    })
  } catch (e) {
    throw new Error(e)
  }
}
start()

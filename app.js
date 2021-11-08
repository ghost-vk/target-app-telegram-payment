const config = require('./services/config')
const express = require('express')
const app = express()
const { bot, listen } = require('./services/bot')

config.setUrl('https://6c23-185-15-62-94.ngrok.io')

app.use(express.json())

app.post(`/bot${config.TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

listen()

const start = async () => {
  try {
    await bot.setWebHook(`${config.URL}/bot${config.TOKEN}`)
    // await bot.sendPhoto(1398952457, 'AgACAgIAAxkBAAMeYYeKqqmj2k8CCnuKETBqeWPGE28AAmW4MRsV_ThIlRGbMMZ2e_QBAAMCAAN5AAMiBA')
    app.listen(config.PORT, () => {
      console.log(`Server is listening on port ${config.PORT} ...`)
    })
  } catch (e) {
    throw new Error(e)
  }
}
start()

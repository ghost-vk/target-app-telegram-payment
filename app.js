const config = require('./services/config')
const express = require('express')
const app = express()
const { bot, listen } = require('./services/bot')
const https = require('https')
const fs = require('fs')

app.use(express.json())

app.post(`/bot${config.TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

listen()

const start = async () => {
  try {
    await bot.setWebHook(`${config.URL}/bot${config.TOKEN}`)
    if (config.isProduction) {
      const httpsServer = https.createServer(
        {
          key: fs.readFileSync(
            '/etc/letsencrypt/live/anastasi-target.ru/privkey.pem'
          ),
          cert: fs.readFileSync(
            '/etc/letsencrypt/live/anastasi-target.ru/cert.pem'
          ),
          ca: fs.readFileSync(
            '/etc/letsencrypt/live/anastasi-target.ru/chain.pem'
          ),
        },
        app
      )
      httpsServer.listen(config.PORT, () => {
        console.log(`Server is listening on port ${config.PORT} ...`)
      })
    } else {
      app.listen(config.PORT, () => {
        console.log(`Server is listening on port ${config.PORT} ...`)
      })
    }
  } catch (e) {
    throw new Error(e)
  }
}
start()

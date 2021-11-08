const TelegramBot = require('node-telegram-bot-api')
const config = require('./config')
const Receive = require('./receive')

const bot = new TelegramBot(config.TOKEN)

module.exports = {
  bot,
  listen() {
    bot.on('message', async (msg) => {
      try {
        console.log('🔵 get message: ', msg)
        const response = await Receive.handleMessage(msg)
        if (!response) {
          return false
        }
        console.log(response)

        const sentMessage = await bot.sendMessage(...response)
        console.log('🔵 sent message: ', sentMessage)
        return sentMessage

      } catch (e) {
        throw new Error(e)
      }
    })
    // Action from inline keyboard
    bot.on('callback_query', async (msg) => {
      try {
        console.log('🔵 get callback_query: ', msg)
        const response = await Receive.handleCallbackQuery(msg)
        if (!response) {
          return false
        }
        const sentMessage = await bot.sendMessage(...response)
        console.log('🔵 sent message: ', sentMessage)
        return sentMessage
      } catch (e) {
        throw new Error(e)
      }
    })
  },
}

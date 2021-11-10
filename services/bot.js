const TelegramBot = require('node-telegram-bot-api')
const config = require('./config')
const Receive = require('./receive')

const bot = new TelegramBot(config.TOKEN)

const send = async (responses) => {
  try {
    if (!Array.isArray(responses)) {
      console.warn('🔴 responses is not array')
      return false
    }

    if (responses.length === 0) {
      console.warn('🟡 responses is empty')
      return false
    }

    let sentMessage
    for (const r of responses) {
      if (r.type === 'message') {
        let args = []
        args.push(r.chatId)
        args.push(r.text)
        if (r?.form !== undefined) {
          args.push(r.form)
        }
        sentMessage = await bot.sendMessage(...args)
        console.log('🔵 sent message: ', sentMessage)
      } else if (r.type === 'photo') {
        sentMessage = await bot.sendPhoto(r.chatId, r.photo)
        console.log('🔵 sent photo: ', sentMessage)
      } else if (r.type === 'document') {
        sentMessage = await bot.sendDocument(r.chatId, r.doc)
        console.log('🔵 sent document: ', sentMessage)
        return
      } else {
        console.warn('🔴 response type is not passed')
      }
    }
  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  bot,
  listen() {
    bot.on('message', async (msg) => {
      try {
        console.log('🔵 got message: ', msg)
        const responses = await Receive.handleMessage(msg)
        console.log('🔵 Message is handled, got responses: ', responses)
        await send(responses)
        return true
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

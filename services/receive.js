const Response = require('./response')
const Cart = require('./cart')
const User = require('./user')

class Receive {
  static async handleMessage(msg) {
    const response = [msg.chat.id]
    const { text, form } = Response.genProducts()
    response.push(text, form)
    return response
  }
  static handleBotCommand() {}
  static handlePhoto() {}
  static handleFile() {}
  static async handlePayload(payload, chatId) {
    try {
      let paymentMethod
      switch (payload) {
        case 'START_CHAT': {
          const { text, form } = Response.genProducts()
          return { text, form }
        }
        case 'MATERIALS_START': {
          const { text, form } = Response.genAvailableMaterials()
          return { text, form }
        }
        case 'EXIST_PRODUCT': {
          const currentProductId = await Cart.getProductFromUserCart(chatId)
          const { text, form } = await Response.genPaymentMethods(
            currentProductId
          )
          return { text, form }
        }
        case 'TARGET_START': {
          const productId = 1
          await Cart.addToCart(chatId, productId)
          const { text, form } = await Response.genPaymentMethods(productId)
          return { text, form }
        }
        case 'CONSULTATION_START': {
          const productId = 2
          await Cart.addToCart(chatId, productId)
          const { text, form } = await Response.genPaymentMethods(productId)
          return { text, form }
        }
        case 'MATERIAL_WORKS_WITH_CLIENT': {
          const productId = 3
          await Cart.addToCart(chatId, productId)
          const { text, form } = await Response.genPaymentMethods(productId)
          return { text, form }
        }
        case 'METHOD_SBER': {
          paymentMethod = 'Сбербанк Онлайн'
          const currentProductId = await Cart.getProductFromUserCart(chatId)
          const header = await Response.genPaymentRequestMessageHeader(
            paymentMethod,
            currentProductId
          )
          const body = Response.genPaymentBodySber()
          const footer = Response.genPaymentRequestFooter()
          const form = Response.genPaymentRequestForm()
          const text = header + body + footer
          return { text, form }
        }
        case 'METHOD_TIN': {
          paymentMethod = 'Тинькофф'
          const currentProductId = await Cart.getProductFromUserCart(chatId)
          const header = await Response.genPaymentRequestMessageHeader(
            paymentMethod,
            currentProductId
          )
          const body = Response.genPaymentBodyTink()
          const footer = Response.genPaymentRequestFooter()
          const form = Response.genPaymentRequestForm()
          const text = header + body + footer
          return { text, form }
        }
        case 'METHOD_VTB': {
          paymentMethod = 'ВТБ Онлайн'
          const currentProductId = await Cart.getProductFromUserCart(chatId)
          const header = await Response.genPaymentRequestMessageHeader(
            paymentMethod,
            currentProductId
          )
          const body = Response.genPaymentBodyVtb()
          const footer = Response.genPaymentRequestFooter()
          const form = Response.genPaymentRequestForm()
          const text = header + body + footer
          return { text, form }
        }
        case 'METHOD_QIWI': {
          paymentMethod = 'QIWI'
          const currentProductId = await Cart.getProductFromUserCart(chatId)
          const header = await Response.genPaymentRequestMessageHeader(
            paymentMethod,
            currentProductId
          )
          const body = Response.genPaymentBodyQiwi()
          const footer = Response.genPaymentRequestFooter()
          const form = Response.genPaymentRequestForm()
          const text = header + body + footer
          return { text, form }
        }
        case 'METHOD_PP': {
          paymentMethod = 'PayPal'
          const currentProductId = await Cart.getProductFromUserCart(chatId)
          const header = await Response.genPaymentRequestMessageHeader(
            paymentMethod,
            currentProductId
          )
          const body = Response.genPaymentBodyPaypal()
          const footer = Response.genPaymentRequestFooter()
          const form = Response.genPaymentRequestForm()
          const text = header + body + footer
          return { text, form }
        }
        case 'CONFIRM_PAYMENT_REQUEST': {
          await User.setPaymentStatus(chatId, 0) // works
          const { text, form } = Response.genReceiptRequest()
          return { text, form }
        }
        default: {
          return false
        }
      }
    } catch (e) {
      throw new Error(e)
    }
  }
  static async handleCallbackQuery(query) {
    try {
      if (query.from.is_bot) {
        return false
      }

      const response = [query.from.id]

      const { text, form } = await this.handlePayload(query.data, response[0])
      console.log(`🔵 text from handlePayload:`, text)
      console.log(`🔵 form from handlePayload:`, form)
      if (text) {
        response.push(text)
      }
      if (form) {
        response.push(form)
      }

      return response
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = Receive

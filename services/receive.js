const Response = require('./response')
const Cart = require('./cart')
const User = require('./user')
const Admin = require('./admin')
const { ghostId, isAdmin, paymentStatus } = require('./config')
const i18n = require('./../i18n.config')
const store = require('./store')

class Receive {
  static async handleMessage(msg) {
    try {
      let responses = []

      if (msg?.entities) {
        responses = await this.handleEntities(msg)
        if (!responses || responses.length === 0) {
          responses = await this.defaultResponse(msg.chat.id)
        }
        return responses
      }

      if (isAdmin(msg.chat.id)) {
        responses = await this.handleAdminMessage(msg)
        if (!responses || responses.length === 0) {
          responses = await this.defaultResponse(msg.chat.id)
        }
        return responses
      }

      const userPaymentStatus = await User.getPaymentStatus(msg.chat.id)
      if (userPaymentStatus === paymentStatus.waitingReceipt) {
        console.log('🔵 waiting for receipt ...')
        if (msg?.photo) {
          console.log('🔵 try handling photo ...')
          responses = await this.handlePhotoReceipt(msg)
        } else if (msg?.document) {
          responses = await this.handleFileReceipt(msg)
        } else {
          // waiting for photo of receipt but get something else
          const { text, form } = Response.genWrongReceiptType()
          responses.push({
            type: 'message',
            chatId: msg.chat.id,
            text,
            form,
          })
        }
        if (!responses || responses.length === 0) {
          responses = await this.defaultResponse(msg.chat.id)
        }
        return responses
      } else if (userPaymentStatus === paymentStatus.waitingConfirm) {
        const { text } = Response.genPaymentAlreadyProcessing()
        responses.push({
          type: 'message',
          chatId: msg.chat.id,
          text,
        })
      }

      if (!responses || responses.length === 0) {
        responses = await this.defaultResponse(msg.chat.id)
      }

      return responses
    } catch (e) {
      throw new Error(e)
    }
  }

  static async handleAdminMessage(msg) {
    let responses = []
    try {
      let userPaymentStatus = await User.getPaymentStatus(msg.chat.id)
      if (msg?.photo && userPaymentStatus === paymentStatus.waitingReceipt) {
        console.log('🔵 try handling photo ...')
        responses = await this.handlePhotoReceipt(msg)
        return responses
      } else if (
        msg?.document &&
        userPaymentStatus === paymentStatus.waitingReceipt
      ) {
        responses = await this.handleFileReceipt(msg)
        return responses
      }

      if (
        msg.text === i18n.__('admin.unhandled_payment_list') &&
        isAdmin(msg.chat.id)
      ) {
        const { text, form } = await Admin.listUnhandledPayments()
        responses.push({
          type: 'message',
          chatId: msg.chat.id,
          text,
          form,
        })
      }

      if (
        msg.text === i18n.__('admin.confirm_payment') &&
        isAdmin(msg.chat.id)
      ) {
        store.adminAction = 'confirm'
        responses.push({
          type: 'message',
          chatId: msg.chat.id,
          text: '🟢 Отправьте ID',
        })
        return responses
      }

      if (
        msg.text === i18n.__('admin.reject_payment') &&
        isAdmin(msg.chat.id)
      ) {
        store.adminAction = 'reject'
        responses.push({
          type: 'message',
          chatId: msg.chat.id,
          text: '🔴 Отправьте ID',
        })
        return responses
      }

      // waiting chat ID
      if (isAdmin(msg.chat.id) && Number(msg?.text?.trim()) > 0) {
        responses = await this.handlePayment(msg)
        return responses
      }

      return responses
    } catch (e) {
      throw new Error(e)
    }
  }

  static async handleEntities(msg) {
    let responses = []
    try {
      if (msg.entities.find((e) => e.type === 'bot_command')) {
        responses = await this.handleBotCommand(msg)
        return responses
      }

      // waiting chat ID
      if (isAdmin(msg.chat.id) && Number(msg?.text?.trim()) > 0) {
        responses = await this.handlePayment(msg)
        return responses
      }
    } catch (e) {
      throw new Error(e)
    }
  }
  static async handleBotCommand(msg) {
    try {
      switch (msg.text.toLowerCase()) {
        case '/admin': {
          let responses = []
          if (!isAdmin(msg.chat.id)) {
            console.log('no admin')
            return responses
          }
          const { text, form } = Response.genSuccessAdminAuth()
          responses.push({
            type: 'message',
            chatId: msg.chat.id,
            text,
            form,
          })
          return responses
        }
        case '/start': {
          const existUser = await User.getUserByChatId(msg.chat.id)
          const isUserExist = !!existUser?.chat_id

          if (!isUserExist) {
            await User.addNew(msg.chat.id, msg.chat.username)
          }

          const { text, form } = Response.genProducts()
          let responses = [
            {
              type: 'message',
              chatId: msg.chat.id,
              text,
              form,
            },
          ]
          return responses
        }
      }
    } catch (e) {
      throw new Error(e)
    }
  }
  static async handlePhotoReceipt(msg) {
    console.log('🔵 try handlePhotoReceipt')
    let responses = []
    try {
      const photoId = msg.photo[msg.photo.length - 1].file_id

      if (photoId) {
        const currentProductId = await Cart.getProductFromUserCart(msg.chat.id)
        const toOperator = await Response.genReceiptToOperator(
          msg.chat.id,
          currentProductId
        )
        const toClient = Response.genSuccessReceiptSending()
        responses.push(
          {
            type: 'photo',
            chatId: ghostId,
            photo: photoId,
          },
          {
            type: 'message',
            chatId: ghostId,
            text: toOperator.text,
            form: toOperator.form,
          },
          {
            type: 'message',
            chatId: msg.chat.id,
            text: toClient.text,
            form: toClient.form,
          }
        )
      }

      await User.setPaymentStatus(msg.chat.id, paymentStatus.waitingConfirm)

      return responses
    } catch (e) {
      throw new Error(e)
    }
  }
  static async handleFileReceipt(msg) {
    let responses = []
    try {
      const fileName = msg.document.file_name.toLowerCase()
      const splitFileName = fileName.split('.')
      const ext = splitFileName[splitFileName.length - 1]
      if (!['jpg', 'jpeg', 'pdf', 'png'].includes(ext)) {
        const { text, form } = Response.genWrongReceiptType()
        responses.push({
          type: 'message',
          chatId: msg.chat.id,
          text,
          form,
        })
        return responses
      }

      const fileId = msg.document.file_id

      if (fileId) {
        const currentProductId = await Cart.getProductFromUserCart(msg.chat.id)
        const toOperator = await Response.genReceiptToOperator(
          msg.chat.id,
          currentProductId
        )
        const toClient = Response.genSuccessReceiptSending()
        responses.push({
          type: 'document',
          chatId: ghostId,
          doc: fileId,
        })
        responses.push({
          type: 'message',
          chatId: ghostId,
          text: toOperator.text,
          form: toOperator.form,
        })
        responses.push({
          type: 'message',
          chatId: msg.chat.id,
          text: toClient.text,
          form: toClient.form,
        })
      }

      await User.setPaymentStatus(msg.chat.id, paymentStatus.waitingConfirm)

      return responses
    } catch (e) {
      throw new Error(e)
    }
  }
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
          const productId = 7
          await Cart.addToCart(chatId, productId)
          const { text, form } = await Response.genPaymentMethods(productId)
          return { text, form }
        }
        case 'MATERIAL_WORKS_WITH_CLIENT': {
          const productId = 8
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
          await User.setPaymentStatus(chatId, paymentStatus.waitingReceipt)
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

  static async handlePayment(msg) {
    let responses = []
    try {
      if (isAdmin(msg.chat.id) && Number(msg?.text?.trim()) > 0) {
        const clientId = Number(msg?.text.trim())
        if (!store.adminAction) {
          responses.push({
            type: 'message',
            chatId: msg.chat.id,
            text: 'Выберите действие для обработки ID на клавиатуре',
          })
          return responses
        }

        console.log('✅ test')

        if (store.adminAction === 'confirm') {
          await User.setPaymentStatus(clientId, paymentStatus.confirmed)
          const { text } = await Response.genPaymentConfirmed(clientId)
          const { username } = await User.getUserByChatId(clientId)
          await Cart.addToCart(clientId, null)
          responses.push(
            {
              type: 'message',
              chatId: msg.chat.id,
              text: `✅ Подтверждено\nID: ${clientId}\nUser: @${username}`,
            },
            {
              type: 'message',
              chatId: clientId,
              text,
            }
          )
          return responses
        } else if (store.adminAction === 'reject') {
          await User.setPaymentStatus(clientId, paymentStatus.rejected)
          const { text } = Response.genPaymentRejected()
          const { username } = await User.getUserByChatId(clientId)
          await Cart.addToCart(clientId, null)
          responses.push(
            {
              type: 'message',
              chatId: msg.chat.id,
              text: `✅ Платеж отклонен\nID: ${clientId}\nUser: @${username}`,
            },
            {
              type: 'message',
              chatId: clientId,
              text,
            }
          )
          return responses
        }
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  static async defaultResponse(chatId) {
    try {
      const { text, form } = Response.genDefaultResponse()
      return [{ type: 'message', chatId, text, form }]
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = Receive

const {
  InlineKeyboard,
  ReplyKeyboard,
  KeyboardButton,
  Row,
  InlineKeyboardButton,
} = require('node-telegram-keyboard-wrapper')
const i18n = require('./../i18n.config')
const Product = require('./product')
const Cart = require('./cart')
const config = require('./config')
const User = require('./user')

const paymentStartKb = new InlineKeyboard()
paymentStartKb.push(
  new Row(
    new InlineKeyboardButton('Материалы', 'callback_data', 'MATERIALS_START')
  ),
  new Row(
    new InlineKeyboardButton(
      'Консультация',
      'callback_data',
      'CONSULTATION_START'
    )
  ),
  new Row(new InlineKeyboardButton('Таргет', 'callback_data', 'TARGET_START'))
)

const paymentMethodsKb = new InlineKeyboard()
paymentMethodsKb.push(
  new Row(
    new InlineKeyboardButton('Сбербанк Онлайн', 'callback_data', 'METHOD_SBER')
  ),
  new Row(new InlineKeyboardButton('Тинькофф', 'callback_data', 'METHOD_TIN')),
  new Row(new InlineKeyboardButton('ВТБ', 'callback_data', 'METHOD_VTB')),
  new Row(new InlineKeyboardButton('QIWI', 'callback_data', 'METHOD_QIWI')),
  new Row(new InlineKeyboardButton('PayPal', 'callback_data', 'METHOD_PP')),
  new Row(
    new InlineKeyboardButton(
      i18n.__('payment.back'),
      'callback_data',
      'START_CHAT'
    )
  )
)

const adminReplyKb = new ReplyKeyboard(
  new Row(
    new KeyboardButton(i18n.__('admin.confirm_payment')),
    new KeyboardButton(i18n.__('admin.reject_payment'))
  ),
  new Row(new KeyboardButton(i18n.__('admin.unhandled_payment_list')))
)

const availableMaterialsKb = new InlineKeyboard()
availableMaterialsKb.push(
  new Row(
    new InlineKeyboardButton(
      i18n.__('materials.works_with_client'),
      'callback_data',
      'MATERIAL_WORKS_WITH_CLIENT'
    )
  ),
  new Row(
    new InlineKeyboardButton(
      i18n.__('payment.back'),
      'callback_data',
      'START_CHAT'
    )
  )
)

const confirmKb = new InlineKeyboard()
confirmKb.push(
  new Row(
    new InlineKeyboardButton(
      '✅ Готово',
      'callback_data',
      'CONFIRM_PAYMENT_REQUEST'
    )
  ),
  new Row(
    new InlineKeyboardButton('👨‍💻 Поддержка', 'url', 'https://t.me/ghost_vkv')
  ),
  new Row(
    new InlineKeyboardButton(
      i18n.__('payment.back'),
      'callback_data',
      'EXIST_PRODUCT'
    )
  )
)

const supportKb = new InlineKeyboard(
  new Row(
    new InlineKeyboardButton('👨‍💻 Поддержка', 'url', 'https://t.me/ghost_vkv')
  )
)

class Response {
  static genProducts() {
    return {
      text: i18n.__('payment.before_products_list'),
      form: {
        reply_markup: paymentStartKb.getMarkup(),
      },
    }
  }

  static async genPaymentMethods(productId) {
    try {
      const product = await Product.getInfo(productId)
      return {
        text: i18n.__('payment.before_payment_methods', {
          title: product.title,
          price: product.price,
          description: product.description,
        }),
        form: {
          reply_markup: paymentMethodsKb.getMarkup(),
          parse_mode: 'markdown',
        },
      }
    } catch (e) {}
  }

  static genAvailableMaterials() {
    return {
      text: i18n.__('materials.pick_material'),
      form: {
        reply_markup: availableMaterialsKb.getMarkup(),
      },
    }
  }

  static async genPaymentRequestMessageHeader(paymentMethod, productId) {
    try {
      const product = await Product.getInfo(productId)
      return i18n.__('payment.payment_head', {
        paymentMethod,
        price: product.price,
      })
    } catch (e) {
      throw new Error(e)
    }
  }

  static genPaymentRequestFooter() {
    return i18n.__('payment.payment_footer')
  }

  static genPaymentRequestForm() {
    return {
      reply_markup: confirmKb.getMarkup(),
      parse_mode: 'markdown',
    }
  }

  static genPaymentBodySber() {
    return i18n.__('payment.payment_sber', {
      cardNumber: config.cardSber,
    })
  }

  static genPaymentBodyTink() {
    return i18n.__('payment.payment_tin', {
      cardNumber: config.cardTink,
    })
  }

  static genPaymentBodyVtb() {
    return i18n.__('payment.payment_vtb', {
      cardNumber: config.cardVtb,
    })
  }

  static genPaymentBodyQiwi() {
    return i18n.__('payment.payment_qiwi')
  }

  static genPaymentBodyPaypal() {
    return i18n.__('payment.payment_paypal')
  }

  static genReceiptRequest() {
    return {
      text: i18n.__('payment.receipt_request'),
    }
  }

  static genRequestUsername() {
    return {
      text: i18n.__('payment.no_username'),
    }
  }

  static genWrongReceiptType() {
    return {
      text: i18n.__('payment.wrong_receipt_type'),
      form: {
        parse_mode: 'markdown',
      },
    }
  }

  static genSuccessReceiptSending() {
    return {
      text: i18n.__('payment.success_receipt_sending'),
      form: {
        reply_markup: supportKb.getMarkup(),
      },
    }
  }

  static async genReceiptToOperator(chatId, productId) {
    try {
      const { title, price } = await Product.getInfo(productId)
      const { username } = await User.getUserByChatId(chatId)
      return {
        text: i18n.__('payment.receipt_to_operator', {
          userId: chatId,
          productTitle: title,
          price,
          username,
        }),
        form: {
          parse_mode: 'markdown',
        },
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  static genSuccessAdminAuth() {
    return {
      text: 'Успешная авторизация ✅\nМожно выбирать действия на клавиатуре 👇',
      form: {
        reply_markup: adminReplyKb.getMarkup(),
      },
    }
  }

  static async genPaymentConfirmed(chatId) {
    try {
      const productId = await Cart.getProductFromUserCart(chatId)
      const { category, secret_link, title } = await Product.getInfo(productId)
      let text = ''
      let form = {}
      switch (category) {
        case 'target': {
          text = 'Ожидайте, скоро Вам отправят два брифа для заполнения'
          break
        }
        case 'consultation': {
          text = 'Ожидайте, скоро с Вами свяжутся'
          break
        }
        case 'materials': {
          if (secret_link) {
            text = 'Чтобы получить материал нажмите на кнопку 👇'
            const kb = new InlineKeyboard(
              new Row(new InlineKeyboardButton(title, 'url', secret_link))
            )
            form = { reply_markup: kb.getMarkup() }
          } else {
            text =
              'Что-то пошло не так, отравьте нам пожалуйста переписку с ботом 👇'
            form = { reply_markup: supportKb.getMarkup() }
          }
          break
        }
        case 'telegram': {
          text = 'Ожидайте, скоро Ваc добавят в закрытый чат'
          break
        }
      }
      return {
        text: i18n.__('payment.payment_confirmed', { text }),
        form,
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  static genPaymentRejected() {
    return {
      text: i18n.__('payment.payment_rejected'),
    }
  }

  static genPaymentAlreadyProcessing() {
    return {
      text: i18n.__('payment.payment_already_processing'),
    }
  }

  static genDefaultResponse() {
    return {
      text: i18n.__('payment.default_response'),
      form: {
        reply_markup: supportKb.getMarkup(),
      },
    }
  }
}

module.exports = Response

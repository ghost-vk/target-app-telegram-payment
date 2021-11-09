const {
  InlineKeyboard,
  ReplyKeyboard,
  Row,
  InlineKeyboardButton,
} = require('node-telegram-keyboard-wrapper')
const i18n = require('./../i18n.config')
const Product = require('./product')
const config = require('./config')

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
      form: {
        parse_mode: 'markdown'
      }
    }
  }

  static genWrongReceiptType() {
    return {
      text: i18n.__('payment.wrong_receipt_type'),
      form: {
        parse_mode: 'markdown'
      }
    }
  }

  static genSuccessReceiptSending() {
    return {
      text: i18n.__('payment.success_receipt_sending'),
      form: {
        parse_mode: 'markdown'
      }
    }
  }

  static async genReceiptToOperator(chatId, productId) {
    try {
      const { title, price } = await Product.getInfo(productId)
      return {
        text: i18n.__('payment.receipt_to_operator', {
          userId: chatId,
          productTitle: title,
          price: price
        }),
        form: {
          parse_mode: 'markdown'
        }
      }
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = Response

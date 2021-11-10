const Product = require('./product')
const db = require('./../db')

class AdminMessages {
  static async listUnhandledPayments() {
    try {
      const result = await db.query(
        'SELECT * FROM tg_payment_users WHERE payment_status = 1'
      )
      if (result.rows.length === 0) {
        return {
          text: 'Все платежи обработаны ✅',
        }
      }
      let text = `*Необработанные платежи*\n\n`
      for (const u of result.rows) {
        text += `User ID: \`${u.chat_id}\`\n`
        const { title, price } = await Product.getInfo(u.item_in_cart)
        text += `Сумма: ${price} RUB\nНаименование: ${title}\n\n`
      }
      return {
        form: {
          parse_mode: 'markdown',
        },
        text,
      }
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = AdminMessages

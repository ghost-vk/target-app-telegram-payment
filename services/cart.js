const db = require('./../db')

class Cart {
  static async addToCart(chatId, itemId) {
    try {
      const result = await db.query(
        `UPDATE tg_payment_users
        SET item_in_cart = $1
        WHERE chat_id = $2 RETURNING *`,
        [itemId, chatId]
      )

      return result.rows[0]
    } catch (e) {
      throw new Error(e)
    }
  }
  static async getProductFromUserCart(chatId) {
    try {
      const result = await db.query(
        `SELECT item_in_cart FROM tg_payment_users
        WHERE chat_id = $1`,
        [chatId]
      )

      return result.rows[0].item_in_cart
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = Cart

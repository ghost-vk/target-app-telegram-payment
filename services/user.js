const db = require('./../db')

class User {
  static async addNew(chatId) {
    try {
      const result = await db.query(
        `INSERT INTO tg_payment_users (id, chat_id, item_in_cart)
       VALUES (DEFAULT, $1, DEFAULT) RETURNING *`,
        [chatId]
      )
      const user = result.rows.length !== 0 ? result.rows[0] : {}
      return user
    } catch (e) {
      throw new Error(e)
    }
  }

  static async getUserByChatId(chatId) {
    try {
      const result = await db.query(
        `SELECT * FROM tg_payment_users WHERE chat_id = $1`,
        [chatId]
      )
      const user = result.rows.length !== 0 ? result.rows[0] : {}
      return user
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Can be 0, 1, 2, 3, null
   * 0 - waiting receipt
   * 1 - waiting confirm
   * 2 - rejected by admin
   * 3 - payment confirmed by admin
   * null - payment cycle completed or not started
   * @param chatId
   * @param paymentStatus
   */
  static async setPaymentStatus(chatId, paymentStatus) {
    try {
      const result = await db.query(
        `UPDATE tg_payment_users
        SET payment_status = $1
        WHERE chat_id = $2 RETURNING payment_status`,
        [paymentStatus, chatId]
      )
      const status =
        result.rows.length !== 0 ? result.rows[0].payment_status : {}
      return status
    } catch (e) {
      throw new Error(e)
    }
  }

  static async getPaymentStatus(chatId) {
    try {
      const result = await db.query(`SELECT payment_status
        FROM tg_payment_users
        WHERE chat_id = $1`,
        [chatId]
      )
      return result.rows[0].payment_status
    } catch(e) {
      throw new Error(e)
    }
  }
}

module.exports = User

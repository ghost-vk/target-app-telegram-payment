const db = require('./../db')

class Product {
  static async getInfo(productId) {
    try {
      const result = await db.query(
        'SELECT * FROM tg_payment_products WHERE id = $1',
        [productId]
      )
      return result.rows[0]
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports = Product

require('dotenv').config()

module.exports = {
  TOKEN: process.env.TOKEN,
  PORT: process.env.PORT,
  URL: process.env.URL || '',
  dbPassword: process.env.DB_PASSWORD,
  dbUser: process.env.DB_USER,
  dbName: process.env.DB_NAME,
  cardSber: process.env.SBER_CARD,
  cardTink: process.env.TINK_CARD,
  cardVtb: process.env.VTB_CARD,
  qiwiLink: process.env.QIWI_LINK,
  paypalLink: process.env.PAYPAL_LINK,
  ghostId: process.env.GHOST_ID,
  isProduction: process.env.NODE_ENV === 'production',

  paymentStatus: {
    waitingReceipt: 0,
    waitingConfirm: 1,
    rejected: 2,
    confirmed: 3
  },

  isAdmin(id) {
    const userId = Number(id)
    const adminId = Number(process.env.GHOST_ID)
    return !!(userId && adminId && userId === adminId)
  },

  setUrl(url) {
    this.URL = url
  },
}

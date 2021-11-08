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

  setUrl(url) {
    this.URL = url
  }
}
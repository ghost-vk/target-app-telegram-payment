const { dbUser, dbName, dbPassword } = require('./services/config')
const Pool = require('pg').Pool
const pool = new Pool({
  user: dbUser,
  password: dbPassword,
  host: 'localhost',
  port: 5432,
  database: dbName,
})

module.exports = pool

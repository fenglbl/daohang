const mysql = require('mysql2/promise')
require('dotenv').config()

let pool = null

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'daohang',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

async function checkDbConnection() {
  const conn = await getPool().getConnection()
  await conn.ping()
  conn.release()
}

module.exports = {
  getPool,
  checkDbConnection,
}

const { getPool } = require('../config/db')

async function createOperationLog({ userId = null, action, targetType = null, targetId = null, detail = null, ip = null }) {
  const pool = getPool()
  await pool.query(
    `INSERT INTO operation_logs (user_id, action, target_type, target_id, detail, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, targetType, targetId, detail ? JSON.stringify(detail) : null, ip],
  )
}

module.exports = {
  createOperationLog,
}

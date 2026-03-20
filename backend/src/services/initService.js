const bcrypt = require('bcryptjs')
const { getPool } = require('../config/db')

async function safeAddColumn(sql) {
  try {
    const pool = getPool()
    await pool.query(sql)
  } catch (error) {
    const msg = String(error.message || '')
    if (!msg.includes('Duplicate column name')) throw error
  }
}

async function ensureSchema() {
  await safeAddColumn(`ALTER TABLE nav_groups ADD COLUMN is_public TINYINT NOT NULL DEFAULT 0 COMMENT '是否公共导航：1公共 0私有' AFTER user_id`)
  await safeAddColumn(`ALTER TABLE nav_links ADD COLUMN is_public TINYINT NOT NULL DEFAULT 0 COMMENT '是否公共导航：1公共 0私有' AFTER user_id`)
  await safeAddColumn(`ALTER TABLE user_settings ADD COLUMN show_public_nav TINYINT NOT NULL DEFAULT 1 COMMENT '是否显示公共导航：1显示 0隐藏' AFTER search_engine`)
}

async function ensureAdminAccount() {
  const pool = getPool()
  const username = 'fenglbl'
  const plainPassword = '6539593123'
  const nickname = '管理员'

  const [rows] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username])
  if (rows.length) return rows[0].id

  const passwordHash = await bcrypt.hash(plainPassword, 10)
  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash, role, nickname, status)
     VALUES (?, ?, 'admin', ?, 1)`,
    [username, passwordHash, nickname],
  )

  await pool.query(
    `INSERT INTO user_settings (user_id, theme_mode, jump_mode, search_engine, show_public_nav)
     VALUES (?, 'system', 'online', 'bing', 1)
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [result.insertId],
  )

  return result.insertId
}

module.exports = {
  ensureSchema,
  ensureAdminAccount,
}

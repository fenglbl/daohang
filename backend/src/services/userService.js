const { getPool } = require('../config/db')

async function ensureUserSettings(userId) {
  const pool = getPool()
  await pool.query(
    `INSERT INTO user_settings (user_id, show_public_nav)
     SELECT ?, 1 FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = ?)`,
    [userId, userId],
  )
}

async function getUserSettings(userId) {
  const pool = getPool()
  const [rows] = await pool.query(
    `SELECT user_id, theme_mode, jump_mode, search_engine, show_public_nav
       FROM user_settings
      WHERE user_id = ?
      LIMIT 1`,
    [userId],
  )
  return rows[0] || null
}

async function updateUserSettings(userId, payload = {}) {
  const pool = getPool()
  const { themeMode, jumpMode, searchEngine, showPublicNav } = payload
  await ensureUserSettings(userId)
  await pool.query(
    `UPDATE user_settings
        SET theme_mode = COALESCE(?, theme_mode),
            jump_mode = COALESCE(?, jump_mode),
            search_engine = COALESCE(?, search_engine),
            show_public_nav = COALESCE(?, show_public_nav)
      WHERE user_id = ?`,
    [
      themeMode ?? null,
      jumpMode ?? null,
      searchEngine ?? null,
      typeof showPublicNav === 'undefined' ? null : (Number(showPublicNav) === 1 ? 1 : 0),
      userId,
    ],
  )
  return getUserSettings(userId)
}

module.exports = {
  ensureUserSettings,
  getUserSettings,
  updateUserSettings,
}

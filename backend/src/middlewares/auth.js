const { getPool } = require('../config/db')

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ success: false, message: '未登录或 token 缺失' })
    }

    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT s.id, s.user_id, s.token, s.expire_at, s.is_valid,
              u.username, u.role, u.nickname, u.avatar_url, u.status
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
          AND s.is_valid = 1
          AND u.status = 1
        LIMIT 1`,
      [token],
    )

    if (!rows.length) {
      return res.status(401).json({ success: false, message: '登录已失效，请重新登录' })
    }

    const session = rows[0]
    if (session.expire_at && new Date(session.expire_at).getTime() < Date.now()) {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' })
    }

    req.user = {
      id: session.user_id,
      username: session.username,
      role: session.role,
      nickname: session.nickname,
      avatar_url: session.avatar_url,
      token: session.token,
      session_id: session.id,
    }

    next()
  } catch (error) {
    next(error)
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '仅管理员可操作' })
  }
  next()
}

module.exports = {
  authMiddleware,
  adminOnly,
}

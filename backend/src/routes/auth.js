const express = require('express')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { getPool } = require('../config/db')
const { ok, fail } = require('../utils/response')
const { generateToken } = require('../utils/token')
const { authMiddleware } = require('../middlewares/auth')
const { createOperationLog } = require('../services/logService')
const { ensureUserSettings, updateUserSettings } = require('../services/userService')

const router = express.Router()
const avatarDir = path.resolve(__dirname, '../../avatars')

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

function toAvatarFilePath(avatarUrl = '') {
  if (!avatarUrl || !avatarUrl.startsWith('/avatars/')) return null
  return path.join(avatarDir, path.basename(avatarUrl))
}

function safeDeleteAvatarFile(avatarUrl = '') {
  const filePath = toAvatarFilePath(avatarUrl)
  if (!filePath) return
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath) } catch (_) {}
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.png'
      cb(null, `user-${req.user.id}-${Date.now()}${ext}`)
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) {
      return cb(new Error('只支持图片文件'))
    }
    cb(null, true)
  },
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
})

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, nickname } = req.body || {}
    if (!username || !password) return fail(res, '用户名和密码不能为空', 400)

    const pool = getPool()
    const [existsRows] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username])
    if (existsRows.length) return fail(res, '用户名已存在', 409)

    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, role, nickname)
       VALUES (?, ?, 'user', ?)`,
      [username, passwordHash, nickname || username],
    )

    await ensureUserSettings(result.insertId)
    await createOperationLog({ userId: result.insertId, action: 'user.register', targetType: 'user', targetId: result.insertId, detail: { username, role: 'user' }, ip: req.ip })

    ok(res, { userId: result.insertId }, '注册成功')
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) return fail(res, '用户名和密码不能为空', 400)

    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, username, password_hash, role, nickname, avatar_url, status
         FROM users
        WHERE username = ?
        LIMIT 1`,
      [username],
    )

    if (!rows.length) return fail(res, '账号不存在', 404)
    const user = rows[0]
    if (user.status !== 1) return fail(res, '账号已被禁用', 403)

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) return fail(res, '密码错误', 401)

    const token = generateToken('access')
    const refreshToken = generateToken('refresh')
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await pool.query(
      `INSERT INTO user_sessions (user_id, token, refresh_token, login_ip, user_agent, expire_at, is_valid)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [user.id, token, refreshToken, req.ip, req.headers['user-agent'] || '', expireAt],
    )

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id])
    await ensureUserSettings(user.id)
    await createOperationLog({ userId: user.id, action: 'user.login', targetType: 'user', targetId: user.id, detail: { username: user.username }, ip: req.ip })

    ok(res, {
      token,
      refreshToken,
      expireAt,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
    }, '登录成功')
  } catch (error) {
    next(error)
  }
})

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.role, u.nickname, u.avatar_url, u.email, u.phone, u.last_login_at,
              s.theme_mode, s.jump_mode, s.search_engine, s.show_public_nav
         FROM users u
         LEFT JOIN user_settings s ON s.user_id = u.id
        WHERE u.id = ?
        LIMIT 1`,
      [req.user.id],
    )

    ok(res, rows[0] || null, '获取当前用户成功')
  } catch (error) {
    next(error)
  }
})

router.post('/avatar', authMiddleware, (req, res, next) => {
  upload.single('avatar')(req, res, async (error) => {
    try {
      if (error) {
        return fail(res, error.message || '头像上传失败', 400)
      }
      if (!req.file) return fail(res, '请选择要上传的图片', 400)

      const avatarUrl = `/avatars/${req.file.filename}`
      const pool = getPool()
      const [rows] = await pool.query('SELECT avatar_url FROM users WHERE id = ? LIMIT 1', [req.user.id])
      const oldAvatarUrl = rows[0]?.avatar_url || ''

      await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id])
      if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
        safeDeleteAvatarFile(oldAvatarUrl)
      }
      await createOperationLog({ userId: req.user.id, action: 'user.avatar.upload', targetType: 'user', targetId: req.user.id, detail: { avatarUrl, removedOldAvatar: !!oldAvatarUrl }, ip: req.ip })

      ok(res, { avatar_url: avatarUrl }, '头像上传成功')
    } catch (err) {
      next(err)
    }
  })
})

router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { nickname, email, phone } = req.body || {}
    const pool = getPool()
    await pool.query(
      `UPDATE users
          SET nickname = COALESCE(?, nickname),
              email = COALESCE(?, email),
              phone = COALESCE(?, phone)
        WHERE id = ?`,
      [
        typeof nickname === 'undefined' ? null : (nickname || null),
        typeof email === 'undefined' ? null : (email || null),
        typeof phone === 'undefined' ? null : (phone || null),
        req.user.id,
      ],
    )

    await createOperationLog({ userId: req.user.id, action: 'user.profile.update', targetType: 'user', targetId: req.user.id, detail: { nickname, email, phone }, ip: req.ip })

    const [rows] = await pool.query(
      `SELECT id, username, role, nickname, avatar_url, email, phone, last_login_at
         FROM users
        WHERE id = ?
        LIMIT 1`,
      [req.user.id],
    )

    ok(res, rows[0] || null, '资料更新成功')
  } catch (error) {
    if (String(error.message || '').includes('Duplicate entry')) {
      return fail(res, '邮箱已被占用', 409)
    }
    next(error)
  }
})

router.put('/password', authMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body || {}
    if (!oldPassword || !newPassword || !confirmPassword) return fail(res, '请填写完整密码信息', 400)
    if (newPassword !== confirmPassword) return fail(res, '两次输入的新密码不一致', 400)
    if (String(newPassword).length < 6) return fail(res, '新密码至少 6 位', 400)

    const pool = getPool()
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.id])
    if (!rows.length) return fail(res, '用户不存在', 404)

    const matched = await bcrypt.compare(oldPassword, rows[0].password_hash)
    if (!matched) return fail(res, '原密码错误', 400)

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id])
    await pool.query(
      `UPDATE user_sessions
          SET is_valid = 0,
              logout_at = NOW()
        WHERE user_id = ?`,
      [req.user.id],
    )
    await createOperationLog({ userId: req.user.id, action: 'user.password.update', targetType: 'user', targetId: req.user.id, detail: { logoutAllSessions: true }, ip: req.ip })

    ok(res, null, '密码修改成功，请重新登录')
  } catch (error) {
    next(error)
  }
})

router.put('/settings', authMiddleware, async (req, res, next) => {
  try {
    const { themeMode, jumpMode, searchEngine, showPublicNav } = req.body || {}
    const settings = await updateUserSettings(req.user.id, { themeMode, jumpMode, searchEngine, showPublicNav })
    await createOperationLog({ userId: req.user.id, action: 'user.settings.update', targetType: 'user_settings', targetId: req.user.id, detail: req.body || {}, ip: req.ip })
    ok(res, settings, '用户设置更新成功')
  } catch (error) {
    next(error)
  }
})

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const pool = getPool()
    await pool.query(
      `UPDATE user_sessions
          SET is_valid = 0,
              logout_at = NOW()
        WHERE id = ?`,
      [req.user.session_id],
    )

    await createOperationLog({ userId: req.user.id, action: 'user.logout', targetType: 'session', targetId: req.user.session_id, ip: req.ip })
    ok(res, null, '退出成功')
  } catch (error) {
    next(error)
  }
})

module.exports = router

const express = require('express')
const { getPool } = require('../config/db')
const { ok, fail } = require('../utils/response')
const { authMiddleware, adminOnly } = require('../middlewares/auth')
const { createOperationLog } = require('../services/logService')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, name, label, search_url, sort_order, is_enabled
         FROM search_engines
        WHERE is_enabled = 1
        ORDER BY sort_order ASC, id ASC`,
    )
    ok(res, rows, '获取搜索引擎配置成功')
  } catch (error) {
    next(error)
  }
})

router.get('/admin', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, name, label, search_url, sort_order, is_enabled, created_at, updated_at
         FROM search_engines
        ORDER BY sort_order ASC, id ASC`,
    )
    ok(res, rows, '获取搜索引擎配置成功')
  } catch (error) {
    next(error)
  }
})

router.post('/', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { name, label, searchUrl, sortOrder = 0, isEnabled = 1 } = req.body || {}
    if (!name || !label || !searchUrl) return fail(res, '名称、显示名和搜索链接不能为空', 400)
    if (!String(searchUrl).includes('{q}')) return fail(res, '搜索链接必须包含 {q} 占位符', 400)

    const pool = getPool()
    const [result] = await pool.query(
      `INSERT INTO search_engines (name, label, search_url, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [String(name).trim(), String(label).trim(), String(searchUrl).trim(), Number(sortOrder) || 0, Number(isEnabled) === 0 ? 0 : 1],
    )

    await createOperationLog({ userId: req.user.id, action: 'search.engine.create', targetType: 'search_engine', targetId: result.insertId, detail: req.body || {}, ip: req.ip })
    ok(res, { id: result.insertId }, '新增搜索引擎成功')
  } catch (error) {
    if (String(error.message || '').includes('Duplicate entry')) return fail(res, '搜索引擎名称已存在', 409)
    next(error)
  }
})

router.put('/:id', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, label, searchUrl, sortOrder, isEnabled } = req.body || {}
    if (typeof searchUrl !== 'undefined' && !String(searchUrl).includes('{q}')) {
      return fail(res, '搜索链接必须包含 {q} 占位符', 400)
    }

    const pool = getPool()
    const [result] = await pool.query(
      `UPDATE search_engines
          SET name = COALESCE(?, name),
              label = COALESCE(?, label),
              search_url = COALESCE(?, search_url),
              sort_order = COALESCE(?, sort_order),
              is_enabled = COALESCE(?, is_enabled)
        WHERE id = ?`,
      [
        typeof name === 'undefined' ? null : String(name).trim(),
        typeof label === 'undefined' ? null : String(label).trim(),
        typeof searchUrl === 'undefined' ? null : String(searchUrl).trim(),
        typeof sortOrder === 'undefined' ? null : Number(sortOrder) || 0,
        typeof isEnabled === 'undefined' ? null : (Number(isEnabled) === 0 ? 0 : 1),
        id,
      ],
    )

    if (!result.affectedRows) return fail(res, '搜索引擎不存在', 404)
    await createOperationLog({ userId: req.user.id, action: 'search.engine.update', targetType: 'search_engine', targetId: Number(id), detail: req.body || {}, ip: req.ip })
    ok(res, null, '更新搜索引擎成功')
  } catch (error) {
    if (String(error.message || '').includes('Duplicate entry')) return fail(res, '搜索引擎名称已存在', 409)
    next(error)
  }
})

router.delete('/:id', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [result] = await pool.query('DELETE FROM search_engines WHERE id = ?', [id])
    if (!result.affectedRows) return fail(res, '搜索引擎不存在', 404)
    await createOperationLog({ userId: req.user.id, action: 'search.engine.delete', targetType: 'search_engine', targetId: Number(id), ip: req.ip })
    ok(res, null, '删除搜索引擎成功')
  } catch (error) {
    next(error)
  }
})

module.exports = router

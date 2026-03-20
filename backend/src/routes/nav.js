const express = require('express')
const { getPool } = require('../config/db')
const { ok, fail } = require('../utils/response')
const { authMiddleware, adminOnly } = require('../middlewares/auth')
const { createOperationLog } = require('../services/logService')

const router = express.Router()

router.get('/public/groups', async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, user_id, is_public, name, description, sort_order, is_default, created_at, updated_at
         FROM nav_groups
        WHERE is_deleted = 0
          AND is_public = 1
        ORDER BY sort_order ASC, id ASC`,
    )
    ok(res, rows, '获取公共导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.get('/public/links', async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, user_id, group_id, is_public, title, description, url_local, url_online, icon_url, open_mode, sort_order, created_at, updated_at
         FROM nav_links
        WHERE is_deleted = 0
          AND is_public = 1
        ORDER BY sort_order ASC, id ASC`,
    )
    ok(res, rows, '获取公共导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.get('/groups', authMiddleware, async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, user_id, is_public, name, description, sort_order, is_default, created_at, updated_at
         FROM nav_groups
        WHERE is_deleted = 0
          AND (
            (is_public = 1) OR
            (is_public = 0 AND user_id = ?)
          )
        ORDER BY is_public DESC, sort_order ASC, id ASC`,
      [req.user.id],
    )
    ok(res, rows, '获取导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.post('/groups', authMiddleware, async (req, res, next) => {
  try {
    const { name, description, sortOrder = 0, isDefault = 0, isPublic = 0 } = req.body || {}
    if (!name) return fail(res, '分组名称不能为空', 400)

    const publicFlag = Number(isPublic) === 1 ? 1 : 0
    if (publicFlag === 1 && req.user.role !== 'admin') {
      return fail(res, '只有管理员可以创建公共导航分组', 403)
    }

    const pool = getPool()
    const ownerUserId = publicFlag === 1 ? req.user.id : req.user.id
    const [result] = await pool.query(
      `INSERT INTO nav_groups (user_id, is_public, name, description, sort_order, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ownerUserId, publicFlag, name, description || null, Number(sortOrder) || 0, isDefault ? 1 : 0],
    )

    await createOperationLog({ userId: req.user.id, action: 'nav.group.create', targetType: 'nav_group', targetId: result.insertId, detail: { name, isPublic: publicFlag }, ip: req.ip })
    ok(res, { id: result.insertId }, '新增导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.put('/groups/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, sortOrder, isDefault } = req.body || {}
    const pool = getPool()
    await pool.query(
      `UPDATE nav_groups
          SET name = COALESCE(?, name),
              description = COALESCE(?, description),
              sort_order = COALESCE(?, sort_order),
              is_default = COALESCE(?, is_default)
        WHERE id = ?
          AND is_deleted = 0
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [name ?? null, description ?? null, sortOrder ?? null, isDefault ?? null, id, req.user.id, req.user.role],
    )

    await createOperationLog({ userId: req.user.id, action: 'nav.group.update', targetType: 'nav_group', targetId: Number(id), detail: req.body || {}, ip: req.ip })
    ok(res, null, '更新导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.delete('/groups/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const pool = getPool()
    await pool.query(
      `UPDATE nav_groups
          SET is_deleted = 1
        WHERE id = ?
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [id, req.user.id, req.user.role],
    )
    await pool.query(
      `UPDATE nav_links
          SET is_deleted = 1
        WHERE group_id = ?
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [id, req.user.id, req.user.role],
    )

    await createOperationLog({ userId: req.user.id, action: 'nav.group.delete', targetType: 'nav_group', targetId: Number(id), ip: req.ip })
    ok(res, null, '删除导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.get('/links', authMiddleware, async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, user_id, group_id, is_public, title, description, url_local, url_online, icon_url, open_mode, sort_order, created_at, updated_at
         FROM nav_links
        WHERE is_deleted = 0
          AND (
            (is_public = 1) OR
            (is_public = 0 AND user_id = ?)
          )
        ORDER BY is_public DESC, sort_order ASC, id ASC`,
      [req.user.id],
    )
    ok(res, rows, '获取导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.post('/links', authMiddleware, async (req, res, next) => {
  try {
    const { groupId, title, description, urlLocal, urlOnline, iconUrl, openMode = '_blank', sortOrder = 0, isPublic = 0 } = req.body || {}
    if (!groupId || !title) return fail(res, 'groupId 和 title 不能为空', 400)

    const publicFlag = Number(isPublic) === 1 ? 1 : 0
    if (publicFlag === 1 && req.user.role !== 'admin') {
      return fail(res, '只有管理员可以创建公共导航链接', 403)
    }

    const pool = getPool()
    const [result] = await pool.query(
      `INSERT INTO nav_links (user_id, group_id, is_public, title, description, url_local, url_online, icon_url, open_mode, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, groupId, publicFlag, title, description || null, urlLocal || null, urlOnline || null, iconUrl || null, openMode, Number(sortOrder) || 0],
    )

    await createOperationLog({ userId: req.user.id, action: 'nav.link.create', targetType: 'nav_link', targetId: result.insertId, detail: { title, groupId, isPublic: publicFlag }, ip: req.ip })
    ok(res, { id: result.insertId }, '新增导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.put('/links/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { groupId, title, description, urlLocal, urlOnline, iconUrl, openMode, sortOrder } = req.body || {}
    const pool = getPool()
    await pool.query(
      `UPDATE nav_links
          SET group_id = COALESCE(?, group_id),
              title = COALESCE(?, title),
              description = COALESCE(?, description),
              url_local = COALESCE(?, url_local),
              url_online = COALESCE(?, url_online),
              icon_url = COALESCE(?, icon_url),
              open_mode = COALESCE(?, open_mode),
              sort_order = COALESCE(?, sort_order)
        WHERE id = ?
          AND is_deleted = 0
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [groupId ?? null, title ?? null, description ?? null, urlLocal ?? null, urlOnline ?? null, iconUrl ?? null, openMode ?? null, sortOrder ?? null, id, req.user.id, req.user.role],
    )

    await createOperationLog({ userId: req.user.id, action: 'nav.link.update', targetType: 'nav_link', targetId: Number(id), detail: req.body || {}, ip: req.ip })
    ok(res, null, '更新导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.delete('/links/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const pool = getPool()
    await pool.query(
      `UPDATE nav_links
          SET is_deleted = 1
        WHERE id = ?
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [id, req.user.id, req.user.role],
    )

    await createOperationLog({ userId: req.user.id, action: 'nav.link.delete', targetType: 'nav_link', targetId: Number(id), ip: req.ip })
    ok(res, null, '删除导航链接成功')
  } catch (error) {
    next(error)
  }
})

module.exports = router

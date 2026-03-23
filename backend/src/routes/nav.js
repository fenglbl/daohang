const express = require('express')
const { getPool } = require('../config/db')
const { ok, fail } = require('../utils/response')
const { authMiddleware } = require('../middlewares/auth')
const { createOperationLog } = require('../services/logService')

const router = express.Router()

function canManagePublic(user) {
  return user?.role === 'admin'
}

router.get('/public/groups', async (req, res, next) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, user_id, is_public, name, description, sort_order, is_default, is_enabled, created_at, updated_at
         FROM nav_groups
        WHERE is_deleted = 0
          AND is_public = 1
          AND is_enabled = 1
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
      `SELECT l.id, l.user_id, l.group_id, l.is_public, l.title, l.description, l.url_local, l.url_online, l.icon_url, l.open_mode, l.sort_order, l.is_enabled, l.created_at, l.updated_at
         FROM nav_links l
         INNER JOIN nav_groups g ON g.id = l.group_id
        WHERE l.is_deleted = 0
          AND l.is_public = 1
          AND l.is_enabled = 1
          AND g.is_deleted = 0
          AND g.is_enabled = 1
        ORDER BY l.sort_order ASC, l.id ASC`,
    )
    ok(res, rows, '获取公共导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.get('/groups', authMiddleware, async (req, res, next) => {
  try {
    const pool = getPool()
    const isAdmin = canManagePublic(req.user) ? 1 : 0
    const [rows] = await pool.query(
      `SELECT id, user_id, is_public, name, description, sort_order, is_default, is_enabled, created_at, updated_at
         FROM nav_groups
        WHERE is_deleted = 0
          AND (
            (is_public = 1 AND (? = 1 OR is_enabled = 1))
            OR
            (is_public = 0 AND user_id = ?)
          )
        ORDER BY is_public DESC, is_enabled DESC, sort_order ASC, id ASC`,
      [isAdmin, req.user.id],
    )
    ok(res, rows, '获取导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.post('/groups', authMiddleware, async (req, res, next) => {
  try {
    const { name, description, sortOrder = 0, isDefault = 0, isPublic = 0, isEnabled = 1 } = req.body || {}
    if (!name) return fail(res, '分组名称不能为空', 400)

    const publicFlag = Number(isPublic) === 1 ? 1 : 0
    if (publicFlag === 1 && !canManagePublic(req.user)) {
      return fail(res, '只有管理员可以创建公共导航分组', 403)
    }

    const enabledFlag = Number(isEnabled) === 0 ? 0 : 1
    const pool = getPool()
    const [result] = await pool.query(
      `INSERT INTO nav_groups (user_id, is_public, name, description, sort_order, is_default, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, publicFlag, name, description || null, Number(sortOrder) || 0, isDefault ? 1 : 0, enabledFlag],
    )

    await createOperationLog({
      userId: req.user.id,
      action: 'nav.group.create',
      targetType: 'nav_group',
      targetId: result.insertId,
      detail: { name, isPublic: publicFlag, isEnabled: enabledFlag },
      ip: req.ip,
    })
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
    const [result] = await pool.query(
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

    if (!result.affectedRows) return fail(res, '导航分组不存在或无权限操作', 404)

    await createOperationLog({ userId: req.user.id, action: 'nav.group.update', targetType: 'nav_group', targetId: Number(id), detail: req.body || {}, ip: req.ip })
    ok(res, null, '更新导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.put('/groups/:id/enabled', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const enabledFlag = Number(req.body?.isEnabled) === 0 ? 0 : 1
    const pool = getPool()
    const [result] = await pool.query(
      `UPDATE nav_groups
          SET is_enabled = ?
        WHERE id = ?
          AND is_deleted = 0
          AND is_public = 1
          AND ? = 'admin'`,
      [enabledFlag, id, req.user.role],
    )

    if (!result.affectedRows) return fail(res, '导航分组不存在或无权限操作', 404)

    await createOperationLog({
      userId: req.user.id,
      action: enabledFlag === 1 ? 'nav.group.enable' : 'nav.group.disable',
      targetType: 'nav_group',
      targetId: Number(id),
      detail: { isEnabled: enabledFlag },
      ip: req.ip,
    })
    ok(res, null, enabledFlag === 1 ? '启用导航分组成功' : '停用导航分组成功')
  } catch (error) {
    next(error)
  }
})

router.delete('/groups/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [groupResult] = await pool.query(
      `UPDATE nav_groups
          SET is_deleted = 1
        WHERE id = ?
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [id, req.user.id, req.user.role],
    )

    if (!groupResult.affectedRows) return fail(res, '导航分组不存在或无权限操作', 404)

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
    const isAdmin = canManagePublic(req.user) ? 1 : 0
    const [rows] = await pool.query(
      `SELECT l.id, l.user_id, l.group_id, l.is_public, l.title, l.description, l.url_local, l.url_online, l.icon_url, l.open_mode, l.sort_order, l.is_enabled, l.created_at, l.updated_at
         FROM nav_links l
         INNER JOIN nav_groups g ON g.id = l.group_id
        WHERE l.is_deleted = 0
          AND g.is_deleted = 0
          AND (
            (l.is_public = 1 AND (? = 1 OR (l.is_enabled = 1 AND g.is_enabled = 1)))
            OR
            (l.is_public = 0 AND l.user_id = ?)
          )
        ORDER BY l.is_public DESC, l.is_enabled DESC, l.sort_order ASC, l.id ASC`,
      [isAdmin, req.user.id],
    )
    ok(res, rows, '获取导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.post('/links', authMiddleware, async (req, res, next) => {
  try {
    const { groupId, title, description, urlLocal, urlOnline, iconUrl, openMode = '_blank', sortOrder = 0, isPublic = 0, isEnabled = 1 } = req.body || {}
    if (!groupId || !title) return fail(res, 'groupId 和 title 不能为空', 400)

    const publicFlag = Number(isPublic) === 1 ? 1 : 0
    if (publicFlag === 1 && !canManagePublic(req.user)) {
      return fail(res, '只有管理员可以创建公共导航链接', 403)
    }

    const pool = getPool()
    const [groupRows] = await pool.query(
      `SELECT id, is_public, user_id, is_deleted
         FROM nav_groups
        WHERE id = ?
        LIMIT 1`,
      [groupId],
    )
    const group = groupRows[0]
    if (!group || Number(group.is_deleted) === 1) return fail(res, '所属分组不存在', 404)
    if (Number(group.is_public) !== publicFlag) return fail(res, '导航链接的公共属性必须与分组一致', 400)
    if (publicFlag === 0 && Number(group.user_id) !== Number(req.user.id)) return fail(res, '无权向该分组添加导航链接', 403)

    const enabledFlag = Number(isEnabled) === 0 ? 0 : 1
    const [result] = await pool.query(
      `INSERT INTO nav_links (user_id, group_id, is_public, title, description, url_local, url_online, icon_url, open_mode, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, groupId, publicFlag, title, description || null, urlLocal || null, urlOnline || null, iconUrl || null, openMode, Number(sortOrder) || 0, enabledFlag],
    )

    await createOperationLog({
      userId: req.user.id,
      action: 'nav.link.create',
      targetType: 'nav_link',
      targetId: result.insertId,
      detail: { title, groupId, isPublic: publicFlag, isEnabled: enabledFlag },
      ip: req.ip,
    })
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

    if (groupId) {
      const [groupRows] = await pool.query(
        `SELECT id, is_public, user_id, is_deleted
           FROM nav_groups
          WHERE id = ?
          LIMIT 1`,
        [groupId],
      )
      const group = groupRows[0]
      if (!group || Number(group.is_deleted) === 1) return fail(res, '目标分组不存在', 404)
      if (Number(group.is_public) === 1 && !canManagePublic(req.user)) return fail(res, '无权移动到公共分组', 403)
      if (Number(group.is_public) === 0 && Number(group.user_id) !== Number(req.user.id)) return fail(res, '无权移动到该私有分组', 403)
    }

    const [result] = await pool.query(
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

    if (!result.affectedRows) return fail(res, '导航链接不存在或无权限操作', 404)

    await createOperationLog({ userId: req.user.id, action: 'nav.link.update', targetType: 'nav_link', targetId: Number(id), detail: req.body || {}, ip: req.ip })
    ok(res, null, '更新导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.put('/links/:id/enabled', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const enabledFlag = Number(req.body?.isEnabled) === 0 ? 0 : 1
    const pool = getPool()
    const [result] = await pool.query(
      `UPDATE nav_links
          SET is_enabled = ?
        WHERE id = ?
          AND is_deleted = 0
          AND is_public = 1
          AND ? = 'admin'`,
      [enabledFlag, id, req.user.role],
    )

    if (!result.affectedRows) return fail(res, '导航链接不存在或无权限操作', 404)

    await createOperationLog({
      userId: req.user.id,
      action: enabledFlag === 1 ? 'nav.link.enable' : 'nav.link.disable',
      targetType: 'nav_link',
      targetId: Number(id),
      detail: { isEnabled: enabledFlag },
      ip: req.ip,
    })
    ok(res, null, enabledFlag === 1 ? '启用导航链接成功' : '停用导航链接成功')
  } catch (error) {
    next(error)
  }
})

router.delete('/links/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [result] = await pool.query(
      `UPDATE nav_links
          SET is_deleted = 1
        WHERE id = ?
          AND ((is_public = 0 AND user_id = ?) OR (is_public = 1 AND ? = 'admin'))`,
      [id, req.user.id, req.user.role],
    )

    if (!result.affectedRows) return fail(res, '导航链接不存在或无权限操作', 404)

    await createOperationLog({ userId: req.user.id, action: 'nav.link.delete', targetType: 'nav_link', targetId: Number(id), ip: req.ip })
    ok(res, null, '删除导航链接成功')
  } catch (error) {
    next(error)
  }
})

module.exports = router

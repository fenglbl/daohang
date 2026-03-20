import { defineStore } from 'pinia'
import { api } from '../api'

function mapNav(groups = [], links = []) {
  return groups.map((group) => ({
    id: group.id,
    title: group.name,
    desc: group.description,
    sortOrder: Number(group.sort_order || 0),
    isPublic: group.is_public === 1,
    links: links
      .filter((link) => Number(link.group_id) === Number(group.id))
      .map((link) => ({
        id: link.id,
        name: link.title,
        desc: link.description,
        urlLocal: link.url_local,
        urlOnline: link.url_online,
        sortOrder: Number(link.sort_order || 0),
        isPublic: link.is_public === 1,
      })),
  }))
}

let noticeSeed = 1
let confirmResolver = null

export const useAppStore = defineStore('app', {
  state: () => ({
    themeMode: localStorage.getItem('themeMode') || 'system',
    jumpMode: localStorage.getItem('jumpMode') || 'online',
    editMode: localStorage.getItem('editMode') === '1',
    showPublicNav: localStorage.getItem('showPublicNav') !== '0',
    token: localStorage.getItem('token') || '',
    currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
    navGroups: [],
    notices: [],
    confirmDialog: {
      visible: false,
      title: '请确认',
      message: '',
      confirmText: '确认',
      cancelText: '取消',
      type: 'danger',
    },
    loading: false,
  }),
  getters: {
    isAdmin: (state) => state.currentUser?.role === 'admin',
    isLoggedIn: (state) => !!state.token,
    canEditPrivateNav: (state) => !!state.token && state.currentUser?.role !== 'admin' && state.editMode,
    publicGroups: (state) => state.showPublicNav ? state.navGroups.filter((item) => item.isPublic) : [],
    privateGroups: (state) => state.navGroups.filter((item) => !item.isPublic),
  },
  actions: {
    setThemeMode(mode) {
      this.themeMode = mode
      localStorage.setItem('themeMode', mode)
      this.applyTheme()
    },
    applyTheme() {
      const root = document.documentElement
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolved = this.themeMode === 'system' ? (systemDark ? 'dark' : 'light') : this.themeMode
      root.dataset.theme = resolved
    },
    setJumpMode(mode) {
      this.jumpMode = mode
      localStorage.setItem('jumpMode', mode)
    },
    setEditMode(enabled) {
      this.editMode = !!enabled
      localStorage.setItem('editMode', this.editMode ? '1' : '0')
    },
    setShowPublicNav(enabled) {
      this.showPublicNav = !!enabled
      localStorage.setItem('showPublicNav', this.showPublicNav ? '1' : '0')
    },
    async toggleShowPublicNav() {
      const nextValue = !this.showPublicNav
      const oldValue = this.showPublicNav
      this.setShowPublicNav(nextValue)
      try {
        if (this.isLoggedIn) {
          await api.updateSettings({ showPublicNav: nextValue ? 1 : 0 })
          if (this.currentUser) this.currentUser.show_public_nav = nextValue ? 1 : 0
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
        }
        this.notify(nextValue ? '已开启公共导航' : '已关闭公共导航')
      } catch (error) {
        this.setShowPublicNav(oldValue)
        throw error
      }
    },
    toggleEditMode() {
      this.setEditMode(!this.editMode)
      this.notify(this.editMode ? '已开启编辑模式' : '已关闭编辑模式')
    },
    notify(message, type = 'success') {
      const id = noticeSeed++
      this.notices.push({ id, message, type })
      setTimeout(() => this.removeNotice(id), 2600)
    },
    removeNotice(id) {
      this.notices = this.notices.filter((item) => item.id !== id)
    },
    openConfirm(options = {}) {
      this.confirmDialog = {
        visible: true,
        title: options.title || '请确认',
        message: options.message || '',
        confirmText: options.confirmText || '确认',
        cancelText: options.cancelText || '取消',
        type: options.type || 'danger',
      }
      return new Promise((resolve) => {
        confirmResolver = resolve
      })
    },
    resolveConfirm(result) {
      this.confirmDialog.visible = false
      if (confirmResolver) {
        confirmResolver(result)
        confirmResolver = null
      }
    },
    async login(payload) {
      const result = await api.login(payload)
      this.token = result.data.token
      this.currentUser = result.data.user
      localStorage.setItem('token', this.token)
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      if (result.data.user?.role === 'admin') this.setEditMode(false)
      await this.loadUserProfile()
      await this.fetchNavData()
      return result.data.user
    },
    async register(payload) {
      return api.register(payload)
    },
    async loadUserProfile() {
      if (!this.token) return
      const result = await api.me()
      this.currentUser = result.data
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      if (result.data?.role === 'admin') this.setEditMode(false)
      if (result.data?.theme_mode) this.setThemeMode(result.data.theme_mode)
      if (result.data?.jump_mode) this.setJumpMode(result.data.jump_mode)
      this.setShowPublicNav(result.data?.show_public_nav !== 0)
    },
    async logout() {
      try {
        if (this.token) await api.logout()
      } catch (_) {}
      this.token = ''
      this.currentUser = null
      this.navGroups = []
      this.setEditMode(false)
      this.setShowPublicNav(true)
      localStorage.removeItem('token')
      localStorage.removeItem('currentUser')
      await this.fetchNavData()
    },
    async updateCurrentUserProfile(payload) {
      const result = await api.updateProfile(payload)
      this.currentUser = { ...this.currentUser, ...result.data }
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      return result.data
    },
    async updateCurrentUserPassword(payload) {
      return api.updatePassword(payload)
    },
    async fetchNavData() {
      this.loading = true
      try {
        if (this.token) {
          const [groupsRes, linksRes] = await Promise.all([api.getGroups(), api.getLinks()])
          this.navGroups = mapNav(groupsRes.data || [], linksRes.data || [])
        } else {
          const [groupsRes, linksRes] = await Promise.all([api.getPublicGroups(), api.getPublicLinks()])
          this.navGroups = mapNav(groupsRes.data || [], linksRes.data || [])
        }
      } finally {
        this.loading = false
      }
    },
    async addGroup(title, isPublic = false) {
      await api.createGroup({ name: title, isPublic: isPublic ? 1 : 0 })
      await this.fetchNavData()
    },
    async updateGroup(groupId, payload) {
      await api.updateGroup(groupId, payload)
      await this.fetchNavData()
    },
    async removeGroup(groupId) {
      await api.deleteGroup(groupId)
      await this.fetchNavData()
    },
    async moveGroup(groupId, isPublic = false, direction = 'up') {
      const list = this.navGroups.filter((item) => item.isPublic === !!isPublic)
      const index = list.findIndex((item) => Number(item.id) === Number(groupId))
      if (index === -1) return
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= list.length) return
      const reordered = [...list]
      ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
      for (let i = 0; i < reordered.length; i += 1) {
        await api.updateGroup(reordered[i].id, { sortOrder: i + 1 })
      }
      await this.fetchNavData()
    },
    async addLink(groupId, link, isPublic = false) {
      await api.createLink({
        groupId,
        title: link.name,
        description: link.desc,
        urlLocal: link.urlLocal,
        urlOnline: link.urlOnline,
        isPublic: isPublic ? 1 : 0,
      })
      await this.fetchNavData()
    },
    async updateLink(linkId, payload) {
      await api.updateLink(linkId, payload)
      await this.fetchNavData()
    },
    async removeLink(linkId) {
      await api.deleteLink(linkId)
      await this.fetchNavData()
    },
    async moveLink(linkId, groupId, isPublic = false, direction = 'up') {
      const group = this.navGroups.find((item) => Number(item.id) === Number(groupId) && item.isPublic === !!isPublic)
      if (!group) return
      const list = group.links || []
      const index = list.findIndex((item) => Number(item.id) === Number(linkId))
      if (index === -1) return
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= list.length) return
      const reordered = [...list]
      ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
      for (let i = 0; i < reordered.length; i += 1) {
        await api.updateLink(reordered[i].id, { sortOrder: i + 1 })
      }
      await this.fetchNavData()
    },
  },
})

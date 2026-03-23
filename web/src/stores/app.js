import { defineStore } from 'pinia'
import { api } from '../api'
import { getLocale, setLocale as applyLocale, t } from '../i18n'

function mapNav(groups = [], links = []) {
  return groups.map((group) => ({
    id: group.id,
    title: group.name,
    desc: group.description,
    sortOrder: Number(group.sort_order || 0),
    isPublic: Number(group.is_public) === 1,
    isEnabled: Number(group.is_enabled ?? 1) === 1,
    links: links
      .filter((link) => Number(link.group_id) === Number(group.id))
      .map((link) => ({
        id: link.id,
        groupId: link.group_id,
        name: link.title,
        desc: link.description,
        urlLocal: link.url_local,
        urlOnline: link.url_online,
        sortOrder: Number(link.sort_order || 0),
        isPublic: Number(link.is_public) === 1,
        isEnabled: Number(link.is_enabled ?? 1) === 1,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
  }))
}

let noticeSeed = 1
let confirmResolver = null

export const useAppStore = defineStore('app', {
  state: () => ({
    themeMode: localStorage.getItem('themeMode') || 'system',
    jumpMode: localStorage.getItem('jumpMode') || 'online',
    locale: getLocale(),
    editMode: localStorage.getItem('editMode') === '1',
    showPublicNav: localStorage.getItem('showPublicNav') !== '0',
    token: localStorage.getItem('token') || '',
    currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
    navGroups: [],
    searchEngines: [],
    notices: [],
    confirmDialog: {
      visible: false,
      title: t('app.confirmTitle'),
      message: '',
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      type: 'danger',
    },
    loading: false,
    avatarVersion: localStorage.getItem('avatarVersion') || '',
  }),
  getters: {
    isAdmin: (state) => state.currentUser?.role === 'admin',
    isLoggedIn: (state) => !!state.token,
    canEditPrivateNav: (state) => !!state.token && state.currentUser?.role !== 'admin' && state.editMode,
    publicGroups: (state) => (state.showPublicNav ? state.navGroups.filter((item) => item.isPublic) : []),
    privateGroups: (state) => state.navGroups.filter((item) => !item.isPublic),
    enabledSearchEngines: (state) => state.searchEngines.filter((item) => Number(item.is_enabled) === 1 || item.is_enabled === true),
  },
  actions: {
    setLocale(locale, options = {}) {
      this.locale = locale
      applyLocale(locale)
      if (!options.silent) {
        this.notify(t('language.switched'))
      }
    },
    setThemeMode(mode) {
      this.themeMode = mode
      localStorage.setItem('themeMode', mode)
      this.applyTheme()
    },
    async syncThemeMode(mode) {
      this.setThemeMode(mode)
      if (!this.isLoggedIn) return
      await api.updateSettings({ themeMode: mode })
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
    async syncJumpMode(mode) {
      this.setJumpMode(mode)
      if (!this.isLoggedIn) return
      await api.updateSettings({ jumpMode: mode })
    },
    setEditMode(enabled) {
      this.editMode = !!enabled
      localStorage.setItem('editMode', this.editMode ? '1' : '0')
    },
    setShowPublicNav(enabled) {
      this.showPublicNav = !!enabled
      localStorage.setItem('showPublicNav', this.showPublicNav ? '1' : '0')
    },
    bumpAvatarVersion() {
      this.avatarVersion = String(Date.now())
      localStorage.setItem('avatarVersion', this.avatarVersion)
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
        this.notify(nextValue ? t('home.publicNavOn') : t('home.publicNavOff'))
      } catch (error) {
        this.setShowPublicNav(oldValue)
        throw error
      }
    },
    toggleEditMode() {
      this.setEditMode(!this.editMode)
      this.notify(this.editMode ? t('home.editModeOn') : t('home.editModeOff'))
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
        title: options.title || t('app.confirmTitle'),
        message: options.message || '',
        confirmText: options.confirmText || t('common.confirm'),
        cancelText: options.cancelText || t('common.cancel'),
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
      await Promise.all([this.fetchNavData(), this.fetchSearchEngines()])
      return result.data.user
    },
    async register(payload) {
      return api.register(payload)
    },
    async loadUserProfile() {
      if (!this.token) return
      const previousAvatarUrl = this.currentUser?.avatar_url || ''
      const result = await api.me()
      this.currentUser = result.data
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      if ((result.data?.avatar_url || '') !== previousAvatarUrl) this.bumpAvatarVersion()
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
      await Promise.all([this.fetchNavData(), this.fetchSearchEngines()])
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
    async fetchSearchEngines(admin = false) {
      const result = admin ? await api.getAdminSearchEngines() : await api.getSearchEngines()
      this.searchEngines = result.data || []
      return this.searchEngines
    },
    async createSearchEngine(payload) {
      await api.createSearchEngine(payload)
      await this.fetchSearchEngines(true)
    },
    async updateSearchEngine(id, payload) {
      await api.updateSearchEngine(id, payload)
      await this.fetchSearchEngines(true)
    },
    async removeSearchEngine(id) {
      await api.deleteSearchEngine(id)
      await this.fetchSearchEngines(true)
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
      await api.createGroup({ name: title, isPublic: isPublic ? 1 : 0, isEnabled: 1 })
      await this.fetchNavData()
    },
    async updateGroup(groupId, payload) {
      await api.updateGroup(groupId, payload)
      await this.fetchNavData()
    },
    async toggleGroupEnabled(groupId, isEnabled) {
      await api.setGroupEnabled(groupId, isEnabled ? 1 : 0)
      await this.fetchNavData()
    },
    async removeGroup(groupId) {
      await api.deleteGroup(groupId)
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
        isEnabled: 1,
      })
      await this.fetchNavData()
    },
    async updateLink(linkId, payload) {
      await api.updateLink(linkId, payload)
      await this.fetchNavData()
    },
    async toggleLinkEnabled(linkId, isEnabled) {
      await api.setLinkEnabled(linkId, isEnabled ? 1 : 0)
      await this.fetchNavData()
    },
    async removeLink(linkId) {
      await api.deleteLink(linkId)
      await this.fetchNavData()
    },
  },
})

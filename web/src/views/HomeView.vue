<template>
  <section class="hero-panel hero-panel-compact">
    <div class="hero-floating-tools">
      <div class="hero-toolbar hero-toolbar-tight">
        <div class="mini-group language-switch" ref="languageDropdownRef">
          <span class="mini-group-label">{{ t('language.label') }}</span>
          <button class="mini-btn" @click="toggleLanguageMenu">{{ currentLanguageLabel }}</button>
          <div v-if="showLanguageMenu" class="user-dropdown-menu language-dropdown-menu">
            <button class="dropdown-item" @click="changeLocale('zh-CN')">
              <span>{{ t('language.zhCN') }}</span>
              <small>{{ t('language.zhDesc') }}</small>
            </button>
            <button class="dropdown-item" @click="changeLocale('en-US')">
              <span>{{ t('language.enUS') }}</span>
              <small>{{ t('language.enDesc') }}</small>
            </button>
          </div>
        </div>
        <div class="mini-group">
          <button v-for="item in themes" :key="item.value" class="mini-btn" :class="{ active: store.themeMode === item.value }" @click="setTheme(item.value)">{{ item.label }}</button>
        </div>
        <div class="mini-group">
          <button v-for="item in jumps" :key="item.value" class="mini-btn" :class="{ active: store.jumpMode === item.value }" @click="setJump(item.value)">{{ item.label }}</button>
        </div>
        <div v-if="store.isLoggedIn && !store.isAdmin" class="mini-group">
          <span class="mini-group-label">{{ t('home.editMode') }}</span>
          <button class="mini-btn" :class="{ active: store.editMode }" @click="store.toggleEditMode()">{{ store.editMode ? t('home.enabled') : t('home.disabled') }}</button>
        </div>
        <button v-if="!store.isLoggedIn" class="mini-primary-btn" @click="$router.push('/login')">{{ t('home.login') }}</button>
        <div v-else class="user-dropdown" ref="userDropdownRef">
          <button class="mini-userbox mini-userbox-trigger" @click="toggleUserMenu">
            <img v-if="resolvedAvatarUrl && !avatarLoadFailed" :src="resolvedAvatarUrl" alt="avatar" class="user-avatar" @error="handleAvatarError" />
            <div v-else class="user-avatar user-avatar-fallback">{{ avatarFallback }}</div>
            <span>{{ displayName }}</span>
            <strong class="dropdown-arrow">▼</strong>
          </button>
          <div v-if="showUserMenu" class="user-dropdown-menu">
            <button v-if="!store.isAdmin" class="dropdown-item dropdown-item-toggle" :class="store.showPublicNav ? 'toggle-on' : 'toggle-off'" @click="togglePublicNavVisible">
              <span>{{ store.showPublicNav ? t('home.userMenuTogglePublicOn') : t('home.userMenuTogglePublicOff') }}</span>
              <small>{{ store.showPublicNav ? t('home.userMenuTogglePublicOnDesc') : t('home.userMenuTogglePublicOffDesc') }}</small>
            </button>
            <button class="dropdown-item" @click="goSettings">
              <span>{{ t('home.settings') }}</span>
              <small>{{ t('home.settingsDesc') }}</small>
            </button>
            <button v-if="store.isAdmin" class="dropdown-item" @click="goAdmin">
              <span>{{ t('home.admin') }}</span>
              <small>{{ t('home.adminDesc') }}</small>
            </button>
            <button class="dropdown-item danger-item" @click="doLogout">
              <span>{{ t('home.logout') }}</span>
              <small>{{ t('home.logoutDesc') }}</small>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-content hero-content-compact">
      <p class="hero-tip">{{ t('home.heroTip') }}</p>
      <h1>{{ t('home.heroTitle') }}</h1>
      <div class="search-box search-box-compact search-box-refined">
        <input v-model="keyword" class="search-input search-input-refined" type="text" :placeholder="t('home.searchPlaceholder')" @keyup.enter="doSearch" />
        <button class="search-btn search-btn-refined" @click="doSearch">{{ t('common.search') }}</button>
      </div>
      <div class="search-engines search-engines-refined">
        <button v-for="item in engines" :key="item.value" class="chip-btn chip-btn-refined" :class="{ active: currentEngine === item.value }" @click="currentEngine = item.value">{{ item.label }}</button>
      </div>
    </div>
  </section>

  <section class="nav-section" v-if="!store.isLoggedIn || store.showPublicNav">
    <div class="section-header">
      <h2>{{ t('home.publicNav') }}</h2>
      <p>{{ t('home.publicNavDesc') }}</p>
    </div>
    <div v-if="store.loading && !filteredPublicGroups.length" class="empty-box">{{ t('home.publicNavLoading') }}</div>
    <div v-else class="group-list">
      <article v-for="group in filteredPublicGroups" :key="group.id" class="group-card">
        <div class="group-head"><h3>{{ group.title }}</h3><span>{{ t('home.linkCount', { count: group.links.length }) }}</span></div>
        <div class="link-grid">
          <button v-for="link in group.links" :key="link.id" class="link-card" @click="openLink(link)">
            <strong>{{ link.name }}</strong>
            <span>{{ link.desc }}</span>
            <small>{{ currentUrl(link) }}</small>
          </button>
        </div>
      </article>
      <div v-if="!filteredPublicGroups.length && !store.loading" class="empty-box">{{ t('home.publicNavEmpty') }}</div>
    </div>
  </section>

  <section class="nav-section" v-if="store.isLoggedIn && !store.isAdmin">
    <div class="section-header section-header-inline">
      <div>
        <h2>{{ t('home.myNav') }}</h2>
        <p v-if="store.canEditPrivateNav">{{ t('home.myNavEditDesc') }}</p>
        <p v-else>{{ t('home.myNavViewDesc') }}</p>
      </div>
      <div v-if="store.canEditPrivateNav" class="section-actions">
        <button class="primary-btn" @click="openGroupModal('create')">{{ t('home.addGroup') }}</button>
        <button class="primary-btn" @click="openLinkModal('create')">{{ t('home.addLink') }}</button>
      </div>
    </div>
    <div v-if="store.loading && !filteredPrivateGroups.length" class="empty-box">{{ t('home.privateNavLoading') }}</div>
    <div v-else class="group-list">
      <article v-for="group in filteredPrivateGroups" :key="group.id" class="group-card">
        <div class="group-head">
          <div>
            <h3>{{ group.title }}</h3>
            <span>{{ t('home.linkCount', { count: group.links.length }) }}</span>
          </div>
          <div v-if="store.canEditPrivateNav" class="group-actions">
            <button class="mini-btn" @click="openGroupModal('edit', group)">{{ t('home.editGroup') }}</button>
            <button class="mini-btn danger-btn" @click="removeGroup(group.id)">{{ t('home.deleteGroup') }}</button>
          </div>
        </div>
        <div class="link-grid">
          <div v-for="link in group.links" :key="link.id" class="private-link-shell" :class="{ 'link-card-editable': store.canEditPrivateNav }">
            <div v-if="store.canEditPrivateNav" class="link-actions">
              <button class="mini-btn" @click="openLinkModal('edit', group, link)">{{ t('common.edit') }}</button>
              <button class="mini-btn danger-btn" @click="removeLink(link.id)">{{ t('common.delete') }}</button>
            </div>
            <button class="link-card" :class="{ 'link-card-inner': store.canEditPrivateNav }" @click="openLink(link)">
              <strong>{{ link.name }}</strong>
              <span>{{ link.desc }}</span>
              <small>{{ currentUrl(link) }}</small>
            </button>
          </div>
        </div>
      </article>
      <div v-if="!filteredPrivateGroups.length && !store.loading" class="empty-box">{{ t('home.privateNavEmpty') }}</div>
    </div>
  </section>

  <div v-if="showGroupModal" class="modal-mask" @click.self="closeGroupModal">
    <div class="modal-card">
      <div class="modal-head">
        <h3>{{ groupModalMode === 'create' ? t('home.createGroup') : t('home.updateGroup') }}</h3>
        <button class="mini-btn" @click="closeGroupModal">{{ t('common.close') }}</button>
      </div>
      <div class="form-grid">
        <input v-model="groupForm.title" class="text-input" :placeholder="t('home.groupNamePlaceholder')" />
        <textarea v-model="groupForm.desc" class="text-input textarea-input" :placeholder="t('home.groupDescPlaceholder')"></textarea>
        <div class="user-box">
          <button class="primary-btn" @click="submitGroupModal">{{ t('common.save') }}</button>
          <button class="mini-btn" @click="closeGroupModal">{{ t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showLinkModal" class="modal-mask" @click.self="closeLinkModal">
    <div class="modal-card">
      <div class="modal-head">
        <h3>{{ linkModalMode === 'create' ? t('home.createLink') : t('home.updateLink') }}</h3>
        <button class="mini-btn" @click="closeLinkModal">{{ t('common.close') }}</button>
      </div>
      <div class="form-grid">
        <select v-model="linkForm.groupId" class="text-input">
          <option disabled value="">{{ t('common.selectGroup') }}</option>
          <option v-for="group in store.privateGroups" :key="group.id" :value="group.id">{{ group.title }}</option>
        </select>
        <input v-model="linkForm.name" class="text-input" :placeholder="t('home.linkNamePlaceholder')" />
        <input v-model="linkForm.desc" class="text-input" :placeholder="t('home.linkDescPlaceholder')" />
        <input v-model="linkForm.urlLocal" class="text-input" :placeholder="t('home.localUrlPlaceholder')" />
        <input v-model="linkForm.urlOnline" class="text-input" :placeholder="t('home.onlineUrlPlaceholder')" />
        <div class="user-box">
          <button class="primary-btn" @click="submitLinkModal">{{ t('common.save') }}</button>
          <button class="mini-btn" @click="closeLinkModal">{{ t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useI18n } from '../i18n'

const router = useRouter()
const store = useAppStore()
const { state: i18nState, t } = useI18n()
const keyword = ref('')
const currentEngine = ref('bing')
const showGroupModal = ref(false)
const showLinkModal = ref(false)
const showUserMenu = ref(false)
const showLanguageMenu = ref(false)
const userDropdownRef = ref(null)
const languageDropdownRef = ref(null)
const avatarLoadFailed = ref(false)
const groupModalMode = ref('create')
const linkModalMode = ref('create')
const editingGroupId = ref(null)
const editingLinkId = ref(null)
const groupForm = reactive({ title: '', desc: '' })
const linkForm = reactive({ groupId: '', name: '', desc: '', urlLocal: '', urlOnline: '' })
const themes = computed(() => [
  { label: t('theme.dark'), value: 'dark' },
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.system'), value: 'system' },
])
const jumps = computed(() => [
  { label: t('jump.local'), value: 'local' },
  { label: t('jump.online'), value: 'online' },
])

const filteredPublicGroups = computed(() => filterGroups(store.publicGroups, false))
const filteredPrivateGroups = computed(() => filterGroups(store.privateGroups, false))
const displayName = computed(() => store.currentUser?.nickname || store.currentUser?.username || t('home.displayNameFallback'))
const avatarFallback = computed(() => String(displayName.value || t('home.avatarFallback')).trim().slice(0, 1).toUpperCase())
const currentLanguageLabel = computed(() => i18nState.locale === 'en-US' ? t('language.enUS') : t('language.zhCN'))
const resolvedAvatarUrl = computed(() => resolveAssetUrl(store.currentUser?.avatar_url || ''))
const engines = computed(() => store.enabledSearchEngines.map((item) => ({ label: item.label, value: item.name, searchUrl: item.search_url })))

watch(() => store.currentUser?.avatar_url, () => {
  avatarLoadFailed.value = false
})
watch(engines, (next) => {
  if (!next.length) return
  if (!next.some((item) => item.value === currentEngine.value)) {
    currentEngine.value = next[0].value
  }
}, { immediate: true })

function resolveAssetUrl(url) {
  if (!url) return ''
  const version = store.avatarVersion ? `?v=${encodeURIComponent(store.avatarVersion)}` : ''
  if (/^https?:\/\//i.test(url)) return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(store.avatarVersion || '')}`
  return `http://127.0.0.1:3000${url}${version}`
}

function handleAvatarError() {
  avatarLoadFailed.value = true
}

function filterGroups(groups, includeDisabled = false) {
  let list = includeDisabled ? groups : groups.filter((group) => group.isEnabled)
  list = list.map((group) => ({
    ...group,
    links: includeDisabled ? group.links : group.links.filter((link) => link.isEnabled),
  }))
  if (!keyword.value.trim()) return list
  const key = keyword.value.trim().toLowerCase()
  return list
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => [link.name, link.desc, link.urlLocal, link.urlOnline].some((item) => String(item || '').toLowerCase().includes(key))),
    }))
    .filter((group) => group.links.length || group.title.toLowerCase().includes(key))
}

function currentUrl(link) { return store.jumpMode === 'local' ? link.urlLocal : link.urlOnline }
function openLink(link) {
  const url = currentUrl(link)
  if (!url) return
  window.open(url, '_blank')
}
async function setTheme(mode) {
  try {
    await store.syncThemeMode(mode)
  } catch (error) {
    store.notify(error.message || t('theme.saveFailed'), 'error')
  }
}
async function setJump(mode) {
  try {
    await store.syncJumpMode(mode)
  } catch (error) {
    store.notify(error.message || t('jump.saveFailed'), 'error')
  }
}
function doSearch() {
  const q = keyword.value.trim()
  if (!q) return
  const engine = engines.value.find((item) => item.value === currentEngine.value) || engines.value[0]
  if (!engine?.searchUrl) return store.notify(t('home.noSearchEngine'), 'error')
  const url = engine.searchUrl.replace('{q}', encodeURIComponent(q))
  window.open(url, '_blank')
}
function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}
function toggleLanguageMenu() {
  showLanguageMenu.value = !showLanguageMenu.value
}
function closeLanguageMenu() {
  showLanguageMenu.value = false
}
function changeLocale(locale) {
  store.setLocale(locale)
  closeLanguageMenu()
}
function closeUserMenu() {
  showUserMenu.value = false
}
async function togglePublicNavVisible() {
  try {
    await store.toggleShowPublicNav()
  } catch (error) {
    store.notify(error.message || t('home.toggleFailed'), 'error')
  } finally {
    closeUserMenu()
  }
}
function goSettings() {
  closeUserMenu()
  router.push('/settings')
}
function goAdmin() {
  closeUserMenu()
  router.push('/admin')
}
async function doLogout() {
  closeUserMenu()
  await store.logout()
  router.push('/')
}
function handleClickOutside(event) {
  if (showUserMenu.value && !userDropdownRef.value?.contains(event.target)) {
    closeUserMenu()
  }
  if (showLanguageMenu.value && !languageDropdownRef.value?.contains(event.target)) {
    closeLanguageMenu()
  }
}

function openGroupModal(mode, group = null) {
  if (!store.canEditPrivateNav) return
  groupModalMode.value = mode
  editingGroupId.value = group?.id || null
  groupForm.title = group?.title || ''
  groupForm.desc = group?.desc || ''
  showGroupModal.value = true
}
function closeGroupModal() {
  showGroupModal.value = false
  editingGroupId.value = null
  groupForm.title = ''
  groupForm.desc = ''
}
async function submitGroupModal() {
  try {
    if (!groupForm.title.trim()) return store.notify(t('home.inputGroupName'), 'error')
    if (groupModalMode.value === 'create') {
      await store.addGroup(groupForm.title.trim(), false)
      store.notify(t('home.groupCreated'))
    } else {
      await store.updateGroup(editingGroupId.value, { name: groupForm.title.trim(), description: groupForm.desc.trim() || null })
      store.notify(t('home.groupUpdated'))
    }
    closeGroupModal()
  } catch (e) {
    store.notify(e.message || t('settings.saveFailed'), 'error')
  }
}

function openLinkModal(mode, group = null, link = null) {
  if (!store.canEditPrivateNav) return
  linkModalMode.value = mode
  editingLinkId.value = link?.id || null
  linkForm.groupId = group?.id || ''
  linkForm.name = link?.name || ''
  linkForm.desc = link?.desc || ''
  linkForm.urlLocal = link?.urlLocal || ''
  linkForm.urlOnline = link?.urlOnline || ''
  showLinkModal.value = true
}
function closeLinkModal() {
  showLinkModal.value = false
  editingLinkId.value = null
  linkForm.groupId = ''
  linkForm.name = ''
  linkForm.desc = ''
  linkForm.urlLocal = ''
  linkForm.urlOnline = ''
}
async function submitLinkModal() {
  try {
    if (!linkForm.groupId || !linkForm.name || !linkForm.urlLocal || !linkForm.urlOnline) return store.notify(t('home.fillRequired'), 'error')
    if (linkModalMode.value === 'create') {
      await store.addLink(linkForm.groupId, { name: linkForm.name, desc: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline }, false)
      store.notify(t('home.linkCreated'))
    } else {
      await store.updateLink(editingLinkId.value, { groupId: linkForm.groupId, title: linkForm.name, description: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline })
      store.notify(t('home.linkUpdated'))
    }
    closeLinkModal()
  } catch (e) {
    store.notify(e.message || t('settings.saveFailed'), 'error')
  }
}

async function removeLink(id) {
  if (!window.confirm(t('home.deleteLinkConfirm'))) return
  try {
    await store.removeLink(id)
    store.notify(t('home.linkDeleted'))
  } catch (e) {
    store.notify(e.message || t('admin.deleteFailed'), 'error')
  }
}
async function removeGroup(id) {
  if (!window.confirm(t('home.deleteGroupConfirm'))) return
  try {
    await store.removeGroup(id)
    store.notify(t('home.groupDeleted'))
  } catch (e) {
    store.notify(e.message || t('admin.deleteFailed'), 'error')
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  try {
    await Promise.all([
      store.fetchSearchEngines(),
      store.isLoggedIn ? store.loadUserProfile() : Promise.resolve(),
    ])
    await store.fetchNavData()
  } catch (_) {}
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

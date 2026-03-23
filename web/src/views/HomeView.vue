<template>
  <section class="hero-panel hero-panel-compact">
    <div class="hero-floating-tools">
      <div class="hero-toolbar hero-toolbar-tight">
        <div class="mini-group">
          <button v-for="item in themes" :key="item.value" class="mini-btn" :class="{ active: store.themeMode === item.value }" @click="setTheme(item.value)">{{ item.label }}</button>
        </div>
        <div class="mini-group">
          <button v-for="item in jumps" :key="item.value" class="mini-btn" :class="{ active: store.jumpMode === item.value }" @click="setJump(item.value)">{{ item.label }}</button>
        </div>
        <div v-if="store.isLoggedIn && !store.isAdmin" class="mini-group">
          <span class="mini-group-label">编辑模式</span>
          <button class="mini-btn" :class="{ active: store.editMode }" @click="store.toggleEditMode()">{{ store.editMode ? '已开启' : '已关闭' }}</button>
        </div>
        <button v-if="!store.isLoggedIn" class="mini-primary-btn" @click="$router.push('/login')">登录</button>
        <div v-else class="user-dropdown" ref="userDropdownRef">
          <button class="mini-userbox mini-userbox-trigger" @click="toggleUserMenu">
            <img v-if="resolvedAvatarUrl && !avatarLoadFailed" :src="resolvedAvatarUrl" alt="avatar" class="user-avatar" @error="handleAvatarError" />
            <div v-else class="user-avatar user-avatar-fallback">{{ avatarFallback }}</div>
            <span>{{ displayName }}</span>
            <strong class="dropdown-arrow">▾</strong>
          </button>
          <div v-if="showUserMenu" class="user-dropdown-menu">
            <button v-if="!store.isAdmin" class="dropdown-item dropdown-item-toggle" :class="store.showPublicNav ? 'toggle-on' : 'toggle-off'" @click="togglePublicNavVisible">
              <span>{{ store.showPublicNav ? '关闭公共导航' : '开启公共导航' }}</span>
              <small>{{ store.showPublicNav ? '当前为开启状态，点击后首页只显示个人导航' : '当前为关闭状态，点击后重新显示管理员推荐内容' }}</small>
            </button>
            <button class="dropdown-item" @click="goSettings">
              <span>资料设置</span>
              <small>修改昵称、头像、邮箱、手机号和密码</small>
            </button>
            <button v-if="store.isAdmin" class="dropdown-item" @click="goAdmin">
              <span>进入管理页</span>
              <small>维护公共导航内容</small>
            </button>
            <button class="dropdown-item danger-item" @click="doLogout">
              <span>退出登录</span>
              <small>安全退出当前账号</small>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-content hero-content-compact">
      <p class="hero-tip">你的个人导航中心</p>
      <h1>一页搜全网，也能管你自己的网址收藏</h1>
      <div class="search-box search-box-compact search-box-refined">
        <input v-model="keyword" class="search-input search-input-refined" type="text" placeholder="搜索网页 / 搜索你的导航内容" @keyup.enter="doSearch" />
        <button class="search-btn search-btn-refined" @click="doSearch">搜索</button>
      </div>
      <div class="search-engines search-engines-refined">
        <button v-for="item in engines" :key="item.value" class="chip-btn chip-btn-refined" :class="{ active: currentEngine === item.value }" @click="currentEngine = item.value">{{ item.label }}</button>
      </div>
    </div>
  </section>

  <section class="nav-section" v-if="!store.isLoggedIn || store.showPublicNav">
    <div class="section-header">
      <h2>公共导航</h2>
      <p>未登录也可以浏览；登录后会继续叠加你的个人导航。</p>
    </div>
    <div v-if="store.loading && !filteredPublicGroups.length" class="empty-box">公共导航加载中...</div>
    <div v-else class="group-list">
      <article v-for="group in filteredPublicGroups" :key="group.id" class="group-card">
        <div class="group-head"><h3>{{ group.title }}</h3><span>{{ group.links.length }} 个网址</span></div>
        <div class="link-grid">
          <button v-for="link in group.links" :key="link.id" class="link-card" @click="openLink(link)">
            <strong>{{ link.name }}</strong>
            <span>{{ link.desc }}</span>
            <small>{{ currentUrl(link) }}</small>
          </button>
        </div>
      </article>
      <div v-if="!filteredPublicGroups.length && !store.loading" class="empty-box">暂时还没有公共导航</div>
    </div>
  </section>

  <section class="nav-section" v-if="store.isLoggedIn && !store.isAdmin">
    <div class="section-header section-header-inline">
      <div>
        <h2>我的导航</h2>
        <p v-if="store.canEditPrivateNav">这里只显示你的私有导航，当前已开启编辑模式。</p>
        <p v-else>这里只显示你的私有导航。右上角开启编辑模式后，才会显示新增、编辑、删除入口。</p>
      </div>
      <div v-if="store.canEditPrivateNav" class="section-actions">
        <button class="primary-btn" @click="openGroupModal('create')">添加分组</button>
        <button class="primary-btn" @click="openLinkModal('create')">添加导航</button>
      </div>
    </div>
    <div v-if="store.loading && !filteredPrivateGroups.length" class="empty-box">个人导航加载中...</div>
    <div v-else class="group-list">
      <article v-for="group in filteredPrivateGroups" :key="group.id" class="group-card">
        <div class="group-head">
          <div>
            <h3>{{ group.title }}</h3>
            <span>{{ group.links.length }} 个网址</span>
          </div>
          <div v-if="store.canEditPrivateNav" class="group-actions">
            <button class="mini-btn" @click="openGroupModal('edit', group)">编辑分组</button>
            <button class="mini-btn danger-btn" @click="removeGroup(group.id)">删除分组</button>
          </div>
        </div>
        <div class="link-grid">
          <div v-for="link in group.links" :key="link.id" class="private-link-shell" :class="{ 'link-card-editable': store.canEditPrivateNav }">
            <div v-if="store.canEditPrivateNav" class="link-actions">
              <button class="mini-btn" @click="openLinkModal('edit', group, link)">编辑</button>
              <button class="mini-btn danger-btn" @click="removeLink(link.id)">删除</button>
            </div>
            <button class="link-card" :class="{ 'link-card-inner': store.canEditPrivateNav }" @click="openLink(link)">
              <strong>{{ link.name }}</strong>
              <span>{{ link.desc }}</span>
              <small>{{ currentUrl(link) }}</small>
            </button>
          </div>
        </div>
      </article>
      <div v-if="!filteredPrivateGroups.length && !store.loading" class="empty-box">你还没有个人导航，开启编辑模式后就能添加。</div>
    </div>
  </section>

  <div v-if="showGroupModal" class="modal-mask" @click.self="closeGroupModal">
    <div class="modal-card">
      <div class="modal-head">
        <h3>{{ groupModalMode === 'create' ? '新增分组' : '编辑分组' }}</h3>
        <button class="mini-btn" @click="closeGroupModal">关闭</button>
      </div>
      <div class="form-grid">
        <input v-model="groupForm.title" class="text-input" placeholder="请输入分组名称" />
        <textarea v-model="groupForm.desc" class="text-input textarea-input" placeholder="分组简介（可选）"></textarea>
        <div class="user-box">
          <button class="primary-btn" @click="submitGroupModal">保存</button>
          <button class="mini-btn" @click="closeGroupModal">取消</button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showLinkModal" class="modal-mask" @click.self="closeLinkModal">
    <div class="modal-card">
      <div class="modal-head">
        <h3>{{ linkModalMode === 'create' ? '新增导航' : '编辑导航' }}</h3>
        <button class="mini-btn" @click="closeLinkModal">关闭</button>
      </div>
      <div class="form-grid">
        <select v-model="linkForm.groupId" class="text-input">
          <option disabled value="">请选择分组</option>
          <option v-for="group in store.privateGroups" :key="group.id" :value="group.id">{{ group.title }}</option>
        </select>
        <input v-model="linkForm.name" class="text-input" placeholder="网站名称" />
        <input v-model="linkForm.desc" class="text-input" placeholder="简介说明" />
        <input v-model="linkForm.urlLocal" class="text-input" placeholder="本地模式链接" />
        <input v-model="linkForm.urlOnline" class="text-input" placeholder="外网模式链接" />
        <div class="user-box">
          <button class="primary-btn" @click="submitLinkModal">保存</button>
          <button class="mini-btn" @click="closeLinkModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()
const keyword = ref('')
const currentEngine = ref('bing')
const showGroupModal = ref(false)
const showLinkModal = ref(false)
const showUserMenu = ref(false)
const userDropdownRef = ref(null)
const avatarLoadFailed = ref(false)
const groupModalMode = ref('create')
const linkModalMode = ref('create')
const editingGroupId = ref(null)
const editingLinkId = ref(null)
const groupForm = reactive({ title: '', desc: '' })
const linkForm = reactive({ groupId: '', name: '', desc: '', urlLocal: '', urlOnline: '' })
const themes = [{ label: '夜间', value: 'dark' }, { label: '白天', value: 'light' }, { label: '跟随系统', value: 'system' }]
const jumps = [{ label: '本地模式', value: 'local' }, { label: '外网模式', value: 'online' }]

const filteredPublicGroups = computed(() => filterGroups(store.publicGroups))
const filteredPrivateGroups = computed(() => filterGroups(store.privateGroups))
const displayName = computed(() => store.currentUser?.nickname || store.currentUser?.username || '我的账号')
const avatarFallback = computed(() => String(displayName.value || '我').trim().slice(0, 1).toUpperCase())
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

function filterGroups(groups) {
  if (!keyword.value.trim()) return groups
  const key = keyword.value.trim().toLowerCase()
  return groups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => [link.name, link.desc, link.urlLocal, link.urlOnline].some((item) => String(item || '').toLowerCase().includes(key))),
    }))
    .filter((group) => group.links.length || group.title.toLowerCase().includes(key))
}

function currentUrl(link) { return store.jumpMode === 'local' ? link.urlLocal : link.urlOnline }
function openLink(link) { window.open(currentUrl(link), '_blank') }
async function setTheme(mode) {
  try {
    await store.syncThemeMode(mode)
  } catch (error) {
    store.notify(error.message || '主题模式保存失败', 'error')
  }
}
async function setJump(mode) {
  try {
    await store.syncJumpMode(mode)
  } catch (error) {
    store.notify(error.message || '跳转模式保存失败', 'error')
  }
}
function doSearch() {
  const q = keyword.value.trim()
  if (!q) return
  const engine = engines.value.find((item) => item.value === currentEngine.value) || engines.value[0]
  if (!engine?.searchUrl) return store.notify('当前没有可用的搜索引擎', 'error')
  const url = engine.searchUrl.replace('{q}', encodeURIComponent(q))
  window.open(url, '_blank')
}
function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}
function closeUserMenu() {
  showUserMenu.value = false
}
async function togglePublicNavVisible() {
  try {
    await store.toggleShowPublicNav()
  } catch (error) {
    store.notify(error.message || '切换失败', 'error')
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
  if (!showUserMenu.value) return
  if (!userDropdownRef.value?.contains(event.target)) {
    closeUserMenu()
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
    if (!groupForm.title.trim()) return store.notify('请输入分组名称', 'error')
    if (groupModalMode.value === 'create') {
      await store.addGroup(groupForm.title.trim(), false)
      store.notify('分组创建成功')
    } else {
      await store.updateGroup(editingGroupId.value, { name: groupForm.title.trim(), description: groupForm.desc.trim() || null })
      store.notify('分组修改成功')
    }
    closeGroupModal()
  } catch (e) {
    store.notify(e.message || '保存失败', 'error')
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
    if (!linkForm.groupId || !linkForm.name || !linkForm.urlLocal || !linkForm.urlOnline) return store.notify('请把必填项填完整', 'error')
    if (linkModalMode.value === 'create') {
      await store.addLink(linkForm.groupId, { name: linkForm.name, desc: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline }, false)
      store.notify('导航添加成功')
    } else {
      await store.updateLink(editingLinkId.value, { groupId: linkForm.groupId, title: linkForm.name, description: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline })
      store.notify('导航修改成功')
    }
    closeLinkModal()
  } catch (e) {
    store.notify(e.message || '保存失败', 'error')
  }
}

async function removeLink(id) {
  if (!window.confirm('确认删除这个网址吗？')) return
  try {
    await store.removeLink(id)
    store.notify('导航已删除')
  } catch (e) {
    store.notify(e.message || '删除失败', 'error')
  }
}
async function removeGroup(id) {
  if (!window.confirm('确认删除这个分组吗？分组内的网址也会一起删除。')) return
  try {
    await store.removeGroup(id)
    store.notify('分组已删除')
  } catch (e) {
    store.notify(e.message || '删除失败', 'error')
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

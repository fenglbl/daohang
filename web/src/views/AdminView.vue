<template>
  <section>
    <div class="section-header section-header-inline">
      <div>
        <h2>管理页面</h2>
        <p>管理员维护公共导航和搜索引擎配置，普通用户不进入这个页面。</p>
      </div>
      <div v-if="store.isAdmin" class="section-actions">
        <button class="primary-btn" @click="openGroupModal('create')">新增公共分组</button>
        <button class="primary-btn" @click="openLinkModal('create')">新增公共网址</button>
        <button class="primary-btn" @click="openSearchEngineModal('create')">新增搜索引擎</button>
      </div>
    </div>

    <div v-if="!store.isAdmin" class="empty-box">只有管理员可以进入这个页面，请先登录管理员账号。</div>

    <template v-else>
      <div class="admin-card">
        <div class="group-head">
          <div>
            <h3>搜索引擎配置</h3>
            <span>{{ store.searchEngines.length }} 个搜索引擎配置</span>
          </div>
        </div>
        <div v-if="!store.searchEngines.length" class="empty-box">还没有搜索引擎配置</div>
        <div v-else class="table-like">
          <div class="table-row table-head table-row-search-engine"><span>名称</span><span>显示名</span><span>搜索链接</span><span>状态</span><span>操作</span></div>
          <div class="table-row table-row-search-engine" v-for="engine in store.searchEngines" :key="engine.id">
            <span>{{ engine.name }}</span>
            <span>{{ engine.label }}</span>
            <span>{{ engine.search_url }}</span>
            <span>{{ Number(engine.is_enabled) === 1 ? '启用' : '停用' }}</span>
            <div class="table-actions">
              <button class="mini-btn" @click="openSearchEngineModal('edit', engine)">编辑</button>
              <button class="danger-btn" @click="toggleSearchEngine(engine)">
                {{ Number(engine.is_enabled) === 1 ? '停用' : '启用' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card" v-for="group in store.publicGroups" :key="group.id">
        <div class="group-head">
          <div>
            <h3>{{ group.title }}</h3>
            <span>{{ group.links.length }} 个公共网址</span>
          </div>
          <div class="group-actions">
            <button class="mini-btn" @click="openGroupModal('edit', group)">编辑分组</button>
            <button class="mini-btn danger-btn" @click="removeGroup(group.id)">删除分组</button>
          </div>
        </div>
        <div v-if="!group.links.length" class="empty-box">当前分组还没有网址</div>
        <div v-else class="table-like">
          <div class="table-row table-head"><span>名称</span><span>本地模式</span><span>外网模式</span><span>操作</span></div>
          <div class="table-row" v-for="link in group.links" :key="link.id">
            <span>{{ link.name }}</span>
            <span>{{ link.urlLocal }}</span>
            <span>{{ link.urlOnline }}</span>
            <div class="table-actions">
              <button class="mini-btn" @click="openLinkModal('edit', group, link)">编辑</button>
              <button class="danger-btn" @click="removeLink(link.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showGroupModal" class="modal-mask" @click.self="closeGroupModal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>{{ groupModalMode === 'create' ? '新增公共分组' : '编辑公共分组' }}</h3>
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
          <h3>{{ linkModalMode === 'create' ? '新增公共网址' : '编辑公共网址' }}</h3>
          <button class="mini-btn" @click="closeLinkModal">关闭</button>
        </div>
        <div class="form-grid">
          <select v-model="linkForm.groupId" class="text-input">
            <option disabled value="">请选择分组</option>
            <option v-for="group in store.publicGroups" :key="group.id" :value="group.id">{{ group.title }}</option>
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

    <div v-if="showSearchEngineModal" class="modal-mask" @click.self="closeSearchEngineModal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>{{ searchEngineModalMode === 'create' ? '新增搜索引擎' : '编辑搜索引擎' }}</h3>
          <button class="mini-btn" @click="closeSearchEngineModal">关闭</button>
        </div>
        <div class="form-grid">
          <input v-model="searchEngineForm.name" class="text-input" placeholder="唯一名称，如 bing-custom" />
          <input v-model="searchEngineForm.label" class="text-input" placeholder="显示名称，如 必应" />
          <input v-model="searchEngineForm.searchUrl" class="text-input" placeholder="搜索链接，必须包含 {q}" />
          <input v-model="searchEngineForm.sortOrder" class="text-input" type="number" placeholder="排序值" />
          <select v-model="searchEngineForm.isEnabled" class="text-input">
            <option :value="1">启用</option>
            <option :value="0">停用</option>
          </select>
          <div class="user-box">
            <button class="primary-btn" @click="submitSearchEngineModal">保存</button>
            <button class="mini-btn" @click="closeSearchEngineModal">取消</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const showGroupModal = ref(false)
const showLinkModal = ref(false)
const showSearchEngineModal = ref(false)
const groupModalMode = ref('create')
const linkModalMode = ref('create')
const searchEngineModalMode = ref('create')
const editingGroupId = ref(null)
const editingLinkId = ref(null)
const editingSearchEngineId = ref(null)
const groupForm = reactive({ title: '', desc: '' })
const linkForm = reactive({ groupId: '', name: '', desc: '', urlLocal: '', urlOnline: '' })
const searchEngineForm = reactive({ name: '', label: '', searchUrl: '', sortOrder: 0, isEnabled: 1 })

function openGroupModal(mode, group = null) {
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
      await store.addGroup(groupForm.title.trim(), true)
      store.notify('公共分组创建成功')
    } else {
      await store.updateGroup(editingGroupId.value, { name: groupForm.title.trim(), description: groupForm.desc.trim() || null })
      store.notify('公共分组修改成功')
    }
    closeGroupModal()
  } catch (e) { store.notify(e.message || '保存失败', 'error') }
}

function openLinkModal(mode, group = null, link = null) {
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
      await store.addLink(linkForm.groupId, { name: linkForm.name, desc: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline }, true)
      store.notify('公共网址添加成功')
    } else {
      await store.updateLink(editingLinkId.value, { groupId: linkForm.groupId, title: linkForm.name, description: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline })
      store.notify('公共网址修改成功')
    }
    closeLinkModal()
  } catch (e) { store.notify(e.message || '保存失败', 'error') }
}

function openSearchEngineModal(mode, engine = null) {
  searchEngineModalMode.value = mode
  editingSearchEngineId.value = engine?.id || null
  searchEngineForm.name = engine?.name || ''
  searchEngineForm.label = engine?.label || ''
  searchEngineForm.searchUrl = engine?.search_url || ''
  searchEngineForm.sortOrder = Number(engine?.sort_order || 0)
  searchEngineForm.isEnabled = Number(engine?.is_enabled ?? 1)
  showSearchEngineModal.value = true
}
function closeSearchEngineModal() {
  showSearchEngineModal.value = false
  editingSearchEngineId.value = null
  searchEngineForm.name = ''
  searchEngineForm.label = ''
  searchEngineForm.searchUrl = ''
  searchEngineForm.sortOrder = 0
  searchEngineForm.isEnabled = 1
}
async function submitSearchEngineModal() {
  try {
    if (!searchEngineForm.name.trim() || !searchEngineForm.label.trim() || !searchEngineForm.searchUrl.trim()) {
      return store.notify('请填写完整搜索引擎信息', 'error')
    }
    if (!searchEngineForm.searchUrl.includes('{q}')) {
      return store.notify('搜索链接必须包含 {q}', 'error')
    }
    const payload = {
      name: searchEngineForm.name.trim(),
      label: searchEngineForm.label.trim(),
      searchUrl: searchEngineForm.searchUrl.trim(),
      sortOrder: Number(searchEngineForm.sortOrder) || 0,
      isEnabled: Number(searchEngineForm.isEnabled) === 0 ? 0 : 1,
    }
    if (searchEngineModalMode.value === 'create') {
      await store.createSearchEngine(payload)
      store.notify('搜索引擎添加成功')
    } else {
      await store.updateSearchEngine(editingSearchEngineId.value, payload)
      store.notify('搜索引擎修改成功')
    }
    await store.fetchSearchEngines(true)
    closeSearchEngineModal()
  } catch (e) {
    store.notify(e.message || '保存失败', 'error')
  }
}

async function removeGroup(id) {
  if (!window.confirm('确认删除这个公共分组吗？分组内的网址也会一起删除。')) return
  try {
    await store.removeGroup(id)
    store.notify('公共分组已删除')
  } catch (e) { store.notify(e.message || '删除失败', 'error') }
}

async function removeLink(id) {
  if (!window.confirm('确认删除这个公共网址吗？')) return
  try {
    await store.removeLink(id)
    store.notify('公共网址已删除')
  } catch (e) { store.notify(e.message || '删除失败', 'error') }
}

async function toggleSearchEngine(engine) {
  const enabled = Number(engine?.is_enabled) === 1
  const actionText = enabled ? '停用' : '启用'
  if (!window.confirm(`确认${actionText}这个搜索引擎吗？`)) return
  try {
    await store.updateSearchEngine(engine.id, { isEnabled: enabled ? 0 : 1 })
    await store.fetchSearchEngines(true)
    store.notify(`搜索引擎已${actionText}`)
  } catch (e) {
    store.notify(e.message || `${actionText}失败`, 'error')
  }
}

onMounted(async () => {
  if (store.isLoggedIn) {
    await Promise.all([store.fetchNavData(), store.fetchSearchEngines(true)])
  }
})
</script>


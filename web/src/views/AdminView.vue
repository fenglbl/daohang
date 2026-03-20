<template>
  <section>
    <div class="section-header section-header-inline">
      <div>
        <h2>管理页面</h2>
        <p>管理员维护公共导航，普通用户不进入这个页面。</p>
      </div>
      <div v-if="store.isAdmin" class="section-actions">
        <button class="primary-btn" @click="openGroupModal('create')">新增公共分组</button>
        <button class="primary-btn" @click="openLinkModal('create')">新增公共网址</button>
      </div>
    </div>

    <div v-if="!store.isAdmin" class="empty-box">只有管理员可以进入这个页面，请先登录管理员账号。</div>

    <template v-else>
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
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const showGroupModal = ref(false)
const showLinkModal = ref(false)
const groupModalMode = ref('create')
const linkModalMode = ref('create')
const editingGroupId = ref(null)
const editingLinkId = ref(null)
const groupForm = reactive({ title: '', desc: '' })
const linkForm = reactive({ groupId: '', name: '', desc: '', urlLocal: '', urlOnline: '' })

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

onMounted(async () => {
  if (store.isLoggedIn) await store.fetchNavData()
})
</script>

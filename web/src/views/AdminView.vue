<template>
  <section>
    <div class="section-header section-header-inline">
      <div>
        <h2>{{ t('admin.title') }}</h2>
        <p>{{ t('admin.desc') }}</p>
      </div>
      <div v-if="store.isAdmin" class="section-actions">
        <button class="primary-btn" @click="openGroupModal('create')">{{ t('admin.addPublicGroup') }}</button>
        <button class="primary-btn" @click="openLinkModal('create')">{{ t('admin.addPublicLink') }}</button>
        <button class="primary-btn" @click="openSearchEngineModal('create')">{{ t('admin.addSearchEngine') }}</button>
      </div>
    </div>

    <div v-if="!store.isAdmin" class="empty-box">{{ t('admin.onlyAdmin') }}</div>

    <template v-else>
      <div class="admin-card">
        <div class="group-head">
          <div>
            <h3>{{ t('admin.searchEngineConfig') }}</h3>
            <span>{{ t('admin.searchEngineCount', { count: store.searchEngines.length }) }}</span>
          </div>
        </div>
        <div v-if="!store.searchEngines.length" class="empty-box">{{ t('admin.noSearchEngine') }}</div>
        <div v-else class="table-like">
          <div class="table-row table-head table-row-search-engine">
            <span>{{ t('admin.name') }}</span>
            <span>{{ t('admin.label') }}</span>
            <span>{{ t('admin.searchUrl') }}</span>
            <span>{{ t('common.status') }}</span>
            <span>{{ t('common.actions') }}</span>
          </div>
          <div class="table-row table-row-search-engine" v-for="engine in store.searchEngines" :key="engine.id">
            <span>{{ engine.name }}</span>
            <span>{{ engine.label }}</span>
            <span>{{ engine.search_url }}</span>
            <span>{{ Number(engine.is_enabled) === 1 ? t('admin.enabledStatus') : t('admin.disabledStatus') }}</span>
            <div class="table-actions">
              <button class="mini-btn" @click="openSearchEngineModal('edit', engine)">{{ t('common.edit') }}</button>
              <button class="mini-btn" @click="toggleSearchEngine(engine)">
                {{ Number(engine.is_enabled) === 1 ? t('common.disable') : t('common.enable') }}
              </button>
              <button class="danger-btn" @click="removeSearchEngine(engine.id)">{{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card" v-for="group in store.publicGroups" :key="group.id" :class="{ 'item-disabled': !group.isEnabled }">
        <div class="group-head">
          <div>
            <h3>{{ group.title }} <small v-if="!group.isEnabled">{{ t('admin.disabledTag') }}</small></h3>
            <span>{{ t('admin.publicLinkCount', { count: group.links.length }) }}</span>
          </div>
          <div class="group-actions">
            <button class="mini-btn" @click="openGroupModal('edit', group)">{{ t('admin.editGroup') }}</button>
            <button class="mini-btn" @click="toggleGroupEnabled(group)">{{ group.isEnabled ? t('common.disable') : t('common.enable') }}</button>
            <button class="mini-btn danger-btn" @click="removeGroup(group.id)">{{ t('admin.hardDelete') }}</button>
          </div>
        </div>
        <div v-if="!group.links.length" class="empty-box">{{ t('admin.noGroupLinks') }}</div>
        <div v-else class="table-like">
          <div class="table-row table-head table-row-public-links">
            <span>{{ t('admin.name') }}</span>
            <span>{{ t('admin.localMode') }}</span>
            <span>{{ t('admin.onlineMode') }}</span>
            <span>{{ t('common.status') }}</span>
            <span>{{ t('common.actions') }}</span>
          </div>
          <div class="table-row table-row-public-links" v-for="link in group.links" :key="link.id" :class="{ 'item-disabled': !link.isEnabled }">
            <span>{{ link.name }}</span>
            <span>{{ link.urlLocal }}</span>
            <span>{{ link.urlOnline }}</span>
            <span>{{ link.isEnabled ? t('admin.enabledStatus') : t('admin.disabledStatus') }}</span>
            <div class="table-actions">
              <button class="mini-btn" @click="openLinkModal('edit', group, link)">{{ t('common.edit') }}</button>
              <button class="mini-btn" @click="toggleLinkEnabled(link)">{{ link.isEnabled ? t('common.disable') : t('common.enable') }}</button>
              <button class="danger-btn" @click="removeLink(link.id)">{{ t('admin.hardDelete') }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showGroupModal" class="modal-mask" @click.self="closeGroupModal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>{{ groupModalMode === 'create' ? t('admin.createPublicGroup') : t('admin.updatePublicGroup') }}</h3>
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
          <h3>{{ linkModalMode === 'create' ? t('admin.createPublicLink') : t('admin.updatePublicLink') }}</h3>
          <button class="mini-btn" @click="closeLinkModal">{{ t('common.close') }}</button>
        </div>
        <div class="form-grid">
          <select v-model="linkForm.groupId" class="text-input">
            <option disabled value="">{{ t('common.selectGroup') }}</option>
            <option v-for="group in store.publicGroups" :key="group.id" :value="group.id">{{ group.title }}</option>
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

    <div v-if="showSearchEngineModal" class="modal-mask" @click.self="closeSearchEngineModal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>{{ searchEngineModalMode === 'create' ? t('admin.createSearchEngineTitle') : t('admin.updateSearchEngineTitle') }}</h3>
          <button class="mini-btn" @click="closeSearchEngineModal">{{ t('common.close') }}</button>
        </div>
        <div class="form-grid">
          <input v-model="searchEngineForm.name" class="text-input" :placeholder="t('admin.uniqueNamePlaceholder')" />
          <input v-model="searchEngineForm.label" class="text-input" :placeholder="t('admin.labelPlaceholder')" />
          <input v-model="searchEngineForm.searchUrl" class="text-input" :placeholder="t('admin.searchUrlPlaceholder')" />
          <input v-model="searchEngineForm.sortOrder" class="text-input" type="number" :placeholder="t('admin.sortOrderPlaceholder')" />
          <select v-model="searchEngineForm.isEnabled" class="text-input">
            <option :value="1">{{ t('common.enable') }}</option>
            <option :value="0">{{ t('common.disable') }}</option>
          </select>
          <div class="user-box">
            <button class="primary-btn" @click="submitSearchEngineModal">{{ t('common.save') }}</button>
            <button class="mini-btn" @click="closeSearchEngineModal">{{ t('common.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useI18n } from '../i18n'

const store = useAppStore()
const { t } = useI18n()
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
    if (!groupForm.title.trim()) return store.notify(t('admin.inputGroupName'), 'error')
    if (groupModalMode.value === 'create') {
      await store.addGroup(groupForm.title.trim(), true)
      store.notify(t('admin.publicGroupCreated'))
    } else {
      await store.updateGroup(editingGroupId.value, { name: groupForm.title.trim(), description: groupForm.desc.trim() || null })
      store.notify(t('admin.publicGroupUpdated'))
    }
    closeGroupModal()
  } catch (e) { store.notify(e.message || t('admin.saveFailed'), 'error') }
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
    if (!linkForm.groupId || !linkForm.name || !linkForm.urlLocal || !linkForm.urlOnline) return store.notify(t('admin.fillRequired'), 'error')
    if (linkModalMode.value === 'create') {
      await store.addLink(linkForm.groupId, { name: linkForm.name, desc: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline }, true)
      store.notify(t('admin.publicLinkCreated'))
    } else {
      await store.updateLink(editingLinkId.value, { groupId: linkForm.groupId, title: linkForm.name, description: linkForm.desc, urlLocal: linkForm.urlLocal, urlOnline: linkForm.urlOnline })
      store.notify(t('admin.publicLinkUpdated'))
    }
    closeLinkModal()
  } catch (e) { store.notify(e.message || t('admin.saveFailed'), 'error') }
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
      return store.notify(t('admin.fillSearchEngine'), 'error')
    }
    if (!searchEngineForm.searchUrl.includes('{q}')) {
      return store.notify(t('admin.searchUrlMustInclude'), 'error')
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
      store.notify(t('admin.searchEngineCreated'))
    } else {
      await store.updateSearchEngine(editingSearchEngineId.value, payload)
      store.notify(t('admin.searchEngineUpdated'))
    }
    await store.fetchSearchEngines(true)
    closeSearchEngineModal()
  } catch (e) {
    store.notify(e.message || t('admin.saveFailed'), 'error')
  }
}

async function toggleGroupEnabled(group) {
  const nextEnabled = !group.isEnabled
  const actionText = nextEnabled ? t('common.enable') : t('common.disable')
  if (!window.confirm(t('admin.confirmToggleGroup', { action: actionText }))) return
  try {
    await store.toggleGroupEnabled(group.id, nextEnabled)
    store.notify(nextEnabled ? t('admin.publicGroupEnabled') : t('admin.publicGroupDisabled'))
  } catch (e) {
    store.notify(e.message || t('admin.operationFailed'), 'error')
  }
}

async function toggleLinkEnabled(link) {
  const nextEnabled = !link.isEnabled
  const actionText = nextEnabled ? t('common.enable') : t('common.disable')
  if (!window.confirm(t('admin.confirmToggleLink', { action: actionText }))) return
  try {
    await store.toggleLinkEnabled(link.id, nextEnabled)
    store.notify(nextEnabled ? t('admin.publicLinkEnabled') : t('admin.publicLinkDisabled'))
  } catch (e) {
    store.notify(e.message || t('admin.operationFailed'), 'error')
  }
}

async function removeGroup(id) {
  if (!window.confirm(t('admin.confirmDeleteGroup'))) return
  try {
    await store.removeGroup(id)
    store.notify(t('admin.publicGroupDeleted'))
  } catch (e) { store.notify(e.message || t('admin.deleteFailed'), 'error') }
}

async function removeLink(id) {
  if (!window.confirm(t('admin.confirmDeleteLink'))) return
  try {
    await store.removeLink(id)
    store.notify(t('admin.publicLinkDeleted'))
  } catch (e) { store.notify(e.message || t('admin.deleteFailed'), 'error') }
}

async function toggleSearchEngine(engine) {
  const enabled = Number(engine?.is_enabled) === 1
  const actionText = enabled ? t('common.disable') : t('common.enable')
  if (!window.confirm(t('admin.confirmToggleSearchEngine', { action: actionText }))) return
  try {
    await store.updateSearchEngine(engine.id, { isEnabled: enabled ? 0 : 1 })
    await store.fetchSearchEngines(true)
    store.notify(t('admin.searchEngineToggled', { action: actionText }))
  } catch (e) {
    store.notify(e.message || t('admin.operationFailed'), 'error')
  }
}

async function removeSearchEngine(id) {
  if (!window.confirm(t('admin.confirmDeleteSearchEngine'))) return
  try {
    await store.removeSearchEngine(id)
    await store.fetchSearchEngines(true)
    store.notify(t('admin.searchEngineDeleted'))
  } catch (e) {
    store.notify(e.message || t('admin.deleteFailed'), 'error')
  }
}

onMounted(async () => {
  if (store.isLoggedIn) {
    await Promise.all([store.fetchNavData(), store.fetchSearchEngines(true)])
  }
})
</script>

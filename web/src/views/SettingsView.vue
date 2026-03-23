<template>
  <section class="auth-card settings-page">
    <div class="section-header">
      <h2>{{ t('settings.title') }}</h2>
      <p>{{ t('settings.desc') }}</p>
    </div>

    <div class="settings-grid">
      <div class="settings-panel">
        <div class="panel-head">
          <h3>{{ t('settings.basic') }}</h3>
          <p>{{ t('settings.basicDesc') }}</p>
        </div>
        <div class="form-grid">
          <div class="avatar-upload-box">
            <img v-if="avatarPreview" :src="avatarPreview" alt="avatar" class="settings-avatar-preview" />
            <div v-else class="settings-avatar-preview settings-avatar-fallback">{{ avatarFallback }}</div>
            <div class="avatar-upload-actions">
              <input ref="avatarInputRef" class="avatar-file-input" type="file" accept="image/*" @change="handleAvatarChange" />
              <button class="mini-btn" @click="triggerAvatarSelect">{{ t('settings.chooseAvatar') }}</button>
              <small v-if="selectedAvatarFile" class="avatar-file-name">{{ t('settings.avatarSelected', { name: selectedAvatarFile.name, size: selectedAvatarSizeLabel }) }}</small>
              <small v-else class="avatar-file-name">{{ t('settings.avatarTip') }}</small>
            </div>
          </div>

          <div class="field-block">
            <input v-model="profileForm.username" class="text-input" disabled :placeholder="t('settings.accountPlaceholder')" />
          </div>
          <div class="field-block">
            <input v-model="profileForm.nickname" class="text-input" :class="{ 'input-invalid': profileErrors.nickname }" :placeholder="t('settings.nicknamePlaceholder')" @blur="validateNickname" />
            <small v-if="profileErrors.nickname" class="field-error">{{ profileErrors.nickname }}</small>
          </div>
          <div class="field-block">
            <input v-model="profileForm.email" class="text-input" :class="{ 'input-invalid': profileErrors.email }" :placeholder="t('settings.emailPlaceholder')" @blur="validateEmail" />
            <small v-if="profileErrors.email" class="field-error">{{ profileErrors.email }}</small>
          </div>
          <div class="field-block">
            <input v-model="profileForm.phone" class="text-input" :class="{ 'input-invalid': profileErrors.phone }" :placeholder="t('settings.phonePlaceholder')" @blur="validatePhone" />
            <small v-if="profileErrors.phone" class="field-error">{{ profileErrors.phone }}</small>
          </div>
          <div class="user-box">
            <button class="primary-btn" @click="saveProfile">{{ t('settings.saveProfile') }}</button>
            <button class="mini-btn" @click="$router.push('/')">{{ t('common.backHome') }}</button>
          </div>
        </div>
      </div>

      <div class="settings-panel">
        <div class="panel-head">
          <h3>{{ t('settings.passwordTitle') }}</h3>
          <p>{{ t('settings.passwordDesc') }}</p>
        </div>
        <div class="form-grid">
          <div class="field-block">
            <input v-model="passwordForm.oldPassword" class="text-input" :class="{ 'input-invalid': passwordErrors.oldPassword }" type="password" :placeholder="t('settings.oldPasswordPlaceholder')" @blur="validateOldPassword" />
            <small v-if="passwordErrors.oldPassword" class="field-error">{{ passwordErrors.oldPassword }}</small>
          </div>
          <div class="field-block">
            <input v-model="passwordForm.newPassword" class="text-input" :class="{ 'input-invalid': passwordErrors.newPassword }" type="password" :placeholder="t('settings.newPasswordPlaceholder')" @blur="validateNewPassword" />
            <small v-if="passwordErrors.newPassword" class="field-error">{{ passwordErrors.newPassword }}</small>
          </div>
          <div class="field-block">
            <input v-model="passwordForm.confirmPassword" class="text-input" :class="{ 'input-invalid': passwordErrors.confirmPassword }" type="password" :placeholder="t('settings.confirmNewPasswordPlaceholder')" @blur="validateConfirmPassword" />
            <small v-if="passwordErrors.confirmPassword" class="field-error">{{ passwordErrors.confirmPassword }}</small>
          </div>
          <div class="user-box">
            <button class="primary-btn" @click="savePassword">{{ t('settings.savePassword') }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useAppStore } from '../stores/app'
import { useI18n } from '../i18n'

const router = useRouter()
const store = useAppStore()
const { t } = useI18n()
const avatarInputRef = ref(null)
const selectedAvatarFile = ref(null)
const avatarPreview = ref('')

const profileForm = reactive({ username: '', nickname: '', email: '', phone: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const profileErrors = reactive({ nickname: '', email: '', phone: '' })
const passwordErrors = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const avatarFallback = computed(() => {
  const name = profileForm.nickname || profileForm.username || t('home.avatarFallback')
  return String(name).trim().slice(0, 1).toUpperCase()
})
const selectedAvatarSizeLabel = computed(() => {
  const size = selectedAvatarFile.value?.size || 0
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
})

function resolveAvatarUrl(url) {
  if (!url) return ''
  const version = store.avatarVersion ? `?v=${encodeURIComponent(store.avatarVersion)}` : ''
  if (/^https?:\/\//i.test(url)) return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(store.avatarVersion || '')}`
  return `http://127.0.0.1:3000${url}${version}`
}

function validateNickname() {
  const value = profileForm.nickname.trim()
  if (!value) return (profileErrors.nickname = t('settings.nicknameRequired'))
  if (value.length > 20) return (profileErrors.nickname = t('settings.nicknameTooLong'))
  profileErrors.nickname = ''
  return ''
}
function validateEmail() {
  const value = profileForm.email.trim()
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return (profileErrors.email = t('settings.emailInvalid'))
  profileErrors.email = ''
  return ''
}
function validatePhone() {
  const value = profileForm.phone.trim()
  if (value && !/^1\d{10}$/.test(value)) return (profileErrors.phone = t('settings.phoneInvalid'))
  profileErrors.phone = ''
  return ''
}
function validateOldPassword() {
  if (!passwordForm.oldPassword.trim()) return (passwordErrors.oldPassword = t('settings.oldPasswordRequired'))
  passwordErrors.oldPassword = ''
  return ''
}
function validateNewPassword() {
  const value = passwordForm.newPassword.trim()
  if (!value) return (passwordErrors.newPassword = t('settings.newPasswordRequired'))
  if (value.length < 6 || value.length > 32) return (passwordErrors.newPassword = t('settings.newPasswordRule'))
  passwordErrors.newPassword = ''
  return ''
}
function validateConfirmPassword() {
  const value = passwordForm.confirmPassword.trim()
  if (!value) return (passwordErrors.confirmPassword = t('settings.confirmNewPasswordRequired'))
  if (value !== passwordForm.newPassword.trim()) return (passwordErrors.confirmPassword = t('settings.newPasswordNotMatch'))
  passwordErrors.confirmPassword = ''
  return ''
}
function validateProfileForm() {
  return ![validateNickname(), validateEmail(), validatePhone()].some(Boolean)
}
function validatePasswordForm() {
  return ![validateOldPassword(), validateNewPassword(), validateConfirmPassword()].some(Boolean)
}

function fillProfile(user = {}) {
  profileForm.username = user.username || ''
  profileForm.nickname = user.nickname || ''
  profileForm.email = user.email || ''
  profileForm.phone = user.phone || ''
  avatarPreview.value = resolveAvatarUrl(user.avatar_url || '')
}

async function loadProfile() {
  if (!store.isLoggedIn) {
    store.notify(t('settings.loginFirst'), 'error')
    router.push('/login')
    return
  }
  await store.loadUserProfile()
  fillProfile(store.currentUser || {})
}
function triggerAvatarSelect() { avatarInputRef.value?.click() }
function canvasToBlob(canvas, type, quality) { return new Promise((resolve) => canvas.toBlob(resolve, type, quality)) }

async function compressImage(file) {
  const imageUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = imageUrl
    })
    const maxSide = 1024
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    let blob = await canvasToBlob(canvas, 'image/jpeg', 0.86)
    if (!blob) throw new Error(t('settings.imageCompressFailed'))
    if (blob.size > 1024 * 1024) blob = await canvasToBlob(canvas, 'image/jpeg', 0.72)
    if (!blob) throw new Error(t('settings.imageCompressFailed'))
    return new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

async function handleAvatarChange(event) {
  try {
    const file = event.target.files?.[0]
    if (!file) return
    if (!String(file.type || '').startsWith('image/')) return store.notify(t('settings.selectImage'), 'error')
    if (file.size > 10 * 1024 * 1024) return store.notify(t('settings.avatarTooLarge'), 'error')
    const compressed = await compressImage(file)
    selectedAvatarFile.value = compressed
    avatarPreview.value = URL.createObjectURL(compressed)
    store.notify(t('settings.avatarCompressed'))
  } catch (error) {
    store.notify(error.message || t('settings.imageProcessFailed'), 'error')
  }
}

async function saveProfile() {
  try {
    if (!validateProfileForm()) return
    let uploadedAvatarUrl = null
    if (selectedAvatarFile.value) {
      const uploadRes = await api.uploadAvatar(selectedAvatarFile.value)
      uploadedAvatarUrl = uploadRes.data.avatar_url
    }
    const result = await store.updateCurrentUserProfile({ nickname: profileForm.nickname.trim(), email: profileForm.email.trim(), phone: profileForm.phone.trim() })
    fillProfile(result || store.currentUser)
    if (uploadedAvatarUrl) {
      store.bumpAvatarVersion()
      avatarPreview.value = resolveAvatarUrl(uploadedAvatarUrl)
      selectedAvatarFile.value = null
      if (avatarInputRef.value) avatarInputRef.value.value = ''
      await store.loadUserProfile()
    }
    store.notify(uploadedAvatarUrl ? t('settings.profileAndAvatarSaved') : t('settings.profileSaved'))
  } catch (error) {
    store.notify(error.message || t('settings.saveFailed'), 'error')
  }
}

async function savePassword() {
  try {
    if (!validatePasswordForm()) return
    await store.updateCurrentUserPassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword, confirmPassword: passwordForm.confirmPassword })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    store.notify(t('settings.passwordChanged'))
    await store.logout()
    router.push('/login')
  } catch (error) {
    store.notify(error.message || t('settings.passwordChangeFailed'), 'error')
  }
}

onMounted(async () => { await loadProfile() })
</script>

<template>
  <section class="auth-card auth-card-simple">
    <div class="section-header">
      <h2>{{ t('auth.register') }}</h2>
      <p>{{ t('auth.registerDesc') }}</p>
    </div>
    <div class="form-grid">
      <div class="field-block">
        <input v-model="form.username" class="text-input" :class="{ 'input-invalid': errors.username }" :placeholder="t('auth.registerUsernamePlaceholder')" @blur="validateUsername" />
        <small v-if="errors.username" class="field-error">{{ errors.username }}</small>
      </div>
      <div class="field-block">
        <input v-model="form.nickname" class="text-input" :class="{ 'input-invalid': errors.nickname }" :placeholder="t('auth.nicknameOptionalPlaceholder')" @blur="validateNickname" />
        <small v-if="errors.nickname" class="field-error">{{ errors.nickname }}</small>
      </div>
      <div class="field-block">
        <input v-model="form.password" class="text-input" :class="{ 'input-invalid': errors.password }" type="password" :placeholder="t('auth.passwordPlaceholder')" @blur="validatePassword" />
        <small v-if="errors.password" class="field-error">{{ errors.password }}</small>
      </div>
      <div class="field-block">
        <input v-model="form.confirmPassword" class="text-input" :class="{ 'input-invalid': errors.confirmPassword }" type="password" :placeholder="t('auth.confirmPasswordPlaceholder')" @blur="validateConfirmPassword" />
        <small v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</small>
      </div>
      <button class="primary-btn large" @click="submitRegister">{{ t('auth.registerButton') }}</button>
    </div>
    <div class="auth-footnote">
      {{ t('auth.hasAccount') }}
      <a href="javascript:void(0)" @click="$router.push('/login')">{{ t('auth.backLogin') }}</a>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useI18n } from '../i18n'

const router = useRouter()
const store = useAppStore()
const { t } = useI18n()
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})
const errors = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})

function validateUsername() {
  const value = form.username.trim()
  if (!value) return (errors.username = t('auth.inputRegisterUsername'))
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(value)) return (errors.username = t('auth.usernameRule'))
  errors.username = ''
  return ''
}
function validateNickname() {
  const value = form.nickname.trim()
  if (value && value.length > 20) return (errors.nickname = t('auth.nicknameRule'))
  errors.nickname = ''
  return ''
}
function validatePassword() {
  const value = form.password.trim()
  if (!value) return (errors.password = t('auth.inputPassword'))
  if (value.length < 6 || value.length > 32) return (errors.password = t('auth.passwordRule'))
  errors.password = ''
  return ''
}
function validateConfirmPassword() {
  const value = form.confirmPassword.trim()
  if (!value) return (errors.confirmPassword = t('auth.confirmPasswordPlaceholder'))
  if (value !== form.password.trim()) return (errors.confirmPassword = t('auth.passwordNotMatch'))
  errors.confirmPassword = ''
  return ''
}
function validateAll() {
  return ![validateUsername(), validateNickname(), validatePassword(), validateConfirmPassword()].some(Boolean)
}

async function submitRegister() {
  try {
    if (!validateAll()) return
    await store.register({ username: form.username.trim(), nickname: form.nickname.trim(), password: form.password.trim() })
    store.notify(t('auth.registerSuccess'))
    router.push('/login')
  } catch (error) {
    store.notify(error.message || t('auth.registerFailed'), 'error')
  }
}
</script>

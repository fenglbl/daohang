<template>
  <section class="auth-card auth-card-simple">
    <div class="section-header">
      <h2>{{ t('auth.login') }}</h2>
      <p>{{ t('auth.loginDesc') }}</p>
    </div>
    <div class="form-grid">
      <div class="field-block">
        <input v-model="username" class="text-input" :class="{ 'input-invalid': usernameError }" :placeholder="t('auth.usernamePlaceholder')" @blur="validateUsername" />
        <small v-if="usernameError" class="field-error">{{ usernameError }}</small>
      </div>
      <div class="field-block">
        <input v-model="password" class="text-input" :class="{ 'input-invalid': passwordError }" type="password" :placeholder="t('auth.passwordPlaceholder')" @blur="validatePassword" />
        <small v-if="passwordError" class="field-error">{{ passwordError }}</small>
      </div>
      <button class="primary-btn large" @click="submitLogin">{{ t('auth.loginButton') }}</button>
    </div>
    <div class="auth-footnote">
      {{ t('auth.noAccount') }}
      <a href="javascript:void(0)" @click="$router.push('/register')">{{ t('auth.goRegister') }}</a>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useI18n } from '../i18n'

const router = useRouter()
const store = useAppStore()
const { t } = useI18n()
const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')

function validateUsername() {
  if (!username.value.trim()) return (usernameError.value = t('auth.inputUsername'))
  usernameError.value = ''
  return ''
}
function validatePassword() {
  if (!password.value.trim()) return (passwordError.value = t('auth.inputPassword'))
  passwordError.value = ''
  return ''
}
function validateAll() {
  return ![validateUsername(), validatePassword()].some(Boolean)
}

async function submitLogin() {
  try {
    if (!validateAll()) return
    const user = await store.login({ username: username.value.trim(), password: password.value.trim() })
    router.push(user.role === 'admin' ? '/admin' : '/')
  } catch (error) {
    store.notify(error.message || t('auth.loginFailed'), 'error')
  }
}
</script>

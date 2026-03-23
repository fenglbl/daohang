<template>
  <section class="auth-card auth-card-simple">
    <div class="section-header">
      <h2>登录</h2>
      <p>输入账号密码即可登录，系统自动识别管理员或普通用户身份。</p>
    </div>
    <div class="form-grid">
      <div class="field-block">
        <input v-model="username" class="text-input" :class="{ 'input-invalid': usernameError }" placeholder="请输入用户名" @blur="validateUsername" />
        <small v-if="usernameError" class="field-error">{{ usernameError }}</small>
      </div>
      <div class="field-block">
        <input v-model="password" class="text-input" :class="{ 'input-invalid': passwordError }" type="password" placeholder="请输入密码" @blur="validatePassword" />
        <small v-if="passwordError" class="field-error">{{ passwordError }}</small>
      </div>
      <button class="primary-btn large" @click="submitLogin">登录进入</button>
    </div>
    <div class="auth-footnote">
      还没有账号？
      <a href="javascript:void(0)" @click="$router.push('/register')">去注册</a>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()
const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')

function validateUsername() {
  if (!username.value.trim()) return (usernameError.value = '请输入用户名')
  usernameError.value = ''
  return ''
}
function validatePassword() {
  if (!password.value.trim()) return (passwordError.value = '请输入密码')
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
    store.notify(error.message || '登录失败', 'error')
  }
}
</script>

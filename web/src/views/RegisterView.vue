<template>
  <section class="auth-card auth-card-simple">
    <div class="section-header">
      <h2>注册</h2>
      <p>注册后默认就是普通用户，注册成功会自动跳回登录页。</p>
    </div>
    <div class="form-grid">
      <div class="field-block">
        <input v-model="form.username" class="text-input" :class="{ 'input-invalid': errors.username }" placeholder="注册账号" @blur="validateUsername" />
        <small v-if="errors.username" class="field-error">{{ errors.username }}</small>
      </div>
      <div class="field-block">
        <input v-model="form.nickname" class="text-input" :class="{ 'input-invalid': errors.nickname }" placeholder="昵称（可选）" @blur="validateNickname" />
        <small v-if="errors.nickname" class="field-error">{{ errors.nickname }}</small>
      </div>
      <div class="field-block">
        <input v-model="form.password" class="text-input" :class="{ 'input-invalid': errors.password }" type="password" placeholder="请输入密码" @blur="validatePassword" />
        <small v-if="errors.password" class="field-error">{{ errors.password }}</small>
      </div>
      <div class="field-block">
        <input v-model="form.confirmPassword" class="text-input" :class="{ 'input-invalid': errors.confirmPassword }" type="password" placeholder="请再次输入密码" @blur="validateConfirmPassword" />
        <small v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</small>
      </div>
      <button class="primary-btn large" @click="submitRegister">注册普通用户</button>
    </div>
    <div class="auth-footnote">
      已有账号？
      <a href="javascript:void(0)" @click="$router.push('/login')">返回登录</a>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()
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
  if (!value) return (errors.username = '请输入注册账号')
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(value)) return (errors.username = '账号需为 4-20 位字母、数字或下划线')
  errors.username = ''
  return ''
}
function validateNickname() {
  const value = form.nickname.trim()
  if (value && value.length > 20) return (errors.nickname = '昵称最多 20 个字符')
  errors.nickname = ''
  return ''
}
function validatePassword() {
  const value = form.password.trim()
  if (!value) return (errors.password = '请输入密码')
  if (value.length < 6 || value.length > 32) return (errors.password = '密码长度需为 6-32 位')
  errors.password = ''
  return ''
}
function validateConfirmPassword() {
  const value = form.confirmPassword.trim()
  if (!value) return (errors.confirmPassword = '请再次输入密码')
  if (value !== form.password.trim()) return (errors.confirmPassword = '两次输入的密码不一致')
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
    store.notify('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    store.notify(error.message || '注册失败', 'error')
  }
}
</script>

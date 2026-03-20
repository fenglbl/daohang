<template>
  <section class="auth-card auth-card-simple">
    <div class="section-header">
      <h2>注册</h2>
      <p>注册后默认就是普通用户，注册成功会自动跳回登录页。</p>
    </div>
    <div class="form-grid">
      <input v-model="form.username" class="text-input" placeholder="注册账号" />
      <input v-model="form.nickname" class="text-input" placeholder="昵称（可选）" />
      <input v-model="form.password" class="text-input" type="password" placeholder="请输入密码" />
      <input v-model="form.confirmPassword" class="text-input" type="password" placeholder="请再次输入密码" />
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

async function submitRegister() {
  try {
    if (!form.username.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      alert('请填写完整注册信息')
      return
    }
    if (form.password !== form.confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }
    await store.register({ username: form.username.trim(), nickname: form.nickname.trim(), password: form.password.trim() })
    alert('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    alert(error.message || '注册失败')
  }
}
</script>

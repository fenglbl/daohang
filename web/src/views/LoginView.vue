<template>
  <section class="auth-card auth-card-simple">
    <div class="section-header">
      <h2>登录</h2>
      <p>输入账号密码即可登录，系统自动识别管理员或普通用户身份。</p>
    </div>
    <div class="form-grid">
      <input v-model="username" class="text-input" placeholder="请输入用户名" />
      <input v-model="password" class="text-input" type="password" placeholder="请输入密码" />
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

async function submitLogin() {
  try {
    if (!username.value.trim() || !password.value.trim()) {
      alert('请输入用户名和密码')
      return
    }
    const user = await store.login({ username: username.value.trim(), password: password.value.trim() })
    router.push(user.role === 'admin' ? '/admin' : '/')
  } catch (error) {
    alert(error.message || '登录失败')
  }
}
</script>

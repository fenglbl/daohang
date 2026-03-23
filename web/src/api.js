const API_BASE = 'http://127.0.0.1:3000/api'

function getLocale() {
  return localStorage.getItem('locale') || 'zh-CN'
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Accept-Language': getLocale(),
    ...(options.headers || {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json()
  if (!response.ok || data.success === false) {
    throw new Error(data.message || '请求失败')
  }
  return data
}

export const api = {
  register(payload) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
  },
  login(payload) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  },
  me() {
    return request('/auth/me')
  },
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return request('/auth/avatar', { method: 'POST', body: formData })
  },
  updateProfile(payload) {
    return request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) })
  },
  updatePassword(payload) {
    return request('/auth/password', { method: 'PUT', body: JSON.stringify(payload) })
  },
  updateSettings(payload) {
    return request('/auth/settings', { method: 'PUT', body: JSON.stringify(payload) })
  },
  logout() {
    return request('/auth/logout', { method: 'POST' })
  },
  getSearchEngines() {
    return request('/search-engines')
  },
  getAdminSearchEngines() {
    return request('/search-engines/admin')
  },
  createSearchEngine(payload) {
    return request('/search-engines', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateSearchEngine(id, payload) {
    return request(`/search-engines/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  deleteSearchEngine(id) {
    return request(`/search-engines/${id}`, { method: 'DELETE' })
  },
  getPublicGroups() {
    return request('/nav/public/groups')
  },
  getPublicLinks() {
    return request('/nav/public/links')
  },
  getGroups() {
    return request('/nav/groups')
  },
  createGroup(payload) {
    return request('/nav/groups', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateGroup(id, payload) {
    return request(`/nav/groups/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  setGroupEnabled(id, isEnabled) {
    return request(`/nav/groups/${id}/enabled`, { method: 'PUT', body: JSON.stringify({ isEnabled }) })
  },
  deleteGroup(id) {
    return request(`/nav/groups/${id}`, { method: 'DELETE' })
  },
  getLinks() {
    return request('/nav/links')
  },
  createLink(payload) {
    return request('/nav/links', { method: 'POST', body: JSON.stringify(payload) })
  },
  updateLink(id, payload) {
    return request(`/nav/links/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  setLinkEnabled(id, isEnabled) {
    return request(`/nav/links/${id}/enabled`, { method: 'PUT', body: JSON.stringify({ isEnabled }) })
  },
  deleteLink(id) {
    return request(`/nav/links/${id}`, { method: 'DELETE' })
  },
}

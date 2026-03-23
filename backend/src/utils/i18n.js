const DEFAULT_LOCALE = 'zh-CN'

const messageMap = {
  '服务正常，数据库已连接': { 'en-US': 'Service is healthy and the database is connected' },
  '服务正常，数据库暂未连接': { 'en-US': 'Service is healthy but the database is currently disconnected' },
  '接口不存在': { 'en-US': 'API endpoint not found' },
  '服务器内部错误': { 'en-US': 'Internal server error' },
  '未登录或 token 缺失': { 'en-US': 'Not logged in or token is missing' },
  '登录已失效，请重新登录': { 'en-US': 'Session is invalid. Please log in again' },
  '登录已过期，请重新登录': { 'en-US': 'Session has expired. Please log in again' },
  '仅管理员可操作': { 'en-US': 'Admin access required' },
  '只支持图片文件': { 'en-US': 'Only image files are supported' },
  '用户名和密码不能为空': { 'en-US': 'Username and password are required' },
  '用户名已存在': { 'en-US': 'Username already exists' },
  '注册成功': { 'en-US': 'Registration successful' },
  '账号不存在': { 'en-US': 'Account does not exist' },
  '账号已被禁用': { 'en-US': 'Account has been disabled' },
  '密码错误': { 'en-US': 'Incorrect password' },
  '登录成功': { 'en-US': 'Login successful' },
  '获取当前用户成功': { 'en-US': 'Fetched current user successfully' },
  '头像上传失败': { 'en-US': 'Avatar upload failed' },
  '请选择要上传的图片': { 'en-US': 'Please choose an image to upload' },
  '头像上传成功': { 'en-US': 'Avatar uploaded successfully' },
  '资料更新成功': { 'en-US': 'Profile updated successfully' },
  '邮箱已被占用': { 'en-US': 'Email is already in use' },
  '请填写完整密码信息': { 'en-US': 'Please complete all password fields' },
  '两次输入的新密码不一致': { 'en-US': 'The two new passwords do not match' },
  '新密码至少 6 位': { 'en-US': 'The new password must be at least 6 characters long' },
  '用户不存在': { 'en-US': 'User does not exist' },
  '原密码错误': { 'en-US': 'Current password is incorrect' },
  '密码修改成功，请重新登录': { 'en-US': 'Password updated successfully. Please log in again' },
  '用户设置更新成功': { 'en-US': 'User settings updated successfully' },
  '退出成功': { 'en-US': 'Logged out successfully' },
  '获取公共导航分组成功': { 'en-US': 'Fetched public navigation groups successfully' },
  '获取公共导航链接成功': { 'en-US': 'Fetched public navigation links successfully' },
  '获取导航分组成功': { 'en-US': 'Fetched navigation groups successfully' },
  '分组名称不能为空': { 'en-US': 'Group name is required' },
  '只有管理员可以创建公共导航分组': { 'en-US': 'Only admins can create public navigation groups' },
  '新增导航分组成功': { 'en-US': 'Navigation group created successfully' },
  '导航分组不存在或无权限操作': { 'en-US': 'Navigation group does not exist or you do not have permission' },
  '更新导航分组成功': { 'en-US': 'Navigation group updated successfully' },
  '启用导航分组成功': { 'en-US': 'Navigation group enabled successfully' },
  '停用导航分组成功': { 'en-US': 'Navigation group disabled successfully' },
  '删除导航分组成功': { 'en-US': 'Navigation group deleted successfully' },
  '获取导航链接成功': { 'en-US': 'Fetched navigation links successfully' },
  'groupId 和 title 不能为空': { 'en-US': 'groupId and title are required' },
  '只有管理员可以创建公共导航链接': { 'en-US': 'Only admins can create public navigation links' },
  '所属分组不存在': { 'en-US': 'The target group does not exist' },
  '导航链接的公共属性必须与分组一致': { 'en-US': 'The public flag of the navigation link must match its group' },
  '无权向该分组添加导航链接': { 'en-US': 'You do not have permission to add navigation links to this group' },
  '新增导航链接成功': { 'en-US': 'Navigation link created successfully' },
  '目标分组不存在': { 'en-US': 'Target group does not exist' },
  '无权移动到公共分组': { 'en-US': 'You do not have permission to move this item to a public group' },
  '无权移动到该私有分组': { 'en-US': 'You do not have permission to move this item to that private group' },
  '导航链接不存在或无权限操作': { 'en-US': 'Navigation link does not exist or you do not have permission' },
  '更新导航链接成功': { 'en-US': 'Navigation link updated successfully' },
  '启用导航链接成功': { 'en-US': 'Navigation link enabled successfully' },
  '停用导航链接成功': { 'en-US': 'Navigation link disabled successfully' },
  '删除导航链接成功': { 'en-US': 'Navigation link deleted successfully' },
  '获取搜索引擎配置成功': { 'en-US': 'Fetched search engine settings successfully' },
  '名称、显示名和搜索链接不能为空': { 'en-US': 'Name, label, and search URL are required' },
  '搜索链接必须包含 {q} 占位符': { 'en-US': 'Search URL must contain the {q} placeholder' },
  '新增搜索引擎成功': { 'en-US': 'Search engine created successfully' },
  '搜索引擎名称已存在': { 'en-US': 'Search engine name already exists' },
  '搜索引擎不存在': { 'en-US': 'Search engine does not exist' },
  '更新搜索引擎成功': { 'en-US': 'Search engine updated successfully' },
  '删除搜索引擎成功': { 'en-US': 'Search engine deleted successfully' },
}

function detectLocale(req) {
  const header = String(req?.headers?.['accept-language'] || '').toLowerCase()
  if (header.includes('en')) return 'en-US'
  return DEFAULT_LOCALE
}

function translate(req, message) {
  if (!message) return message
  const locale = detectLocale(req)
  if (locale === DEFAULT_LOCALE) return message
  return messageMap[message]?.[locale] || message
}

module.exports = {
  detectLocale,
  translate,
}

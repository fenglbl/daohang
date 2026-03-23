# 后端接口文档

本文档记录 `daohang` 项目当前后端 API 的主要接口、鉴权方式、核心字段与返回结构。

- 后端基地址：`http://127.0.0.1:3000`
- API 基地址：`http://127.0.0.1:3000/api`
- 返回格式：JSON
- 鉴权方式：`Authorization: Bearer <token>`
- 国际化：可通过 `Accept-Language: zh-CN` / `en-US` 控制接口 message 返回语言

---

## 统一返回结构

### 成功

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 失败

```json
{
  "success": false,
  "message": "操作失败",
  "detail": null
}
```

---

## 基础接口

### 1. 健康检查

**GET** `/health`

说明：检查服务是否正常，以及数据库是否可连通。

成功示例：

```json
{
  "success": true,
  "message": "服务正常，数据库已连接",
  "data": {
    "db": "connected"
  }
}
```

### 2. 根接口

**GET** `/api`

说明：返回服务基础信息。

---

## 认证与用户接口

### 1. 用户注册

**POST** `/api/auth/register`

请求体：

```json
{
  "username": "testuser",
  "password": "123456",
  "nickname": "测试用户"
}
```

字段说明：
- `username`：用户名，必填
- `password`：密码，必填
- `nickname`：昵称，可选

### 2. 用户登录

**POST** `/api/auth/login`

请求体：

```json
{
  "username": "testuser",
  "password": "123456"
}
```

返回数据：
- `token`：访问 token
- `refreshToken`：刷新 token
- `expireAt`：过期时间
- `user`：当前登录用户摘要

### 3. 获取当前用户

**GET** `/api/auth/me`

鉴权：需要

返回字段：
- `id`
- `username`
- `role`
- `nickname`
- `avatar_url`
- `email`
- `phone`
- `last_login_at`
- `theme_mode`
- `jump_mode`
- `search_engine`
- `show_public_nav`

### 4. 上传头像

**POST** `/api/auth/avatar`

鉴权：需要

请求方式：`multipart/form-data`

表单字段：
- `avatar`：图片文件，必填

说明：
- 仅支持图片文件
- 文件大小限制为 3MB

### 5. 更新资料

**PUT** `/api/auth/profile`

鉴权：需要

请求体：

```json
{
  "nickname": "新的昵称",
  "email": "test@example.com",
  "phone": "13800138000"
}
```

字段均为可选；未传字段保持原值。

### 6. 修改密码

**PUT** `/api/auth/password`

鉴权：需要

请求体：

```json
{
  "oldPassword": "123456",
  "newPassword": "654321",
  "confirmPassword": "654321"
}
```

说明：
- `newPassword` 与 `confirmPassword` 必须一致
- 修改密码成功后，会使当前用户的所有登录会话失效

### 7. 更新用户设置

**PUT** `/api/auth/settings`

鉴权：需要

请求体：

```json
{
  "themeMode": "dark",
  "jumpMode": "online",
  "searchEngine": "bing",
  "showPublicNav": 1
}
```

字段说明：
- `themeMode`：`dark | light | system`
- `jumpMode`：`local | online`
- `searchEngine`：搜索引擎名称
- `showPublicNav`：是否显示公共导航，`0 | 1`

### 8. 退出登录

**POST** `/api/auth/logout`

鉴权：需要

说明：使当前登录会话失效。

---

## 导航接口

> 当前规则：
> - 公共导航由管理员维护
> - 私有导航由普通用户维护
> - 公共导航优先支持“启用 / 停用”
> - 私有导航不再提供启用 / 停用操作

### 一、公共导航读取

### 1. 获取公共分组

**GET** `/api/nav/public/groups`

说明：
- 只返回未删除且 `is_enabled = 1` 的公共分组

返回字段：
- `id`
- `user_id`
- `is_public`
- `name`
- `description`
- `sort_order`
- `is_default`
- `is_enabled`
- `created_at`
- `updated_at`

### 2. 获取公共链接

**GET** `/api/nav/public/links`

说明：
- 只返回未删除、已启用，且所属分组也已启用的公共链接

返回字段：
- `id`
- `user_id`
- `group_id`
- `is_public`
- `title`
- `description`
- `url_local`
- `url_online`
- `icon_url`
- `open_mode`
- `sort_order`
- `is_enabled`
- `created_at`
- `updated_at`

### 二、分组管理

### 3. 获取导航分组

**GET** `/api/nav/groups`

鉴权：需要

说明：
- 管理员可看到公共分组（含停用）+ 自己可见范围
- 普通用户可看到：
  - 所有自己的私有分组
  - 已启用的公共分组

### 4. 创建导航分组

**POST** `/api/nav/groups`

鉴权：需要

请求体：

```json
{
  "name": "开发工具",
  "description": "常用开发网址",
  "sortOrder": 0,
  "isDefault": 0,
  "isPublic": 0,
  "isEnabled": 1
}
```

字段说明：
- `name`：分组名称，必填
- `description`：简介，可选
- `sortOrder`：排序值，可选
- `isDefault`：是否默认分组，`0 | 1`
- `isPublic`：是否公共分组，`0 | 1`
- `isEnabled`：是否启用，`0 | 1`

说明：
- 仅管理员可创建公共分组
- 私有分组当前前端默认按启用写入

### 5. 更新导航分组

**PUT** `/api/nav/groups/:id`

鉴权：需要

请求体支持字段：

```json
{
  "name": "新的分组名",
  "description": "新的说明",
  "sortOrder": 10,
  "isDefault": 0
}
```

### 6. 启用 / 停用公共分组

**PUT** `/api/nav/groups/:id/enabled`

鉴权：需要管理员

请求体：

```json
{
  "isEnabled": 0
}
```

说明：
- 仅对公共分组生效
- 私有分组不再支持该能力

### 7. 删除导航分组

**DELETE** `/api/nav/groups/:id`

鉴权：需要

说明：
- 逻辑删除分组
- 会同步逻辑删除该分组下的导航链接

### 三、链接管理

### 8. 获取导航链接

**GET** `/api/nav/links`

鉴权：需要

说明：
- 管理员可看到公共链接（含停用）
- 普通用户可看到：
  - 自己的私有链接
  - 已启用且所属分组启用的公共链接

### 9. 创建导航链接

**POST** `/api/nav/links`

鉴权：需要

请求体：

```json
{
  "groupId": 1,
  "title": "GitHub",
  "description": "代码托管平台",
  "urlLocal": "http://github.com",
  "urlOnline": "https://github.com",
  "iconUrl": "",
  "openMode": "_blank",
  "sortOrder": 0,
  "isPublic": 0,
  "isEnabled": 1
}
```

字段说明：
- `groupId`：所属分组 id，必填
- `title`：标题，必填
- `description`：简介，可选
- `urlLocal`：本地模式链接，可选
- `urlOnline`：外网模式链接，可选
- `iconUrl`：图标地址，可选
- `openMode`：打开方式，默认 `_blank`
- `sortOrder`：排序值，可选
- `isPublic`：是否公共链接，`0 | 1`
- `isEnabled`：是否启用，`0 | 1`

说明：
- 仅管理员可创建公共链接
- 链接的 `isPublic` 必须与所属分组一致

### 10. 更新导航链接

**PUT** `/api/nav/links/:id`

鉴权：需要

请求体支持字段：

```json
{
  "groupId": 1,
  "title": "GitHub CN",
  "description": "新的说明",
  "urlLocal": "http://github.com",
  "urlOnline": "https://github.com",
  "iconUrl": "",
  "openMode": "_blank",
  "sortOrder": 10
}
```

### 11. 启用 / 停用公共链接

**PUT** `/api/nav/links/:id/enabled`

鉴权：需要管理员

请求体：

```json
{
  "isEnabled": 1
}
```

说明：
- 仅对公共链接生效
- 私有链接不再支持该能力

### 12. 删除导航链接

**DELETE** `/api/nav/links/:id`

鉴权：需要

说明：逻辑删除链接。

---

## 搜索引擎接口

> 搜索引擎由管理员管理，前台仅返回已启用列表。

### 1. 获取前台搜索引擎列表

**GET** `/api/search-engines`

说明：仅返回 `is_enabled = 1` 的搜索引擎。

返回字段：
- `id`
- `name`
- `label`
- `search_url`
- `sort_order`
- `is_enabled`

### 2. 获取后台搜索引擎列表

**GET** `/api/search-engines/admin`

鉴权：需要管理员

说明：返回所有搜索引擎，包含停用项。

### 3. 创建搜索引擎

**POST** `/api/search-engines`

鉴权：需要管理员

请求体：

```json
{
  "name": "bing",
  "label": "必应",
  "searchUrl": "https://www.bing.com/search?q={q}",
  "sortOrder": 0,
  "isEnabled": 1
}
```

说明：
- `name`、`label`、`searchUrl` 必填
- `searchUrl` 必须包含 `{q}` 占位符

### 4. 更新搜索引擎

**PUT** `/api/search-engines/:id`

鉴权：需要管理员

请求体支持字段：

```json
{
  "label": "Bing",
  "searchUrl": "https://www.bing.com/search?q={q}",
  "sortOrder": 10,
  "isEnabled": 0
}
```

### 5. 删除搜索引擎

**DELETE** `/api/search-engines/:id`

鉴权：需要管理员

说明：当前为物理删除。

---

## 当前核心数据字段约定

### users
- `id`
- `username`
- `password_hash`
- `role`
- `nickname`
- `avatar_url`
- `email`
- `phone`
- `status`
- `last_login_at`

### user_settings
- `user_id`
- `theme_mode`
- `jump_mode`
- `search_engine`
- `show_public_nav`

### nav_groups
- `id`
- `user_id`
- `is_public`
- `name`
- `description`
- `sort_order`
- `is_default`
- `is_enabled`
- `is_deleted`
- `created_at`
- `updated_at`

### nav_links
- `id`
- `user_id`
- `group_id`
- `is_public`
- `title`
- `description`
- `url_local`
- `url_online`
- `icon_url`
- `open_mode`
- `sort_order`
- `is_enabled`
- `is_deleted`
- `created_at`
- `updated_at`

### search_engines
- `id`
- `name`
- `label`
- `search_url`
- `sort_order`
- `is_enabled`
- `created_at`
- `updated_at`

---

## 文档维护约定

从现在开始，后端开发遵循下面这条约定：

1. **新增接口时，必须同步更新接口文档**
2. **新增字段时，必须同步补充字段说明**
3. **修改接口行为时，必须同步更新请求示例 / 返回说明 / 权限说明**

建议默认同步更新这些位置：
- `backend/docs/api.md`
- `README.md` 中的接口概览（如有新增入口）
- 涉及数据库结构变更时同步更新 `backend/docs/database-design.md`

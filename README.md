# 导航站项目

一个支持 **公共导航** 与 **私有导航** 的导航站项目。

目前项目采用前后端分离结构：
- 前端：`Vue 3 + Vite + Pinia + Vue Router`
- 后端：`Node.js + Express + MySQL`

适合做个人导航站、带账号体系的收藏入口页，或者继续扩展成可配置的导航管理系统。

---

## 功能概览

当前已经完成的能力包括：

### 用户与账号
- 用户注册
- 用户登录
- 获取当前登录用户信息
- 退出登录
- 用户资料修改
- 用户密码修改
- 用户头像上传
- 用户个人设置保存

### 导航能力
- 导航分组 CRUD
- 导航链接 CRUD
- 区分公共导航与私有导航
- 首页支持展示公共导航 / 私有导航

### 权限与后台
- 管理员账号初始化
- 管理员登录后跳转管理页
- 普通用户登录后跳转首页

### 搜索引擎设置
- 搜索引擎配置管理
- 支持启用 / 停用
- 支持前台可用列表与后台全量管理列表分离

---

## 项目结构

```text
E:\daohang
├─ web/                    # 前端项目（Vue 3）
├─ backend/                # 后端项目（Express + MySQL）
├─ README.md               # 根目录项目说明
├─ .gitignore
└─ .gitattributes
```

### 前端目录
- `web/src/views/`：页面视图
- `web/src/stores/`：Pinia 状态管理
- `web/src/router.js`：前端路由
- `web/src/api.js`：接口请求封装

### 后端目录
- `backend/src/routes/`：接口路由
- `backend/src/services/`：业务服务
- `backend/src/config/`：数据库配置
- `backend/sql/`：数据库初始化 SQL
- `backend/docs/`：数据库设计说明

---

## 技术栈

### 前端
- Vue 3
- Vite
- Pinia
- Vue Router

### 后端
- Node.js
- Express
- MySQL 8+
- mysql2
- bcryptjs
- dotenv
- multer

---

## 运行环境

建议环境：
- Node.js 18+（更高版本也可）
- MySQL 8+

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/fenglbl/daohang.git
cd daohang
```

### 2. 安装依赖

分别安装前后端依赖：

```bash
cd web
npm install

cd ../backend
npm install
```

---

## 后端配置

后端使用环境变量连接 MySQL。

### 1. 复制环境变量模板

在 `backend/` 目录下，将 `.env.example` 复制为 `.env`：

```bash
cp .env.example .env
```

Windows 也可以手动复制。

### 2. 配置示例

`backend/.env.example` 内容如下：

```env
PORT=3000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=daohang
```

你需要根据本机 MySQL 实际情况修改：
- `MYSQL_HOST`：数据库地址
- `MYSQL_PORT`：数据库端口
- `MYSQL_USER`：数据库用户名
- `MYSQL_PASSWORD`：数据库密码
- `MYSQL_DATABASE`：数据库名

---

## 数据库初始化

项目中已经提供 SQL 文件：

- `backend/sql/init.sql`
- `backend/sql/init.navigation.sql`

数据库设计说明：

- `backend/docs/database-design.md`

### 建议初始化方式

1. 先在 MySQL 中创建数据库
2. 执行初始化 SQL
3. 再启动后端服务

例如：

```sql
CREATE DATABASE daohang DEFAULT CHARACTER SET utf8mb4;
```

然后导入 SQL 文件。

> 注意：后端启动时还会执行一部分自动补充逻辑，例如补充字段、创建搜索引擎配置表、初始化管理员账号等。

---

## 启动项目

### 启动后端

进入 `backend/`：

```bash
npm run dev
```

后端默认运行在：

```text
http://127.0.0.1:3000
```

健康检查接口：

```text
GET /health
```

---

### 启动前端

进入 `web/`：

```bash
npm run dev
```

Vite 会输出本地访问地址，通常类似：

```text
http://127.0.0.1:5173
```

前端当前接口基地址写在：

- `web/src/api.js`

默认配置为：

```js
const API_BASE = 'http://127.0.0.1:3000/api'
```

如果你后端端口改了，需要同步调整这里。

---

## 默认管理员账号

后端启动时会自动尝试初始化管理员账号：

- 用户名：`fenglbl`
- 密码：`6539593123`

> 这是当前开发阶段的默认初始化账号，部署到正式环境前请务必修改。

---

## 当前接口概览

### 基础接口
- `GET /health`
- `GET /api`

### 认证相关
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `PUT /api/auth/settings`
- `POST /api/auth/avatar`

### 导航相关
- `GET /api/nav/public/groups`
- `GET /api/nav/public/links`
- `GET /api/nav/groups`
- `POST /api/nav/groups`
- `PUT /api/nav/groups/:id`
- `DELETE /api/nav/groups/:id`
- `GET /api/nav/links`
- `POST /api/nav/links`
- `PUT /api/nav/links/:id`
- `DELETE /api/nav/links/:id`

### 搜索引擎相关
- `GET /api/search-engines`
- `GET /api/search-engines/admin`
- `POST /api/search-engines`
- `PUT /api/search-engines/:id`
- `DELETE /api/search-engines/:id`

---

## 页面路由

当前前端页面包括：

- `/`：首页
- `/login`：登录页
- `/register`：注册页
- `/admin`：管理页
- `/settings`：设置页

---

## 当前实现约定

### 1. 公共导航 / 私有导航并存
项目同时支持：
- 公共导航
- 用户私有导航

### 2. 配置项优先“停用”，而不是直接删除
当前项目正在逐步把配置管理统一到这种思路：
- 先支持启用 / 停用
- 尽量保留配置
- 删除操作尽量降级为二级操作

目前搜索引擎管理已经按这个方向落地。

---

## 开发建议

如果你准备继续迭代这个项目，建议下一步优先做：

1. 导航分组支持启用 / 停用
2. 导航链接支持启用 / 停用
3. 管理页增加更完整的状态筛选
4. README 增加截图与部署说明
5. 清理仓库中的本地开发产物（如 node_modules、dist、.env、上传文件等）

---

## Git 分支

当前默认分支：

- `main`

---

## 注意事项

当前仓库仍处于持续迭代阶段，后续可能继续调整：
- 数据表结构
- 管理页交互
- 配置项的停用机制
- 前后端接口细节

如果用于正式部署，建议先补充：
- 更严格的权限控制
- 生产环境配置
- 日志与异常监控
- 数据备份策略
- 默认管理员账号修改机制

---

## License

当前仓库未单独声明 License。
如需开源发布，建议补充 LICENSE 文件。

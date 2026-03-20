# 导航站后端

当前技术栈：
- Node.js
- Express
- MySQL（mysql2）

## 启动

```bash
cd backend
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env` 后按需修改：

```bash
PORT=3000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=daohang
```

## 初始化数据库

已提供初始化 SQL：

- `sql/init.sql`

数据库设计说明：

- `docs/database-design.md`

## 当前接口

- `GET /health`
- `GET /api`
- `POST /api/auth/login`
- `GET /api/nav/groups`
- `POST /api/nav/groups`
- `GET /api/nav/links`
- `POST /api/nav/links`

说明：当前已搭好后端骨架和数据库结构设计，下一步可以开始接真正的 MySQL CRUD。

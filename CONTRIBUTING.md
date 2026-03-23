# Contributing

欢迎继续完善这个项目。

当前仓库仍处于持续迭代阶段，贡献时建议先保证：
- 改动目标明确
- 不提交本地环境文件
- 提交信息尽量清晰
- 先保证前后端基本可运行

## 基本开发流程

### 1. 拉取代码

```bash
git clone https://github.com/fenglbl/daohang.git
cd daohang
```

### 2. 安装依赖

```bash
cd web
npm install

cd ../backend
npm install
```

### 3. 配置后端环境变量

将：

- `backend/.env.example`

复制为：

- `backend/.env`

并根据本地 MySQL 环境修改配置。

### 4. 启动前后端

后端：

```bash
cd backend
npm run dev
```

前端：

```bash
cd web
npm run dev
```

---

## 提交约定

当前建议尽量使用清晰的提交前缀，例如：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档更新
- `refactor:` 重构
- `style:` 不影响逻辑的样式/格式调整
- `chore:` 杂项维护

示例：

```bash
feat: support toggling search engines
docs: expand project README
fix: correct login redirect logic
```

---

## 提交前请检查

### 不要提交这些内容
- `node_modules/`
- `dist/`
- `.env`
- 日志文件
- 本地上传文件
- 其他临时文件

### 尽量确认这些内容
- 前端能启动
- 后端能启动
- 数据库连接配置正确
- 相关页面或接口未被改坏

---

## 当前开发建议

如果准备继续推进功能，建议优先顺序：

1. 导航分组支持启用 / 停用
2. 导航链接支持启用 / 停用
3. 管理页补充状态筛选与更细的操作入口
4. 优化默认管理员初始化逻辑
5. 补充部署说明与截图

---

## Pull Request 建议

如果后续采用 PR 流程，建议描述至少包含：
- 改了什么
- 为什么改
- 影响哪些页面 / 接口 / 表结构
- 是否需要同步数据库
- 是否需要补充 README / CHANGELOG

---

## License

当前仓库暂未明确开源许可证。

在补充 `LICENSE` 文件之前，默认建议不要把它当作一个许可证已经明确的开源仓库来分发或二次使用。

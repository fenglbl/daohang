const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const rootRouter = require('./routes')
const authRouter = require('./routes/auth')
const navRouter = require('./routes/nav')
const searchEngineRouter = require('./routes/searchEngine')
const { ok, fail } = require('./utils/response')
const { checkDbConnection } = require('./config/db')
const { ensureSchema, ensureAdminAccount } = require('./services/initService')

const app = express()
const PORT = Number(process.env.PORT || 3000)
const avatarDir = path.resolve(__dirname, '../avatars')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/avatars', express.static(avatarDir))

app.get('/health', async (req, res) => {
  try {
    await checkDbConnection()
    ok(res, { db: 'connected' }, '服务正常，数据库已连接', req)
  } catch (error) {
    ok(res, { db: 'disconnected', error: error.message }, '服务正常，数据库暂未连接', req)
  }
})

app.use('/api', rootRouter)
app.use('/api/auth', authRouter)
app.use('/api/nav', navRouter)
app.use('/api/search-engines', searchEngineRouter)

app.use((req, res) => {
  fail(res, '接口不存在', 404, null, req)
})

app.use((error, req, res, next) => {
  console.error('[server error]', error)
  fail(res, '服务器内部错误', 500, error.message, req)
})

async function bootstrap() {
  try {
    await ensureSchema()
    await ensureAdminAccount()
    app.listen(PORT, () => {
      console.log(`daohang backend running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('[bootstrap error]', error)
    process.exit(1)
  }
}

bootstrap()

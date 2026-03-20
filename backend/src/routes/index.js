const express = require('express')
const { ok } = require('../utils/response')
const router = express.Router()

router.get('/', (req, res) => {
  ok(res, {
    service: 'daohang-backend',
    version: 'v1',
    time: new Date().toISOString(),
  })
})

module.exports = router

const { translate } = require('./i18n')

function ok(res, data = null, message = 'ok', req = null) {
  return res.json({ success: true, message: translate(req || res.req, message), data })
}

function fail(res, message = 'error', code = 400, detail = null, req = null) {
  return res.status(code).json({
    success: false,
    message: translate(req || res.req, message),
    detail,
  })
}

module.exports = {
  ok,
  fail,
}

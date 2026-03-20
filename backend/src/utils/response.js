function ok(res, data = null, message = 'ok') {
  return res.json({ success: true, message, data })
}

function fail(res, message = 'error', code = 400, detail = null) {
  return res.status(code).json({
    success: false,
    message,
    detail,
  })
}

module.exports = {
  ok,
  fail,
}

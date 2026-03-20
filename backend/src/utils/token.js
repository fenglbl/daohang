const crypto = require('crypto')

function generateToken(prefix = 'tk') {
  return `${prefix}_${crypto.randomBytes(24).toString('hex')}`
}

module.exports = {
  generateToken,
}

const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')

const createToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  })

module.exports = { createToken }

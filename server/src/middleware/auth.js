const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' })
  }
  const [, token] = authHeader.split(' ')
  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  return next()
}

module.exports = { authenticate, requireAdmin }

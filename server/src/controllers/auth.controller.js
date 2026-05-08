const bcrypt = require('bcryptjs')
const prisma = require('../prisma/client')
const { ADMIN_INVITE_CODE } = require('../config/env')
const { createToken } = require('../utils/tokens')
const { sanitizeUser } = require('../utils/sanitizeUser')

const signup = async (req, res) => {
  const { name, email, password, role, adminCode } = req.body
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' })
  }

  const requestedRole = role || 'MEMBER'
  if (requestedRole === 'ADMIN' && ADMIN_INVITE_CODE) {
    if (adminCode !== ADMIN_INVITE_CODE) {
      return res.status(403).json({ message: 'Invalid admin invite code' })
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: requestedRole,
    },
  })

  return res.status(201).json({
    token: createToken(user),
    user: sanitizeUser(user),
  })
}

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  return res.json({
    token: createToken(user),
    user: sanitizeUser(user),
  })
}

const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  return res.json({ user: sanitizeUser(user) })
}

module.exports = { signup, login, getMe }

const prisma = require('../prisma/client')
const { sanitizeUser } = require('../utils/sanitizeUser')

const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ users: users.map(sanitizeUser) })
}

module.exports = { listUsers }

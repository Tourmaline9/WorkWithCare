const dotenv = require('dotenv')

dotenv.config()

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const CLIENT_ORIGINS = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',')
  : ['http://localhost:5173']

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || null

module.exports = {
  PORT,
  JWT_SECRET,
  CLIENT_ORIGINS,
  ADMIN_INVITE_CODE,
}

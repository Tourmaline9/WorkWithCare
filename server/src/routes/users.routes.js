const express = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth')
const { asyncHandler } = require('../utils/asyncHandler')
const { listUsers } = require('../controllers/users.controller')

const router = express.Router()

router.get('/', authenticate, requireAdmin, asyncHandler(listUsers))

module.exports = router

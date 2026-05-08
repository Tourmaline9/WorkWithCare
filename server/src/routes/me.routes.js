const express = require('express')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../utils/asyncHandler')
const { getMe } = require('../controllers/auth.controller')

const router = express.Router()

router.get('/me', authenticate, asyncHandler(getMe))

module.exports = router

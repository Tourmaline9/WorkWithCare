const express = require('express')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../utils/asyncHandler')
const { getDashboard } = require('../controllers/dashboard.controller')

const router = express.Router()

router.get('/', authenticate, asyncHandler(getDashboard))

module.exports = router

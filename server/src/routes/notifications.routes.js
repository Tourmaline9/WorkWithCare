const express = require('express')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../utils/asyncHandler')
const {
  listNotifications,
  markNotificationRead,
} = require('../controllers/notifications.controller')

const router = express.Router()

router.get('/', authenticate, asyncHandler(listNotifications))
router.patch('/:notificationId', authenticate, asyncHandler(markNotificationRead))

module.exports = router

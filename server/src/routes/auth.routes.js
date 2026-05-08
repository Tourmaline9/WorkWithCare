const express = require('express')
const { authLimiter } = require('../middleware/rateLimit')
const { validateBody } = require('../middleware/validate')
const { asyncHandler } = require('../utils/asyncHandler')
const { signupSchema, loginSchema } = require('../schemas/auth.schema')
const { signup, login } = require('../controllers/auth.controller')

const router = express.Router()

router.post('/signup', authLimiter, validateBody(signupSchema), asyncHandler(signup))
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(login))

module.exports = router

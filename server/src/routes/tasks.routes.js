const express = require('express')
const { authenticate } = require('../middleware/auth')
const { validateBody } = require('../middleware/validate')
const { asyncHandler } = require('../utils/asyncHandler')
const { taskUpdateSchema } = require('../schemas/task.schema')
const { listTasks, updateTask } = require('../controllers/tasks.controller')

const router = express.Router()

router.get('/', authenticate, asyncHandler(listTasks))
router.patch('/:taskId', authenticate, validateBody(taskUpdateSchema), asyncHandler(updateTask))

module.exports = router

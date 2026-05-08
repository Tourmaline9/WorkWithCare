const express = require('express')
const { authenticate } = require('../middleware/auth')
const { validateBody } = require('../middleware/validate')
const { asyncHandler } = require('../utils/asyncHandler')
const { taskUpdateSchema } = require('../schemas/task.schema')
const { commentSchema } = require('../schemas/comment.schema')
const { listTasks, updateTask } = require('../controllers/tasks.controller')
const {
  listTaskComments,
  createTaskComment,
} = require('../controllers/comments.controller')

const router = express.Router()

router.get('/', authenticate, asyncHandler(listTasks))
router.patch('/:taskId', authenticate, validateBody(taskUpdateSchema), asyncHandler(updateTask))
router.get('/:taskId/comments', authenticate, asyncHandler(listTaskComments))
router.post(
  '/:taskId/comments',
  authenticate,
  validateBody(commentSchema),
  asyncHandler(createTaskComment)
)

module.exports = router

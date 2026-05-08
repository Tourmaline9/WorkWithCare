const express = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth')
const { validateBody } = require('../middleware/validate')
const { asyncHandler } = require('../utils/asyncHandler')
const { projectSchema, projectUpdateSchema } = require('../schemas/project.schema')
const { taskSchema } = require('../schemas/task.schema')
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  addProjectMember,
  removeProjectMember,
  deleteProject,
  createProjectTask,
} = require('../controllers/projects.controller')

const router = express.Router()

router.get('/', authenticate, asyncHandler(listProjects))
router.post('/', authenticate, requireAdmin, validateBody(projectSchema), asyncHandler(createProject))
router.get('/:projectId', authenticate, asyncHandler(getProject))
router.patch(
  '/:projectId',
  authenticate,
  requireAdmin,
  validateBody(projectUpdateSchema),
  asyncHandler(updateProject)
)
router.delete('/:projectId', authenticate, requireAdmin, asyncHandler(deleteProject))
router.post('/:projectId/members', authenticate, requireAdmin, asyncHandler(addProjectMember))
router.delete(
  '/:projectId/members/:memberId',
  authenticate,
  requireAdmin,
  asyncHandler(removeProjectMember)
)
router.post(
  '/:projectId/tasks',
  authenticate,
  requireAdmin,
  validateBody(taskSchema),
  asyncHandler(createProjectTask)
)

module.exports = router

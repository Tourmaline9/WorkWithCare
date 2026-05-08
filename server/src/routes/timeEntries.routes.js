const express = require('express')
const { authenticate } = require('../middleware/auth')
const { validateBody } = require('../middleware/validate')
const { asyncHandler } = require('../utils/asyncHandler')
const { timeEntryStartSchema } = require('../schemas/timeEntry.schema')
const {
  listTimeEntries,
  startTimeEntry,
  stopTimeEntry,
} = require('../controllers/timeEntries.controller')

const router = express.Router()

router.get('/', authenticate, asyncHandler(listTimeEntries))
router.post('/start', authenticate, validateBody(timeEntryStartSchema), asyncHandler(startTimeEntry))
router.patch('/:entryId/stop', authenticate, asyncHandler(stopTimeEntry))

module.exports = router

const { z } = require('zod')

const timeEntryStartSchema = z.object({
  taskId: z.string().min(1),
})

module.exports = { timeEntryStartSchema }

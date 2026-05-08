const { z } = require('zod')

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  deadline: z.string().optional(),
  memberIds: z.array(z.string().min(1)).optional(),
})

const projectUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  deadline: z.string().nullable().optional(),
})

module.exports = { projectSchema, projectUpdateSchema }

const { z } = require('zod')

const commentSchema = z.object({
  body: z.string().min(1),
})

module.exports = { commentSchema }

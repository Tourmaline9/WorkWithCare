const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { z } = require('zod')
const { PrismaClient } = require('@prisma/client')

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',')
  : ['http://localhost:5173']

app.use(
  cors({
    origin: allowedOrigins,
  })
)
app.use(express.json())
app.use(morgan('dev'))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

app.use('/api', apiLimiter)

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors: result.error.flatten().fieldErrors,
    })
  }
  req.body = result.data
  return next()
}

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const createToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  })

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' })
  }
  const [, token] = authHeader.split(' ')
  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  return next()
}

const parseDueDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid due date')
  }
  return date
}

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  adminCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  memberIds: z.array(z.string().min(1)).optional(),
})

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

const taskUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
})

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  },
  tasks: {
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
}

const getProjectForUser = async (projectId, user) => {
  const baseWhere = { id: projectId }
  if (user.role === 'ADMIN') {
    return prisma.project.findFirst({
      where: { ...baseWhere, ownerId: user.userId },
      include: projectInclude,
    })
  }
  return prisma.project.findFirst({
    where: { ...baseWhere, members: { some: { userId: user.userId } } },
    include: projectInclude,
  })
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post(
  '/api/auth/signup',
  authLimiter,
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role, adminCode } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const requestedRole = role || 'MEMBER'
    if (requestedRole === 'ADMIN' && process.env.ADMIN_INVITE_CODE) {
      if (adminCode !== process.env.ADMIN_INVITE_CODE) {
        return res.status(403).json({ message: 'Invalid admin invite code' })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: requestedRole,
      },
    })

    return res.status(201).json({
      token: createToken(user),
      user: sanitizeUser(user),
    })
  })
)

app.post(
  '/api/auth/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    return res.json({
      token: createToken(user),
      user: sanitizeUser(user),
    })
  })
)

app.get(
  '/api/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.json({ user: sanitizeUser(user) })
  })
)

app.get(
  '/api/users',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ users: users.map(sanitizeUser) })
  })
)

app.get(
  '/api/projects',
  authenticate,
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === 'ADMIN'
        ? {
            OR: [
              { ownerId: req.user.userId },
              { members: { some: { userId: req.user.userId } } },
            ],
          }
        : { members: { some: { userId: req.user.userId } } }

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ projects })
  })
)

app.post(
  '/api/projects',
  authenticate,
  requireAdmin,
  validateBody(projectSchema),
  asyncHandler(async (req, res) => {
    const { name, description, memberIds = [] } = req.body

    const uniqueMemberIds = Array.from(
      new Set([...memberIds, req.user.userId])
    )

    const users = await prisma.user.findMany({
      where: { id: { in: uniqueMemberIds } },
    })

    if (users.length !== uniqueMemberIds.length) {
      return res.status(400).json({ message: 'One or more members do not exist' })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.userId,
        members: {
          create: uniqueMemberIds.map((userId) => ({ userId })),
        },
      },
      include: projectInclude,
    })

    return res.status(201).json({ project })
  })
)

app.get(
  '/api/projects/:projectId',
  authenticate,
  asyncHandler(async (req, res) => {
    const project = await getProjectForUser(req.params.projectId, req.user)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.json({ project })
  })
)

app.post(
  '/api/projects/:projectId/members',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { memberId } = req.body
    if (!memberId) {
      return res.status(400).json({ message: 'memberId is required' })
    }

    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, ownerId: req.user.userId },
    })
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const user = await prisma.user.findUnique({ where: { id: memberId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: memberId } },
      update: {},
      create: { projectId: project.id, userId: memberId },
    })

    const updatedProject = await prisma.project.findFirst({
      where: { id: project.id },
      include: projectInclude,
    })

    return res.json({ project: updatedProject })
  })
)

app.post(
  '/api/projects/:projectId/tasks',
  authenticate,
  requireAdmin,
  validateBody(taskSchema),
  asyncHandler(async (req, res) => {
    const { title, description, status, dueDate, assigneeId } = req.body
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, ownerId: req.user.userId },
      include: { members: true },
    })
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (assigneeId) {
      const isMember = project.members.some((member) => member.userId === assigneeId)
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a project member' })
      }
    }

    let parsedDueDate = null
    try {
      parsedDueDate = parseDueDate(dueDate)
    } catch (error) {
      return res.status(400).json({ message: error.message })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        dueDate: parsedDueDate,
        projectId: project.id,
        assigneeId: assigneeId || null,
        creatorId: req.user.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    })

    return res.status(201).json({ task })
  })
)

app.get(
  '/api/tasks',
  authenticate,
  asyncHandler(async (req, res) => {
    const { projectId, assigned } = req.query
    const where = {}

    if (projectId) {
      if (req.user.role === 'ADMIN') {
        const project = await prisma.project.findFirst({
          where: { id: projectId, ownerId: req.user.userId },
        })
        if (!project) {
          return res.status(404).json({ message: 'Project not found' })
        }
      }
      where.projectId = projectId
    }

    if (assigned === 'me') {
      where.assigneeId = req.user.userId
    }

    if (req.user.role === 'ADMIN') {
      if (!projectId) {
        where.project = { ownerId: req.user.userId }
      }
    } else {
      where.assigneeId = req.user.userId
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ tasks })
  })
)

app.patch(
  '/api/tasks/:taskId',
  authenticate,
  validateBody(taskUpdateSchema),
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { project: true },
    })

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const isAdminOwner =
      req.user.role === 'ADMIN' && task.project.ownerId === req.user.userId
    const isAssignee = task.assigneeId === req.user.userId

    if (!isAdminOwner && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to update task' })
    }

    if (!isAdminOwner) {
      if (!req.body.status) {
        return res.status(400).json({ message: 'Status update required' })
      }
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { status: req.body.status },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      })

      return res.json({ task: updatedTask })
    }

    const updates = { ...req.body }

    if (updates.dueDate !== undefined) {
      try {
        updates.dueDate = parseDueDate(updates.dueDate)
      } catch (error) {
        return res.status(400).json({ message: error.message })
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: updates,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    })

    return res.json({ task: updatedTask })
  })
)

app.get(
  '/api/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    const now = new Date()
    const assignedTasks = await prisma.task.findMany({
      where: { assigneeId: req.user.userId },
    })

    const mySummary = assignedTasks.reduce(
      (acc, task) => {
        acc.total += 1
        acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1
        if (task.dueDate && task.dueDate < now && task.status !== 'DONE') {
          acc.overdue += 1
        }
        return acc
      },
      { total: 0, overdue: 0, byStatus: {} }
    )

    let adminSummary = null
    if (req.user.role === 'ADMIN') {
      const adminTasks = await prisma.task.findMany({
        where: { project: { ownerId: req.user.userId } },
      })
      const projectCount = await prisma.project.count({
        where: { ownerId: req.user.userId },
      })

      adminSummary = adminTasks.reduce(
        (acc, task) => {
          acc.total += 1
          acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1
          if (task.dueDate && task.dueDate < now && task.status !== 'DONE') {
            acc.overdue += 1
          }
          return acc
        },
        { total: 0, overdue: 0, byStatus: {}, projectCount }
      )
    }

    return res.json({ mySummary, adminSummary })
  })
)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Duplicate record' })
  }
  console.error(err)
  return res.status(500).json({ message: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

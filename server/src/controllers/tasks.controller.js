const prisma = require('../prisma/client')
const { parseDueDate } = require('../utils/date')

const listTasks = async (req, res) => {
  const {
    projectId,
    assigned,
    status,
    priority,
    assigneeId,
    dueBefore,
    dueAfter,
    search,
  } = req.query
  const where = {}
  const statusValue = status ? status.toUpperCase() : null
  const priorityValue = priority ? priority.toUpperCase() : null

  if (statusValue && !['TODO', 'IN_PROGRESS', 'DONE'].includes(statusValue)) {
    return res.status(400).json({ message: 'Invalid status filter' })
  }

  if (
    priorityValue &&
    !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priorityValue)
  ) {
    return res.status(400).json({ message: 'Invalid priority filter' })
  }

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
  } else if (assigneeId) {
    if (req.user.role !== 'ADMIN' && assigneeId !== req.user.userId) {
      return res.status(403).json({ message: 'Cannot query other users' })
    }
    where.assigneeId = assigneeId
  }

  if (statusValue) {
    where.status = statusValue
  }

  if (priorityValue) {
    where.priority = priorityValue
  }

  if (dueBefore || dueAfter) {
    where.dueDate = {}
  }

  if (dueBefore) {
    try {
      where.dueDate.lte = parseDueDate(dueBefore)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid dueBefore filter' })
    }
  }

  if (dueAfter) {
    try {
      where.dueDate.gte = parseDueDate(dueAfter)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid dueAfter filter' })
    }
  }

  if (search && search.trim()) {
    const term = search.trim()
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]
  }

  if (req.user.role === 'ADMIN') {
    if (!projectId) {
      where.project = { ownerId: req.user.userId }
    }
  } else if (!where.assigneeId) {
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
}

const updateTask = async (req, res) => {
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
}

module.exports = { listTasks, updateTask }

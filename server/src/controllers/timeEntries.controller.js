const prisma = require('../prisma/client')
const { getTaskWithProject, canAccessTask } = require('../utils/taskAccess')

const listTimeEntries = async (req, res) => {
  const { taskId } = req.query
  const where = { userId: req.user.userId }

  if (taskId) {
    const task = await getTaskWithProject(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }
    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view entries' })
    }
    where.taskId = taskId
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
    },
    orderBy: { startedAt: 'desc' },
    take: 20,
  })

  const activeEntry = entries.find((entry) => !entry.endedAt) || null

  return res.json({ entries, activeEntry })
}

const startTimeEntry = async (req, res) => {
  const { taskId } = req.body
  const task = await getTaskWithProject(taskId)
  if (!task) {
    return res.status(404).json({ message: 'Task not found' })
  }
  if (!canAccessTask(task, req.user)) {
    return res.status(403).json({ message: 'Not authorized to track task' })
  }

  const existingActive = await prisma.timeEntry.findFirst({
    where: { userId: req.user.userId, endedAt: null },
  })

  if (existingActive) {
    return res.status(409).json({ message: 'You already have an active timer' })
  }

  const entry = await prisma.timeEntry.create({
    data: {
      taskId: task.id,
      userId: req.user.userId,
      startedAt: new Date(),
    },
    include: {
      task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
    },
  })

  return res.status(201).json({ entry })
}

const stopTimeEntry = async (req, res) => {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: req.params.entryId },
    include: {
      task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
    },
  })

  if (!entry) {
    return res.status(404).json({ message: 'Time entry not found' })
  }
  if (entry.userId !== req.user.userId) {
    return res.status(403).json({ message: 'Not authorized to stop this timer' })
  }
  if (entry.endedAt) {
    return res.status(400).json({ message: 'Timer already stopped' })
  }

  const endedAt = new Date()
  const durationSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - entry.startedAt.getTime()) / 1000)
  )

  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: { endedAt, durationSeconds },
    include: {
      task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
    },
  })

  return res.json({ entry: updated })
}

module.exports = { listTimeEntries, startTimeEntry, stopTimeEntry }

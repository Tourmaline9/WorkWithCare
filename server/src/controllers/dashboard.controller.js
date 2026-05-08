const prisma = require('../prisma/client')

const getDashboard = async (req, res) => {
  const now = new Date()
  const assignedTasks = await prisma.task.findMany({
    where: { assigneeId: req.user.userId },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
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

  const myTasks = assignedTasks.slice(0, 6)

  const commentWhere =
    req.user.role === 'ADMIN'
      ? { task: { project: { ownerId: req.user.userId } } }
      : {
          task: {
            OR: [
              { assigneeId: req.user.userId },
              { creatorId: req.user.userId },
              { project: { members: { some: { userId: req.user.userId } } } },
            ],
          },
        }

  const recentComments = await prisma.taskComment.findMany({
    where: commentWhere,
    include: {
      author: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.userId },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const activeEntry = await prisma.timeEntry.findFirst({
    where: { userId: req.user.userId, endedAt: null },
    include: {
      task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
    },
    orderBy: { startedAt: 'desc' },
  })

  const recentEntries = await prisma.timeEntry.findMany({
    where: { userId: req.user.userId, endedAt: { not: null } },
    include: {
      task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
    },
    orderBy: { startedAt: 'desc' },
    take: 5,
  })

  return res.json({
    mySummary,
    adminSummary,
    myTasks,
    recentComments,
    notifications,
    tracking: {
      activeEntry,
      recentEntries,
    },
  })
}

module.exports = { getDashboard }

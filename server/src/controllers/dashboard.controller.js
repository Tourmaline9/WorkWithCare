const prisma = require('../prisma/client')

const getDashboard = async (req, res) => {
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
}

module.exports = { getDashboard }

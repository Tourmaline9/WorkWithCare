const prisma = require('../prisma/client')

const getTaskWithProject = async (taskId) =>
  prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { include: { members: true } },
    },
  })

const canAccessTask = (task, user) => {
  if (!task) return false
  const isAdminOwner =
    user.role === 'ADMIN' && task.project.ownerId === user.userId
  if (isAdminOwner) return true
  if (task.assigneeId === user.userId) return true
  if (task.creatorId === user.userId) return true
  return task.project.members.some((member) => member.userId === user.userId)
}

module.exports = { getTaskWithProject, canAccessTask }

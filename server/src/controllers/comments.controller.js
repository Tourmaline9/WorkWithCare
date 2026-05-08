const prisma = require('../prisma/client')

const getTaskForUser = async (taskId, user) =>
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

const listTaskComments = async (req, res) => {
  const task = await getTaskForUser(req.params.taskId, req.user)
  if (!task) {
    return res.status(404).json({ message: 'Task not found' })
  }
  if (!canAccessTask(task, req.user)) {
    return res.status(403).json({ message: 'Not authorized to view comments' })
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId: task.id },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ comments })
}

const createTaskComment = async (req, res) => {
  const task = await getTaskForUser(req.params.taskId, req.user)
  if (!task) {
    return res.status(404).json({ message: 'Task not found' })
  }
  if (!canAccessTask(task, req.user)) {
    return res.status(403).json({ message: 'Not authorized to comment' })
  }

  const comment = await prisma.taskComment.create({
    data: {
      body: req.body.body,
      taskId: task.id,
      authorId: req.user.userId,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  const recipients = new Set([
    task.assigneeId,
    task.creatorId,
    task.project.ownerId,
  ])
  recipients.delete(req.user.userId)
  const notificationRecipients = Array.from(recipients).filter(Boolean)

  if (notificationRecipients.length > 0) {
    await prisma.notification.createMany({
      data: notificationRecipients.map((userId) => ({
        userId,
        type: 'COMMENT',
        message: `New comment on "${task.title}"`,
        taskId: task.id,
      })),
    })
  }

  return res.status(201).json({ comment })
}

module.exports = { listTaskComments, createTaskComment }

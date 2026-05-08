const prisma = require('../prisma/client')

const listNotifications = async (req, res) => {
  const { unread } = req.query
  const where = { userId: req.user.userId }
  if (unread === 'true') {
    where.readAt = null
  }

  const notifications = await prisma.notification.findMany({
    where,
    include: { task: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return res.json({ notifications })
}

const markNotificationRead = async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.notificationId },
  })

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' })
  }
  if (notification.userId !== req.user.userId) {
    return res.status(403).json({ message: 'Not authorized to update notification' })
  }

  if (notification.readAt) {
    return res.json({ notification })
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: new Date() },
  })

  return res.json({ notification: updated })
}

module.exports = { listNotifications, markNotificationRead }

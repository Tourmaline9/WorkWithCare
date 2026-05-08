const prisma = require('../prisma/client')
const { parseDueDate } = require('../utils/date')

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
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

const listProjects = async (req, res) => {
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
}

const createProject = async (req, res) => {
  const { name, description, memberIds = [], deadline } = req.body

  let parsedDeadline = null
  try {
    parsedDeadline = parseDueDate(deadline)
  } catch (error) {
    return res.status(400).json({ message: 'Invalid deadline' })
  }

  const uniqueMemberIds = Array.from(new Set([...memberIds, req.user.userId]))

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
      deadline: parsedDeadline,
      ownerId: req.user.userId,
      members: {
        create: uniqueMemberIds.map((userId) => ({ userId })),
      },
    },
    include: projectInclude,
  })

  return res.status(201).json({ project })
}

const getProject = async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user)
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }
  return res.json({ project })
}

const updateProject = async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.projectId, ownerId: req.user.userId },
  })
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const updates = { ...req.body }
  if (updates.deadline !== undefined) {
    try {
      updates.deadline = parseDueDate(updates.deadline)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid deadline' })
    }
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: updates,
    include: projectInclude,
  })

  return res.json({ project: updatedProject })
}

const addProjectMember = async (req, res) => {
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
}

const removeProjectMember = async (req, res) => {
  const { projectId, memberId } = req.params

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: req.user.userId },
  })
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  if (memberId === project.ownerId) {
    return res.status(400).json({ message: 'Cannot remove the project owner' })
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: memberId } },
  })

  if (!membership) {
    return res.status(404).json({ message: 'Member not found' })
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberId } },
  })

  const updatedProject = await prisma.project.findFirst({
    where: { id: projectId },
    include: projectInclude,
  })

  return res.json({ project: updatedProject })
}

const deleteProject = async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.projectId, ownerId: req.user.userId },
  })
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  await prisma.project.delete({ where: { id: project.id } })

  return res.json({ success: true })
}

const createProjectTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId } = req.body
  const project = await prisma.project.findFirst({
    where: { id: req.params.projectId, ownerId: req.user.userId },
    include: { members: true },
  })
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  if (assigneeId) {
    const isMember = project.members.some(
      (member) => member.userId === assigneeId
    )
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
      priority: priority || 'MEDIUM',
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
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  addProjectMember,
  removeProjectMember,
  deleteProject,
  createProjectTask,
}

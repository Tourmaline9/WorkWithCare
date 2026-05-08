import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProjectTask,
  deleteProject,
  fetchProject,
  removeProjectMember,
  updateProject,
} from '../api/projects'
import { updateTask } from '../api/tasks'
import SummaryCard from '../components/dashboard/SummaryCard'
import TaskItem from '../components/tasks/TaskItem'

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'DONE']

const toDateInputValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.split('T')[0]
  return new Date(value).toISOString().split('T')[0]
}

export default function ProjectDetailsPage({ token, currentUser, isAdmin }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [projectSaving, setProjectSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [memberUpdatingId, setMemberUpdatingId] = useState(null)
  const [taskSaving, setTaskSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    deadline: '',
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeId: '',
    priority: 'MEDIUM',
  })

  const isOwner =
    isAdmin && project?.owner?.id && project.owner.id === currentUser.id

  const taskSummary = useMemo(() => {
    const summary = {
      total: 0,
      byStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
    }
    if (!project?.tasks) return summary
    summary.total = project.tasks.length
    project.tasks.forEach((task) => {
      if (summary.byStatus[task.status] !== undefined) {
        summary.byStatus[task.status] += 1
      }
    })
    return summary
  }, [project])

  const progressPercent = taskSummary.total
    ? Math.round((taskSummary.byStatus.DONE / taskSummary.total) * 100)
    : 0

  const resetEditForm = () => {
    if (!project) return
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      deadline: toDateInputValue(project.deadline),
    })
  }

  const loadProject = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProject(token, projectId)
      setProject(data.project)
      setEditForm({
        name: data.project.name || '',
        description: data.project.description || '',
        deadline: toDateInputValue(data.project.deadline),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !projectId) return
    loadProject()
  }, [token, projectId])

  const handleProjectUpdate = async (event) => {
    event.preventDefault()
    setProjectSaving(true)
    setError(null)
    try {
      await updateProject(token, project.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        deadline: editForm.deadline || null,
      })
      setIsEditing(false)
      await loadProject()
    } catch (err) {
      setError(err.message)
    } finally {
      setProjectSaving(false)
    }
  }

  const handleProjectDelete = async () => {
    const confirmed = window.confirm('Delete this project and all its tasks?')
    if (!confirmed) return
    setDeleting(true)
    setError(null)
    try {
      await deleteProject(token, project.id)
      navigate('/projects', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    const confirmed = window.confirm('Remove this member from the project?')
    if (!confirmed) return
    setMemberUpdatingId(memberId)
    setError(null)
    try {
      await removeProjectMember(token, project.id, memberId)
      await loadProject()
    } catch (err) {
      setError(err.message)
    } finally {
      setMemberUpdatingId(null)
    }
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()
    if (!taskForm.title) return
    setTaskSaving(true)
    setError(null)
    try {
      await createProjectTask(token, project.id, {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate || undefined,
        assigneeId: taskForm.assigneeId || undefined,
        priority: taskForm.priority || undefined,
      })
      setTaskForm({
        title: '',
        description: '',
        dueDate: '',
        assigneeId: '',
        priority: 'MEDIUM',
      })
      await loadProject()
    } catch (err) {
      setError(err.message)
    } finally {
      setTaskSaving(false)
    }
  }

  const handleTaskStatusChange = async (taskId, status) => {
    try {
      await updateTask(token, taskId, { status })
      await loadProject()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading && !project) {
    return (
      <section className="section">
        <div className="alert">Loading project...</div>
      </section>
    )
  }

  if (!project) {
    return (
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Project Details</h2>
            <p className="subtitle">We could not find this project.</p>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <Link to="/projects" className="ghost link-button">
          Back to Projects
        </Link>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <Link to="/projects" className="link-button muted-link">
            Back to Projects
          </Link>
          <h2>{project.name}</h2>
          {project.description && <p className="subtitle">{project.description}</p>}
        </div>
        {isOwner && (
          <div className="project-detail-actions">
            {!isEditing && (
              <button
                type="button"
                className="ghost"
                onClick={() => setIsEditing(true)}
              >
                Edit project
              </button>
            )}
            <button
              type="button"
              className="danger"
              onClick={handleProjectDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete project'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="grid">
        <SummaryCard title="Total Tasks" value={taskSummary.total} />
        <SummaryCard title="To Do" value={taskSummary.byStatus.TODO} />
        <SummaryCard
          title="In Progress"
          value={taskSummary.byStatus.IN_PROGRESS}
          tone="warning"
        />
        <SummaryCard
          title="Done"
          value={taskSummary.byStatus.DONE}
          tone="success"
        />
      </div>

      <div className="progress-panel">
        <div className="progress-header">
          <span>Completion</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="meta">
        <span>Owner: {project.owner?.name}</span>
        <span>Members: {project.members.length}</span>
        {project.deadline && (
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        )}
      </div>

      {isOwner && isEditing && (
        <form className="project-edit-form" onSubmit={handleProjectUpdate}>
          <div className="task-grid">
            <label>
              Project name
              <input
                type="text"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Deadline
              <input
                type="date"
                value={editForm.deadline}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    deadline: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="project-edit-actions">
            <button type="submit" disabled={projectSaving}>
              {projectSaving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                resetEditForm()
                setIsEditing(false)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <h3>Team Members</h3>
        <div className="member-list">
          {project.members.map((member) => (
            <span key={member.user.id} className="chip">
              <span>{member.user.name}</span>
              {isOwner && member.user.id !== project.ownerId && (
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => handleRemoveMember(member.user.id)}
                  disabled={memberUpdatingId === member.user.id}
                >
                  {memberUpdatingId === member.user.id ? '...' : 'Remove'}
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {isOwner && (
        <form className="task-form" onSubmit={handleCreateTask}>
          <h3>Create task</h3>
          <div className="task-grid">
            <label>
              Title
              <input
                type="text"
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
              />
            </label>
            <label>
              Priority
              <select
                value={taskForm.priority}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    priority: event.target.value,
                  }))
                }
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assign to
              <select
                value={taskForm.assigneeId}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    assigneeId: event.target.value,
                  }))
                }
              >
                <option value="">Unassigned</option>
                {project.members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={taskSaving}>
            {taskSaving ? 'Adding...' : 'Add task'}
          </button>
        </form>
      )}

      <div className="task-list">
        <div className="section-header">
          <div>
            <h3>Tasks</h3>
            <p className="subtitle">Track project work by status.</p>
          </div>
        </div>
        {project.tasks.length === 0 ? (
          <p className="empty">No tasks yet.</p>
        ) : (
          STATUS_ORDER.flatMap((status) =>
            project.tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  currentUser={currentUser}
                  isAdminOwner={isOwner}
                  onStatusChange={handleTaskStatusChange}
                />
              ))
          )
        )}
      </div>
    </section>
  )
}

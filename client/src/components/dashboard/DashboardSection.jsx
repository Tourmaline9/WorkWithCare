import { useMemo, useState } from 'react'
import { createProjectTask } from '../../api/projects'
import { updateTask } from '../../api/tasks'
import { createTaskComment } from '../../api/comments'
import { startTimeEntry, stopTimeEntry } from '../../api/timeEntries'

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const formatDuration = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

const getDueLabel = (dueDate) => {
  if (!dueDate) return 'No date'
  const today = new Date()
  const due = new Date(dueDate)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  )
  const startOfNextWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 7
  )

  if (due >= startOfToday && due < startOfTomorrow) return 'Today'
  if (due >= startOfTomorrow && due < startOfNextWeek) {
    const isTomorrow =
      due.toDateString() === startOfTomorrow.toDateString()
    return isTomorrow ? 'Tomorrow' : 'This week'
  }
  return due.toLocaleDateString()
}

export default function DashboardSection({
  dashboard,
  isAdmin,
  projects,
  tasks,
  currentUser,
  token,
  onRefresh,
}) {
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectId: '',
    dueDate: '',
  })
  const [commentForm, setCommentForm] = useState({
    taskId: '',
    body: '',
  })
  const [trackingTaskId, setTrackingTaskId] = useState('')
  const [actionError, setActionError] = useState(null)
  const [creatingTask, setCreatingTask] = useState(false)
  const [creatingComment, setCreatingComment] = useState(false)
  const [trackingAction, setTrackingAction] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  const assignedTasks = tasks || []
  const dashboardTasks = dashboard?.myTasks?.length ? dashboard.myTasks : assignedTasks
  const projectTasks = useMemo(
    () =>
      projects
        .flatMap((project) => project.tasks || [])
        .filter((task) => task && task.id),
    [projects]
  )
  const commentTasks = projectTasks.length
    ? projectTasks
    : assignedTasks.length
    ? assignedTasks
    : dashboardTasks
  const activeEntry = dashboard?.tracking?.activeEntry || null
  const recentEntries = dashboard?.tracking?.recentEntries || []
  const recentComments = dashboard?.recentComments || []

  const orderedTasks = useMemo(() => {
    return [...dashboardTasks].sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [dashboardTasks])

  const monthData = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    const offset = (start.getDay() + 6) % 7
    const days = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= end.getDate(); day += 1) {
      days.push(day)
    }
    return {
      label: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      days,
      year,
      month,
      today: now.getDate(),
    }
  }, [])

  const tasksByDay = useMemo(() => {
    const map = new Map()
    assignedTasks.forEach((task) => {
      if (!task.dueDate) return
      const date = new Date(task.dueDate)
      if (date.getMonth() !== monthData.month || date.getFullYear() !== monthData.year) {
        return
      }
      const day = date.getDate()
      map.set(day, (map.get(day) || 0) + 1)
    })
    return map
  }, [assignedTasks, monthData])

  const handleToggleTask = async (task) => {
    if (!token) return
    setUpdatingTaskId(task.id)
    setActionError(null)
    try {
      const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
      await updateTask(token, task.id, { status: nextStatus })
      await onRefresh()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()
    if (!taskForm.title || !taskForm.projectId || !token) return
    setCreatingTask(true)
    setActionError(null)
    try {
      await createProjectTask(token, taskForm.projectId, {
        title: taskForm.title,
        dueDate: taskForm.dueDate || undefined,
        assigneeId: currentUser?.id,
      })
      setTaskForm({ title: '', projectId: '', dueDate: '' })
      await onRefresh()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setCreatingTask(false)
    }
  }

  const handleCreateComment = async (event) => {
    event.preventDefault()
    if (!commentForm.taskId || !commentForm.body || !token) return
    setCreatingComment(true)
    setActionError(null)
    try {
      await createTaskComment(token, commentForm.taskId, { body: commentForm.body })
      setCommentForm((prev) => ({ ...prev, body: '' }))
      await onRefresh()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setCreatingComment(false)
    }
  }

  const handleStartTracking = async (event) => {
    event.preventDefault()
    if (!trackingTaskId || !token) return
    setTrackingAction(true)
    setActionError(null)
    try {
      await startTimeEntry(token, trackingTaskId)
      setTrackingTaskId('')
      await onRefresh()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setTrackingAction(false)
    }
  }

  const handleStopTracking = async () => {
    if (!activeEntry || !token) return
    setTrackingAction(true)
    setActionError(null)
    try {
      await stopTimeEntry(token, activeEntry.id)
      await onRefresh()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setTrackingAction(false)
    }
  }

  const activeDuration = activeEntry
    ? Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000)
    : 0

  const categoryProjects = projects.slice(0, 4)

  return (
    <section className="section dashboard-section">
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p className="subtitle">Stay on top of your tasks, comments, and tracking.</p>
        </div>
      </div>

      {actionError && <div className="alert error">{actionError}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <div className="widget card calendar-widget">
            <div className="widget-header">
              <h3>{monthData.label}</h3>
              <div className="widget-actions">
                <span className="muted">Overview</span>
              </div>
            </div>
            <div className="calendar-grid">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="calendar-label">
                  {label}
                </span>
              ))}
              {monthData.days.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} className="calendar-cell empty" />
                }
                const hasTasks = tasksByDay.has(day)
                const isToday = day === monthData.today
                return (
                  <span
                    key={day}
                    className={`calendar-cell ${isToday ? 'today' : ''} ${
                      hasTasks ? 'has-task' : ''
                    }`}
                  >
                    {day}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="widget card">
            <div className="widget-header">
              <h3>My categories</h3>
              <span className="muted">{projects.length} total</span>
            </div>
            <div className="widget-list">
              {categoryProjects.length === 0 ? (
                <p className="empty">No projects yet.</p>
              ) : (
                categoryProjects.map((project) => (
                  <div key={project.id} className="category-row">
                    <div>
                      <strong>{project.name}</strong>
                      <p className="muted">{project.description || 'Project workspace'}</p>
                    </div>
                    <div className="avatar-stack">
                      {project.members?.slice(0, 3).map((member) => (
                        <span key={member.userId} className="avatar tiny">
                          {getInitials(member.user?.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button type="button" className="ghost compact" onClick={() => {}}>
              + Add more
            </button>
          </div>
        </div>

        <div className="dashboard-column">
          <div className="widget card">
            <div className="widget-header">
              <h3>My tasks ({orderedTasks.length})</h3>
              <span className="muted">Today / This week</span>
            </div>
            <div className="widget-list">
              {orderedTasks.length === 0 ? (
                <p className="empty">No tasks assigned yet.</p>
              ) : (
                orderedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="task-row">
                    <button
                      type="button"
                      className={`task-toggle ${task.status === 'DONE' ? 'done' : ''}`}
                      onClick={() => handleToggleTask(task)}
                      disabled={updatingTaskId === task.id}
                      aria-label="Toggle task status"
                    >
                      {task.status === 'DONE' ? '✓' : ''}
                    </button>
                    <div className="task-info">
                      <strong>{task.title}</strong>
                      <p className="muted">
                        {task.project?.name || 'Project'} • {getDueLabel(task.dueDate)}
                      </p>
                    </div>
                    <span className="task-chip">{getDueLabel(task.dueDate)}</span>
                  </div>
                ))
              )}
            </div>
            <form className="task-quick-form" onSubmit={handleCreateTask}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="New task title"
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  disabled={!isAdmin}
                />
                <select
                  value={taskForm.projectId}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, projectId: event.target.value }))
                  }
                  disabled={!isAdmin}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
                  }
                  disabled={!isAdmin}
                />
                <button type="submit" disabled={!isAdmin || creatingTask}>
                  {creatingTask ? 'Adding...' : 'Add task'}
                </button>
              </div>
              {!isAdmin && (
                <p className="muted tiny">Only admins can create new tasks.</p>
              )}
            </form>
          </div>

          <div className="widget card">
            <div className="widget-header">
              <h3>My tracking</h3>
              <span className="muted">Time entries</span>
            </div>
            {activeEntry ? (
              <div className="tracking-active">
                <div>
                  <strong>{activeEntry.task?.title}</strong>
                  <p className="muted">
                    {activeEntry.task?.project?.name || 'Project'} • Active
                  </p>
                </div>
                <div className="tracking-controls">
                  <span className="tracking-time">
                    {formatDuration(activeDuration)}
                  </span>
                  <button type="button" onClick={handleStopTracking} disabled={trackingAction}>
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted">No active timer right now.</p>
            )}
            <form className="tracking-form" onSubmit={handleStartTracking}>
              <select
                value={trackingTaskId}
                onChange={(event) => setTrackingTaskId(event.target.value)}
                disabled={Boolean(activeEntry)}
              >
                <option value="">Select task to track</option>
                {assignedTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={trackingAction || !trackingTaskId || activeEntry}>
                {trackingAction ? 'Starting...' : 'Start tracking'}
              </button>
            </form>
            <div className="widget-list">
              {recentEntries.length === 0 ? (
                <p className="empty">No tracked time entries yet.</p>
              ) : (
                recentEntries.map((entry) => (
                  <div key={entry.id} className="tracking-row">
                    <div>
                      <strong>{entry.task?.title}</strong>
                      <p className="muted">{entry.task?.project?.name || 'Project'}</p>
                    </div>
                    <span className="tracking-time">
                      {formatDuration(entry.durationSeconds || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-column">
          <div className="widget card">
            <div className="widget-header">
              <h3>New comments</h3>
              <span className="muted">{recentComments.length} updates</span>
            </div>
            <div className="widget-list">
              {recentComments.length === 0 ? (
                <p className="empty">No new comments yet.</p>
              ) : (
                recentComments.map((comment) => (
                  <div key={comment.id} className="comment-row">
                    <div>
                      <strong>{comment.task?.title}</strong>
                      <p className="muted">{comment.body}</p>
                    </div>
                    <span className="muted tiny">{comment.author?.name}</span>
                  </div>
                ))
              )}
            </div>
            <form className="comment-form" onSubmit={handleCreateComment}>
              <select
                value={commentForm.taskId}
                onChange={(event) =>
                  setCommentForm((prev) => ({ ...prev, taskId: event.target.value }))
                }
              >
                <option value="">Select task</option>
                {commentTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <textarea
                rows="3"
                placeholder="Add a quick comment..."
                value={commentForm.body}
                onChange={(event) =>
                  setCommentForm((prev) => ({ ...prev, body: event.target.value }))
                }
              />
              <button type="submit" disabled={creatingComment}>
                {creatingComment ? 'Sending...' : 'Add comment'}
              </button>
            </form>
          </div>

          <button type="button" className="widget add-widget">
            <span className="add-icon">+</span>
            Add widget
          </button>
        </div>
      </div>
    </section>
  )
}

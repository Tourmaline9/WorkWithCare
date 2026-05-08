import { useEffect, useMemo, useState } from 'react'
import { fetchTasks, updateTask } from '../api/tasks'
import { STATUS_LABELS, STATUS_OPTIONS } from '../utils/status'
import { isTaskOverdue } from '../utils/task'

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const DEFAULT_FILTERS = {
  scope: 'me',
  status: '',
  priority: '',
  assigneeId: '',
  projectId: '',
  dueBefore: '',
  dueAfter: '',
  search: '',
}

const getStatusLabel = (status) => STATUS_LABELS[status] || status

export default function TaskBoardPage({
  token,
  currentUser,
  isAdmin,
  users,
  projects,
}) {
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    scope: isAdmin ? 'team' : 'me',
  }))
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeColumn, setActiveColumn] = useState(null)

  const hasFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'scope') return false
    return Boolean(value)
  })

  useEffect(() => {
    if (!isAdmin && filters.scope !== 'me') {
      setFilters((prev) => ({ ...prev, scope: 'me' }))
    }
  }, [isAdmin, filters.scope])

  const loadTasks = async (nextFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      const isMine = !isAdmin || nextFilters.scope === 'me'
      const data = await fetchTasks(token, {
        assigned: isMine ? 'me' : undefined,
        status: nextFilters.status || undefined,
        priority: nextFilters.priority || undefined,
        assigneeId:
          isAdmin && nextFilters.scope === 'team' && nextFilters.assigneeId
            ? nextFilters.assigneeId
            : undefined,
        projectId: nextFilters.projectId || undefined,
        dueBefore: nextFilters.dueBefore || undefined,
        dueAfter: nextFilters.dueAfter || undefined,
        search: nextFilters.search ? nextFilters.search.trim() : undefined,
      })
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadTasks()
  }, [token])

  const tasksByStatus = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status)
      return acc
    }, {})
  }, [tasks])

  const handleApplyFilters = async (event) => {
    event.preventDefault()
    await loadTasks()
  }

  const handleResetFilters = () => {
    const baseFilters = {
      ...DEFAULT_FILTERS,
      scope: isAdmin ? 'team' : 'me',
    }
    setFilters(baseFilters)
    loadTasks(baseFilters)
  }

  const handleDrop = async (event, status) => {
    event.preventDefault()
    setActiveColumn(null)
    let payload
    try {
      payload = JSON.parse(event.dataTransfer.getData('application/json'))
    } catch (err) {
      return
    }

    if (!payload?.taskId) return

    const task = tasks.find((item) => item.id === payload.taskId)
    if (!task) return

    const canUpdate = isAdmin || task.assigneeId === currentUser.id
    if (!canUpdate || task.status === status) return

    try {
      await updateTask(token, task.id, { status })
      setTasks((prev) => {
        const updated = prev.map((item) =>
          item.id === task.id ? { ...item, status } : item
        )
        if (filters.status && filters.status !== status) {
          return updated.filter((item) => item.id !== task.id)
        }
        return updated
      })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Task Board</h2>
          <p className="subtitle">Drag tasks across columns to update status.</p>
        </div>
      </div>

      <form className="card filter-panel" onSubmit={handleApplyFilters}>
        <div className="filter-grid">
          {isAdmin && (
            <label>
              Scope
              <select
                value={filters.scope}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, scope: event.target.value }))
                }
              >
                <option value="team">Team tasks</option>
                <option value="me">My tasks</option>
              </select>
            </label>
          )}
          <label>
            Search
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Search tasks"
            />
          </label>
          <label>
            Status
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="">Any</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, priority: event.target.value }))
              }
            >
              <option value="">Any</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label>
            Project
            <select
              value={filters.projectId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, projectId: event.target.value }))
              }
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          {isAdmin && filters.scope === 'team' && (
            <label>
              Assignee
              <select
                value={filters.assigneeId}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    assigneeId: event.target.value,
                  }))
                }
              >
                <option value="">Anyone</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Due after
            <input
              type="date"
              value={filters.dueAfter}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, dueAfter: event.target.value }))
              }
            />
          </label>
          <label>
            Due before
            <input
              type="date"
              value={filters.dueBefore}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, dueBefore: event.target.value }))
              }
            />
          </label>
        </div>
        <div className="filter-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : hasFilters ? 'Apply filters' : 'Refresh'}
          </button>
          <button type="button" className="ghost" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </form>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert">Loading tasks...</div>}

      <div className="board-grid">
        {STATUS_OPTIONS.map((status) => (
          <div
            key={status}
            className={`board-column ${
              activeColumn === status ? 'is-over' : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setActiveColumn(status)
            }}
            onDragLeave={() => setActiveColumn(null)}
            onDrop={(event) => handleDrop(event, status)}
          >
            <div className="board-column-header">
              <h3>{getStatusLabel(status)}</h3>
              <span className="tag">{tasksByStatus[status]?.length || 0}</span>
            </div>
            <div className="board-list">
              {(tasksByStatus[status] || []).map((task) => {
                const canUpdate = isAdmin || task.assigneeId === currentUser.id
                const dueDate = task.dueDate ? new Date(task.dueDate) : null
                const isOverdue = isTaskOverdue(task.dueDate, task.status)
                const priority = task.priority || 'MEDIUM'

                return (
                  <div
                    key={task.id}
                    className={`board-card ${canUpdate ? 'draggable' : ''}`}
                    draggable={canUpdate}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({ taskId: task.id })
                      )
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    <div className="board-card-header">
                      <h4>{task.title}</h4>
                      <span className={`priority-tag ${priority.toLowerCase()}`}>
                        {priority}
                      </span>
                    </div>
                    {task.description && <p>{task.description}</p>}
                    <div className="board-card-meta">
                      <span>{task.project?.name || 'Project'}</span>
                      <span>{task.assignee?.name || 'Unassigned'}</span>
                      {dueDate && (
                        <span className={isOverdue ? 'overdue' : ''}>
                          Due {dueDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

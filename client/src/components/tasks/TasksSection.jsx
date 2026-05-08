import { useEffect, useState } from 'react'
import { fetchTasks, updateTask } from '../../api/tasks'
import { STATUS_LABELS, STATUS_OPTIONS } from '../../utils/status'
import TaskItem from './TaskItem'

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const DEFAULT_FILTERS = {
  status: '',
  priority: '',
  dueBefore: '',
  dueAfter: '',
  search: '',
}

export default function TasksSection({
  tasks,
  currentUser,
  isAdmin,
  onRefresh,
  token,
}) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [visibleTasks, setVisibleTasks] = useState(tasks)
  const [isFiltering, setIsFiltering] = useState(false)

  const hasFilters = Object.values(filters).some((value) => value)

  useEffect(() => {
    if (!isFiltering) {
      setVisibleTasks(tasks)
    }
  }, [tasks, isFiltering])

  const loadFilteredTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTasks(token, {
        assigned: 'me',
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        dueBefore: filters.dueBefore || undefined,
        dueAfter: filters.dueAfter || undefined,
        search: filters.search ? filters.search.trim() : undefined,
      })
      setVisibleTasks(data.tasks || [])
      setIsFiltering(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(token, taskId, { status })
      if (isFiltering && hasFilters) {
        await loadFilteredTasks()
      } else {
        onRefresh()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleApplyFilters = async (event) => {
    event.preventDefault()
    if (!hasFilters) {
      setIsFiltering(false)
      setVisibleTasks(tasks)
      onRefresh()
      return
    }
    await loadFilteredTasks()
  }

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS })
    setIsFiltering(false)
    setVisibleTasks(tasks)
    setError(null)
    onRefresh()
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>My Tasks</h2>
          <p className="subtitle">Focus on tasks assigned to you.</p>
        </div>
      </div>
      <form className="card filter-panel" onSubmit={handleApplyFilters}>
        <div className="filter-grid">
          <label>
            Search
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Search task titles"
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
                  {STATUS_LABELS[status]}
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
            {loading ? 'Filtering...' : 'Apply filters'}
          </button>
          <button type="button" className="ghost" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </form>
      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert">Loading tasks...</div>}
      {visibleTasks.length === 0 ? (
        <p className="empty">No assigned tasks yet.</p>
      ) : (
        <div className="tasks-grid">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              currentUser={currentUser}
              isAdminOwner={isAdmin}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  )
}

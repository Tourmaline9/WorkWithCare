import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { apiRequest } from './api'

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const STATUS_OPTIONS = Object.keys(STATUS_LABELS)

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('wwc_token'))
  const [user, setUser] = useState(null)
  const [view, setView] = useState('dashboard')
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [assignedTasks, setAssignedTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isAdmin = user?.role === 'ADMIN'

  const handleAuthSuccess = (authToken, authUser) => {
    localStorage.setItem('wwc_token', authToken)
    setToken(authToken)
    setUser(authUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('wwc_token')
    setToken(null)
    setUser(null)
    setProjects([])
    setUsers([])
    setDashboard(null)
    setAssignedTasks([])
  }

  useEffect(() => {
    if (!token) return
    apiRequest('/api/me', { token })
      .then((data) => setUser(data.user))
      .catch(() => handleLogout())
  }, [token])

  const loadData = useCallback(async () => {
    if (!token || !user) return
    setLoading(true)
    setError(null)
    try {
      const requests = [
        apiRequest('/api/projects', { token }),
        apiRequest('/api/dashboard', { token }),
        apiRequest('/api/tasks?assigned=me', { token }),
      ]
      if (user.role === 'ADMIN') {
        requests.push(apiRequest('/api/users', { token }))
      }

      const results = await Promise.all(requests)
      const [projectsData, dashboardData, tasksData, usersData] = results
      setProjects(projectsData.projects || [])
      setDashboard(dashboardData)
      setAssignedTasks(tasksData.tasks || [])
      if (usersData?.users) {
        setUsers(usersData.users)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refreshData = () => loadData()

  if (!token || !user) {
    return <AuthPanel onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>WorkWithCare</h1>
          <p className="subtitle">Team Task Manager</p>
        </div>
        <nav className="nav">
          <button
            type="button"
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={view === 'projects' ? 'active' : ''}
            onClick={() => setView('projects')}
          >
            Projects
          </button>
          <button
            type="button"
            className={view === 'tasks' ? 'active' : ''}
            onClick={() => setView('tasks')}
          >
            My Tasks
          </button>
        </nav>
        <div className="user-info">
          <div>
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button type="button" className="ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main>
        {error && <div className="alert error">{error}</div>}
        {loading && <div className="alert">Loading data...</div>}

        {view === 'dashboard' && (
          <DashboardSection
            dashboard={dashboard}
            isAdmin={isAdmin}
            projects={projects}
          />
        )}
        {view === 'projects' && (
          <ProjectsSection
            projects={projects}
            users={users}
            currentUser={user}
            isAdmin={isAdmin}
            onRefresh={refreshData}
            token={token}
          />
        )}
        {view === 'tasks' && (
          <TasksSection
            tasks={assignedTasks}
            currentUser={user}
            isAdmin={isAdmin}
            onRefresh={refreshData}
            token={token}
          />
        )}
      </main>
    </div>
  )
}

function AuthPanel({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(true)
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER',
    adminCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const path = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const payload = isSignup
        ? formState
        : { email: formState.email, password: formState.password }
      const data = await apiRequest(path, { method: 'POST', body: payload })
      onAuthSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <div>
          <h1>Welcome to WorkWithCare</h1>
          <p className="subtitle">
            Plan projects, assign tasks, and stay on top of progress.
          </p>
        </div>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
            />
          </label>
          {isSignup && (
            <label>
              Role
              <select name="role" value={formState.role} onChange={handleChange}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          )}
          {isSignup && formState.role === 'ADMIN' && (
            <label>
              Admin invite code (optional)
              <input
                type="text"
                name="adminCode"
                value={formState.adminCode}
                onChange={handleChange}
                placeholder="Invite code"
              />
            </label>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Working...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
        <button
          type="button"
          className="link"
          onClick={() => setIsSignup((prev) => !prev)}
        >
          {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
      </section>
      <aside className="auth-aside">
        <h2>Everything your team needs</h2>
        <ul>
          <li>Role-based access for admins and members</li>
          <li>Project boards with task ownership</li>
          <li>Dashboard insights for overdue work</li>
          <li>Responsive layout for desktop and mobile</li>
        </ul>
      </aside>
    </div>
  )
}

function DashboardSection({ dashboard, isAdmin, projects }) {
  const summary = dashboard?.mySummary
  const adminSummary = dashboard?.adminSummary

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p className="subtitle">Snapshot of your workload and team activity.</p>
        </div>
      </div>
      <div className="grid">
        <SummaryCard title="My Tasks" value={summary?.total ?? 0} />
        <SummaryCard title="Overdue" value={summary?.overdue ?? 0} tone="danger" />
        <SummaryCard
          title="In Progress"
          value={summary?.byStatus?.IN_PROGRESS ?? 0}
          tone="warning"
        />
        <SummaryCard title="Completed" value={summary?.byStatus?.DONE ?? 0} tone="success" />
      </div>

      {isAdmin && (
        <div className="admin-summary">
          <h3>Admin Overview</h3>
          <div className="grid">
            <SummaryCard
              title="Projects Owned"
              value={adminSummary?.projectCount ?? 0}
            />
            <SummaryCard
              title="Team Tasks"
              value={adminSummary?.total ?? 0}
            />
            <SummaryCard
              title="Team Overdue"
              value={adminSummary?.overdue ?? 0}
              tone="danger"
            />
            <SummaryCard
              title="Team In Progress"
              value={adminSummary?.byStatus?.IN_PROGRESS ?? 0}
              tone="warning"
            />
          </div>
        </div>
      )}

      <div className="summary-panel">
        <h3>Active Projects</h3>
        {projects.length === 0 ? (
          <p className="empty">No projects yet. Create one to get started.</p>
        ) : (
          <div className="project-tags">
            {projects.map((project) => (
              <span key={project.id} className="tag">
                {project.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ProjectsSection({ projects, users, currentUser, isAdmin, onRefresh, token }) {
  const [formState, setFormState] = useState({ name: '', description: '' })
  const [selectedMembers, setSelectedMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const availableMembers = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [users, currentUser]
  )

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiRequest('/api/projects', {
        method: 'POST',
        token,
        body: {
          name: formState.name,
          description: formState.description,
          memberIds: selectedMembers,
        },
      })
      setFormState({ name: '', description: '' })
      setSelectedMembers([])
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Projects</h2>
          <p className="subtitle">Track milestones, tasks, and team assignments.</p>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h3>Create project</h3>
          {error && <div className="alert error">{error}</div>}
          <form className="grid-form" onSubmit={handleCreateProject}>
            <label>
              Project name
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <div className="member-picker">
              <span>Assign members</span>
              <div className="chips">
                {availableMembers.length === 0 && (
                  <span className="empty">Invite teammates by creating accounts.</span>
                )}
                {availableMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={selectedMembers.includes(member.id) ? 'chip active' : 'chip'}
                    onClick={() => toggleMember(member.id)}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create project'}
            </button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="empty">No projects available yet.</p>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onRefresh={onRefresh}
              token={token}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ProjectCard({ project, currentUser, isAdmin, onRefresh, token }) {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeId: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isOwner = isAdmin && project.owner?.id === currentUser.id

  const handleCreateTask = async (event) => {
    event.preventDefault()
    if (!taskForm.title) return
    setSaving(true)
    setError(null)
    try {
      await apiRequest(`/api/projects/${project.id}/tasks`, {
        method: 'POST',
        token,
        body: {
          title: taskForm.title,
          description: taskForm.description,
          dueDate: taskForm.dueDate || undefined,
          assigneeId: taskForm.assigneeId || undefined,
        },
      })
      setTaskForm({ title: '', description: '', dueDate: '', assigneeId: '' })
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        token,
        body: { status },
      })
      onRefresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="card project-card">
      <div className="project-header">
        <div>
          <h3>{project.name}</h3>
          {project.description && <p>{project.description}</p>}
        </div>
        <span className="tag">{project.tasks.length} tasks</span>
      </div>
      <div className="meta">
        <span>Owner: {project.owner?.name}</span>
        <span>Members: {project.members.length}</span>
      </div>
      <div className="member-list">
        {project.members.map((member) => (
          <span key={member.user.id} className="chip">
            {member.user.name}
          </span>
        ))}
      </div>
      {error && <div className="alert error">{error}</div>}

      {isOwner && (
        <form className="task-form" onSubmit={handleCreateTask}>
          <h4>Create task</h4>
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
                  setTaskForm((prev) => ({ ...prev, description: event.target.value }))
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
              Assign to
              <select
                value={taskForm.assigneeId}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, assigneeId: event.target.value }))
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
          <button type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add task'}
          </button>
        </form>
      )}

      <div className="task-list">
        <h4>Tasks</h4>
        {project.tasks.length === 0 ? (
          <p className="empty">No tasks yet.</p>
        ) : (
          project.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              currentUser={currentUser}
              isAdminOwner={isOwner}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TasksSection({ tasks, currentUser, isAdmin, onRefresh, token }) {
  const [error, setError] = useState(null)

  const handleStatusChange = async (taskId, status) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        token,
        body: { status },
      })
      onRefresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>My Tasks</h2>
          <p className="subtitle">Focus on tasks assigned to you.</p>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {tasks.length === 0 ? (
        <p className="empty">No assigned tasks yet.</p>
      ) : (
        <div className="tasks-grid">
          {tasks.map((task) => (
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

function TaskItem({ task, currentUser, isAdminOwner, onStatusChange }) {
  const canUpdate = isAdminOwner || task.assigneeId === currentUser.id
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue =
    dueDate && dueDate < new Date() && task.status !== 'DONE'

  return (
    <div className="task-card">
      <div>
        <div className="task-header">
          <h5>{task.title}</h5>
          <span className={`status-tag ${task.status.toLowerCase()}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>
        {task.description && <p>{task.description}</p>}
        <div className="meta">
          <span>
            Assignee: {task.assignee?.name || 'Unassigned'}
          </span>
          {dueDate && (
            <span className={isOverdue ? 'overdue' : ''}>
              Due: {dueDate.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {canUpdate && (
        <label className="status-select">
          Update status
          <select
            value={task.status}
            onChange={(event) => onStatusChange(task.id, event.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

function SummaryCard({ title, value, tone }) {
  return (
    <div className={`card summary-card ${tone || ''}`.trim()}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App

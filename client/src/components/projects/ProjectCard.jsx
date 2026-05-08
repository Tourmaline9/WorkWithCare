import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createProjectTask,
  deleteProject,
  removeProjectMember,
  updateProject,
} from '../../api/projects'
import { updateTask } from '../../api/tasks'
import TaskItem from '../tasks/TaskItem'

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const toDateInputValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.split('T')[0]
  return new Date(value).toISOString().split('T')[0]
}

export default function ProjectCard({
  project,
  currentUser,
  isAdmin,
  onRefresh,
  token,
}) {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeId: '',
    priority: 'MEDIUM',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    deadline: '',
  })
  const [taskSaving, setTaskSaving] = useState(false)
  const [projectSaving, setProjectSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [memberUpdatingId, setMemberUpdatingId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState(null)

  const isOwner = isAdmin && project.owner?.id === currentUser.id

  useEffect(() => {
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      deadline: toDateInputValue(project.deadline),
    })
  }, [project])

  const resetEditForm = () => {
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      deadline: toDateInputValue(project.deadline),
    })
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
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setTaskSaving(false)
    }
  }

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
      onRefresh()
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
      onRefresh()
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
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setMemberUpdatingId(null)
    }
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(token, taskId, { status })
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
        <div className="project-actions">
          <span className="tag">{project.tasks.length} tasks</span>
          <Link to={`/projects/${project.id}`} className="ghost link-button">
            View
          </Link>
          {isOwner && !isEditing && (
            <>
              <button
                type="button"
                className="ghost"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleProjectDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
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
      <div className="meta">
        <span>Owner: {project.owner?.name}</span>
        <span>Members: {project.members.length}</span>
        {project.deadline && (
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        )}
      </div>
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

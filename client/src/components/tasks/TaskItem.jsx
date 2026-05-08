import { STATUS_LABELS, STATUS_OPTIONS } from '../../utils/status'
import { isTaskOverdue } from '../../utils/task'

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export default function TaskItem({
  task,
  currentUser,
  isAdminOwner,
  onStatusChange,
}) {
  const canUpdate = isAdminOwner || task.assigneeId === currentUser.id
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = isTaskOverdue(task.dueDate, task.status)
  const priority = task.priority || 'MEDIUM'

  return (
    <div className="task-card">
      <div>
        <div className="task-header">
          <h5>{task.title}</h5>
          <span className={`status-tag ${task.status.toLowerCase()}`}>
            {STATUS_LABELS[task.status]}
          </span>
          <span className={`priority-tag ${priority.toLowerCase()}`}>
            {PRIORITY_LABELS[priority] || priority}
          </span>
        </div>
        {task.description && <p>{task.description}</p>}
        <div className="meta">
          <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
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

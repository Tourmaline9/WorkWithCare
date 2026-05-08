import { useMemo } from 'react'

export default function TeamPage({ users, teamTasks, isAdmin }) {
  const workload = useMemo(() => {
    return users.map((user) => {
      const assignedTasks = teamTasks.filter(
        (task) => task.assigneeId === user.id
      )
      const completedTasks = assignedTasks.filter(
        (task) => task.status === 'DONE'
      )
      return {
        user,
        assignedCount: assignedTasks.length,
        completedCount: completedTasks.length,
      }
    })
  }, [users, teamTasks])

  if (!isAdmin) {
    return (
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Team</h2>
            <p className="subtitle">Admin access is required to view team data.</p>
          </div>
        </div>
        <p className="empty">You do not have permission to view this page.</p>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Team Members</h2>
          <p className="subtitle">Workload overview for your organization.</p>
        </div>
      </div>

      {workload.length === 0 ? (
        <p className="empty">No team members yet.</p>
      ) : (
        <div className="team-grid">
          {workload.map(({ user, assignedCount, completedCount }) => (
            <div key={user.id} className="card team-card">
              <div className="team-header">
                <h3>{user.name}</h3>
                <span className="tag">{user.role}</span>
              </div>
              <div className="meta">
                <span>{user.email}</span>
                <span>Assigned tasks: {assignedCount}</span>
                <span>Completed tasks: {completedCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

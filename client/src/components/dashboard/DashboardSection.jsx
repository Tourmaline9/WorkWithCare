import SummaryCard from './SummaryCard'

export default function DashboardSection({ dashboard, isAdmin, projects }) {
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
        <SummaryCard
          title="Completed"
          value={summary?.byStatus?.DONE ?? 0}
          tone="success"
        />
      </div>

      {isAdmin && (
        <div className="admin-summary">
          <h3>Admin Overview</h3>
          <div className="grid">
            <SummaryCard
              title="Projects Owned"
              value={adminSummary?.projectCount ?? 0}
            />
            <SummaryCard title="Team Tasks" value={adminSummary?.total ?? 0} />
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

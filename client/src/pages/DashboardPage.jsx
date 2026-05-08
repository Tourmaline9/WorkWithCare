import DashboardSection from '../components/dashboard/DashboardSection'

export default function DashboardPage({
  dashboard,
  isAdmin,
  projects,
  tasks,
  currentUser,
  token,
  onRefresh,
}) {
  return (
    <DashboardSection
      dashboard={dashboard}
      isAdmin={isAdmin}
      projects={projects}
      tasks={tasks}
      currentUser={currentUser}
      token={token}
      onRefresh={onRefresh}
    />
  )
}

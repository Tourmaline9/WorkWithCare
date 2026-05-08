import DashboardSection from '../components/dashboard/DashboardSection'

export default function DashboardPage({ dashboard, isAdmin, projects }) {
  return (
    <DashboardSection
      dashboard={dashboard}
      isAdmin={isAdmin}
      projects={projects}
    />
  )
}

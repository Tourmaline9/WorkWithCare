import ProjectsSection from '../components/projects/ProjectsSection'

export default function ProjectsPage({
  projects,
  users,
  currentUser,
  isAdmin,
  onRefresh,
  token,
}) {
  return (
    <ProjectsSection
      projects={projects}
      users={users}
      currentUser={currentUser}
      isAdmin={isAdmin}
      onRefresh={onRefresh}
      token={token}
    />
  )
}

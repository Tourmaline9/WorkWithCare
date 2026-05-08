import TasksSection from '../components/tasks/TasksSection'

export default function TasksPage({
  tasks,
  currentUser,
  isAdmin,
  onRefresh,
  token,
}) {
  return (
    <TasksSection
      tasks={tasks}
      currentUser={currentUser}
      isAdmin={isAdmin}
      onRefresh={onRefresh}
      token={token}
    />
  )
}

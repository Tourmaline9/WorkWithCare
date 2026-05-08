import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import { useAppData } from './hooks/useAppData'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import ProjectsPage from './pages/ProjectsPage'
import TaskBoardPage from './pages/TaskBoardPage'
import TasksPage from './pages/TasksPage'
import TeamPage from './pages/TeamPage'

function App() {
  const { token, user, isReady, login, logout } = useAuth()
  const {
    projects,
    users,
    dashboard,
    assignedTasks,
    teamTasks,
    loading,
    error,
    refresh,
  } = useAppData({ token, user })

  const isAdmin = user?.role === 'ADMIN'

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage onAuthSuccess={login} />} />
      <Route element={<ProtectedRoute isReady={isReady} token={token} user={user} />}>
        <Route
          element={
            <AppLayout
              user={user}
              onLogout={logout}
              loading={loading}
              error={error}
            />
          }
        >
          <Route
            index
            element={
              <DashboardPage
                dashboard={dashboard}
                isAdmin={isAdmin}
                projects={projects}
              />
            }
          />
          <Route
            path="projects"
            element={
              <ProjectsPage
                projects={projects}
                users={users}
                currentUser={user}
                isAdmin={isAdmin}
                onRefresh={refresh}
                token={token}
              />
            }
          />
          <Route
            path="projects/:projectId"
            element={
              <ProjectDetailsPage
                token={token}
                currentUser={user}
                isAdmin={isAdmin}
              />
            }
          />
          <Route
            path="board"
            element={
              <TaskBoardPage
                token={token}
                currentUser={user}
                isAdmin={isAdmin}
                users={users}
                projects={projects}
              />
            }
          />
          <Route
            path="tasks"
            element={
              <TasksPage
                tasks={assignedTasks}
                currentUser={user}
                isAdmin={isAdmin}
                onRefresh={refresh}
                token={token}
              />
            }
          />
          <Route
            path="team"
            element={
              <TeamPage users={users} teamTasks={teamTasks} isAdmin={isAdmin} />
            }
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={<Navigate to={token ? '/' : '/auth'} replace />}
      />
    </Routes>
  )
}

export default App

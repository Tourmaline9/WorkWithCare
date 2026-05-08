import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute({ isReady, token, user }) {
  if (!isReady) {
    return (
      <div className="app">
        <main>
          <div className="alert">Checking session...</div>
        </main>
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

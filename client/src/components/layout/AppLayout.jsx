import { NavLink, Outlet } from 'react-router-dom'

const getNavClass = ({ isActive }) =>
  isActive ? 'nav-link active' : 'nav-link'

export default function AppLayout({ user, onLogout, loading, error }) {
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>WorkWithCare</h1>
          <p className="subtitle">Team Task Manager</p>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={getNavClass}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={getNavClass}>
            Projects
          </NavLink>
          <NavLink to="/board" className={getNavClass}>
            Task Board
          </NavLink>
          <NavLink to="/tasks" className={getNavClass}>
            My Tasks
          </NavLink>
          {isAdmin && (
            <NavLink to="/team" className={getNavClass}>
              Team
            </NavLink>
          )}
        </nav>
        <div className="user-info">
          <div>
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button type="button" className="ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <main>
        {error && <div className="alert error">{error}</div>}
        {loading && <div className="alert">Loading data...</div>}
        <Outlet />
      </main>
    </div>
  )
}

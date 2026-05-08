import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/board', label: 'Tasks' },
  { to: '/tasks', label: 'My Work' }
]

export default function AppLayout({
  user,
  onLogout,
  loading,
  error,
  notificationCount = 0,
}) {
  const isAdmin = user?.role === 'ADMIN'
  const location = useLocation()

  const pageTitle =
    links.find((item) => item.to !== '/' && location.pathname.startsWith(item.to))
      ?.label || 'Dashboard'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="workspace-logo">WWC</div>
          <div>
            <strong>WorkWithCare</strong>
            <p>Product Workspace</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav-link">
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/team" className="nav-link">
              Team
            </NavLink>
          )}
          <NavLink to="/settings" className="nav-link disabled" onClick={(e) => e.preventDefault()}>
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <span className="avatar">{user?.name?.slice(0, 1) || 'U'}</span>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button type="button" className="ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            <input type="search" placeholder="Search projects, tasks..." aria-label="Search" />
            <Link to="/projects" className="primary-btn">
              + New task
            </Link>
            <button type="button" className="icon-btn" aria-label="Notifications">
              ⦿
              {notificationCount > 0 && (
                <span className="icon-badge">{notificationCount}</span>
              )}
            </button>
            <span className="avatar">{user?.name?.slice(0, 1) || 'U'}</span>
          </div>
        </header>

        <main>
          {error && <div className="alert error">{error}</div>}
          {loading && <div className="alert">Loading data...</div>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

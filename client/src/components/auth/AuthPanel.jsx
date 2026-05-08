import { useState } from 'react'
import { login, signup } from '../../api/auth'

export default function AuthPanel({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(true)
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER',
    adminCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = isSignup
        ? formState
        : { email: formState.email, password: formState.password }
      const data = isSignup ? await signup(payload) : await login(payload)
      onAuthSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <div>
          <h1>Welcome to WorkWithCare</h1>
          <p className="subtitle">
            Plan projects, assign tasks, and stay on top of progress.
          </p>
        </div>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
            />
          </label>
          {isSignup && (
            <label>
              Role
              <select name="role" value={formState.role} onChange={handleChange}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          )}
          {isSignup && formState.role === 'ADMIN' && (
            <label>
              Admin invite code (optional)
              <input
                type="text"
                name="adminCode"
                value={formState.adminCode}
                onChange={handleChange}
                placeholder="Invite code"
              />
            </label>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Working...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
        <button
          type="button"
          className="link"
          onClick={() => setIsSignup((prev) => !prev)}
        >
          {isSignup
            ? 'Already have an account? Log in'
            : 'New here? Create an account'}
        </button>
      </section>
      <aside className="auth-aside">
        <h2>Everything your team needs</h2>
        <ul>
          <li>Role-based access for admins and members</li>
          <li>Project boards with task ownership</li>
          <li>Dashboard insights for overdue work</li>
          <li>Responsive layout for desktop and mobile</li>
        </ul>
      </aside>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { createProject } from '../../api/projects'
import ProjectCard from './ProjectCard'

export default function ProjectsSection({
  projects,
  users,
  currentUser,
  isAdmin,
  onRefresh,
  token,
}) {
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    deadline: '',
  })
  const [selectedMembers, setSelectedMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const availableMembers = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [users, currentUser]
  )

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createProject(token, {
        name: formState.name,
        description: formState.description,
        deadline: formState.deadline || undefined,
        memberIds: selectedMembers,
      })
      setFormState({ name: '', description: '', deadline: '' })
      setSelectedMembers([])
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Projects</h2>
          <p className="subtitle">Track milestones, tasks, and team assignments.</p>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h3>Create project</h3>
          {error && <div className="alert error">{error}</div>}
          <form className="grid-form" onSubmit={handleCreateProject}>
            <label>
              Project name
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Deadline
              <input
                type="date"
                value={formState.deadline}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    deadline: event.target.value,
                  }))
                }
              />
            </label>
            <div className="member-picker">
              <span>Assign members</span>
              <div className="chips">
                {availableMembers.length === 0 && (
                  <span className="empty">
                    Invite teammates by creating accounts.
                  </span>
                )}
                {availableMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={
                      selectedMembers.includes(member.id) ? 'chip active' : 'chip'
                    }
                    onClick={() => toggleMember(member.id)}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create project'}
            </button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="empty">No projects available yet.</p>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onRefresh={onRefresh}
              token={token}
            />
          ))}
        </div>
      )}
    </section>
  )
}

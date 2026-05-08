import { useCallback, useEffect, useState } from 'react'
import { fetchDashboard } from '../api/dashboard'
import { fetchProjects } from '../api/projects'
import { fetchTasks } from '../api/tasks'
import { fetchUsers } from '../api/users'

export const useAppData = ({ token, user }) => {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [assignedTasks, setAssignedTasks] = useState([])
  const [teamTasks, setTeamTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    if (!token || !user) return
    setLoading(true)
    setError(null)
    try {
      const requests = [
        fetchProjects(token),
        fetchDashboard(token),
        fetchTasks(token, { assigned: 'me' }),
      ]

      if (user.role === 'ADMIN') {
        requests.push(fetchUsers(token))
        requests.push(fetchTasks(token))
      }

      const results = await Promise.all(requests)
      const [projectsData, dashboardData, tasksData, usersData, teamTasksData] =
        results

      setProjects(projectsData.projects || [])
      setDashboard(dashboardData)
      setAssignedTasks(tasksData.tasks || [])
      if (usersData?.users) {
        setUsers(usersData.users)
      }
      if (teamTasksData?.tasks) {
        setTeamTasks(teamTasksData.tasks)
      } else if (user.role !== 'ADMIN') {
        setTeamTasks([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (token && user) return
    setProjects([])
    setUsers([])
    setDashboard(null)
    setAssignedTasks([])
    setTeamTasks([])
    setLoading(false)
    setError(null)
  }, [token, user])

  return {
    projects,
    users,
    dashboard,
    assignedTasks,
    teamTasks,
    loading,
    error,
    refresh: loadData,
  }
}

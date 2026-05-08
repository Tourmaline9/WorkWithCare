import { apiRequest } from './client'

export const fetchTasks = (
  token,
  { assigned, projectId, status, priority, assigneeId, dueBefore, dueAfter, search } = {}
) => {
  const params = new URLSearchParams()
  if (assigned) params.set('assigned', assigned)
  if (projectId) params.set('projectId', projectId)
  if (status) params.set('status', status)
  if (priority) params.set('priority', priority)
  if (assigneeId) params.set('assigneeId', assigneeId)
  if (dueBefore) params.set('dueBefore', dueBefore)
  if (dueAfter) params.set('dueAfter', dueAfter)
  if (search) params.set('search', search)
  const query = params.toString()
  return apiRequest(`/api/tasks${query ? `?${query}` : ''}`, { token })
}

export const updateTask = (token, taskId, payload) =>
  apiRequest(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })

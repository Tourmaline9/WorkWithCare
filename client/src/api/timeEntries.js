import { apiRequest } from './client'

export const fetchTimeEntries = (token, { taskId } = {}) => {
  const params = new URLSearchParams()
  if (taskId) params.set('taskId', taskId)
  const query = params.toString()
  return apiRequest(`/api/time-entries${query ? `?${query}` : ''}`, { token })
}

export const startTimeEntry = (token, taskId) =>
  apiRequest('/api/time-entries/start', {
    method: 'POST',
    token,
    body: { taskId },
  })

export const stopTimeEntry = (token, entryId) =>
  apiRequest(`/api/time-entries/${entryId}/stop`, {
    method: 'PATCH',
    token,
  })

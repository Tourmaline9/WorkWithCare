import { apiRequest } from './client'

export const fetchTaskComments = (token, taskId) =>
  apiRequest(`/api/tasks/${taskId}/comments`, { token })

export const createTaskComment = (token, taskId, payload) =>
  apiRequest(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    token,
    body: payload,
  })

import { apiRequest } from './client'

export const fetchProjects = (token) => apiRequest('/api/projects', { token })

export const createProject = (token, payload) =>
  apiRequest('/api/projects', { method: 'POST', token, body: payload })

export const createProjectTask = (token, projectId, payload) =>
  apiRequest(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    token,
    body: payload,
  })

export const updateProject = (token, projectId, payload) =>
  apiRequest(`/api/projects/${projectId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })

export const deleteProject = (token, projectId) =>
  apiRequest(`/api/projects/${projectId}`, {
    method: 'DELETE',
    token,
  })

export const addProjectMember = (token, projectId, memberId) =>
  apiRequest(`/api/projects/${projectId}/members`, {
    method: 'POST',
    token,
    body: { memberId },
  })

export const removeProjectMember = (token, projectId, memberId) =>
  apiRequest(`/api/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
    token,
  })

export const fetchProject = (token, projectId) =>
  apiRequest(`/api/projects/${projectId}`, { token })

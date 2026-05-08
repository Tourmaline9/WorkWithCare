import { apiRequest } from './client'

export const signup = (payload) =>
  apiRequest('/api/auth/signup', { method: 'POST', body: payload })

export const login = (payload) =>
  apiRequest('/api/auth/login', { method: 'POST', body: payload })

export const fetchMe = (token) => apiRequest('/api/me', { token })

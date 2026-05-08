import { apiRequest } from './client'

export const fetchUsers = (token) => apiRequest('/api/users', { token })

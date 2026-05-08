import { apiRequest } from './client'

export const fetchDashboard = (token) => apiRequest('/api/dashboard', { token })

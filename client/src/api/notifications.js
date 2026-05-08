import { apiRequest } from './client'

export const fetchNotifications = (token, { unread } = {}) => {
  const params = new URLSearchParams()
  if (unread !== undefined) {
    params.set('unread', unread)
  }
  const query = params.toString()
  return apiRequest(`/api/notifications${query ? `?${query}` : ''}`, { token })
}

export const markNotificationRead = (token, notificationId) =>
  apiRequest(`/api/notifications/${notificationId}`, {
    method: 'PATCH',
    token,
  })

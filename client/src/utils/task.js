export const isTaskOverdue = (dueDate, status, now = Date.now()) => {
  if (!dueDate || status === 'DONE') return false
  const date = new Date(dueDate)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < now
}

const parseDueDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid due date')
  }
  return date
}

module.exports = { parseDueDate }

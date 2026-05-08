const notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' })
}

const errorHandler = (err, req, res, next) => {
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Duplicate record' })
  }
  console.error(err)
  return res.status(500).json({ message: 'Server error' })
}

module.exports = { notFound, errorHandler }

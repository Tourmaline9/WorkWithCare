const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { CLIENT_ORIGINS } = require('./config/env')
const { apiLimiter } = require('./middleware/rateLimit')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./routes/auth.routes')
const meRoutes = require('./routes/me.routes')
const userRoutes = require('./routes/users.routes')
const projectRoutes = require('./routes/projects.routes')
const taskRoutes = require('./routes/tasks.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const notificationRoutes = require('./routes/notifications.routes')
const timeEntryRoutes = require('./routes/timeEntries.routes')

const app = express()

app.use(
  cors({
    origin: CLIENT_ORIGINS,
  })
)
app.use(express.json())
app.use(morgan('dev'))

app.use('/api', apiLimiter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api', meRoutes)
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/time-entries', timeEntryRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app

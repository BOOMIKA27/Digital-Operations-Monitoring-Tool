require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const connectDB = require('./config/db')
const errorHandler = require('./middleware/error')
const authRoutes = require('./routes/auth')
const systemRoutes = require('./routes/systems')
const { alertRouter, userRouter, logRouter, ruleRouter, analyticsRouter } = require('./routes/index')

connectDB()

const app = express()

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many requests' } }))
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/systems', systemRoutes)
app.use('/api/alerts', alertRouter)
app.use('/api/users', userRouter)
app.use('/api/logs', logRouter)
app.use('/api/alert-rules', ruleRouter)
app.use('/api/analytics', analyticsRouter)

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'DOMT API running', time: new Date() }))

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }))

// Error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 DOMT API server running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
})

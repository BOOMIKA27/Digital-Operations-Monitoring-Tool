const express = require('express')
const { protect, admin } = require('../middleware/auth')
const { getAlerts, acknowledgeAlert, resolveAlert, deleteAlert } = require('../controllers/alertController')
const { getUsers, createUser, updateUser, deleteUser, getLogs, getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, getAnalytics } = require('../controllers/adminController')

// Alerts
const alertRouter = express.Router()
alertRouter.get('/', protect, getAlerts)
alertRouter.put('/:id/acknowledge', protect, acknowledgeAlert)
alertRouter.put('/:id/resolve', protect, resolveAlert)
alertRouter.delete('/:id', protect, admin, deleteAlert)

// Users (admin only)
const userRouter = express.Router()
userRouter.get('/', protect, admin, getUsers)
userRouter.post('/', protect, admin, createUser)
userRouter.put('/:id', protect, admin, updateUser)
userRouter.delete('/:id', protect, admin, deleteUser)

// Logs
const logRouter = express.Router()
logRouter.get('/', protect, getLogs)

// Alert Rules (admin only)
const ruleRouter = express.Router()
ruleRouter.get('/', protect, getAlertRules)
ruleRouter.post('/', protect, admin, createAlertRule)
ruleRouter.put('/:id', protect, admin, updateAlertRule)
ruleRouter.delete('/:id', protect, admin, deleteAlertRule)

// Analytics
const analyticsRouter = express.Router()
analyticsRouter.get('/', protect, getAnalytics)

module.exports = { alertRouter, userRouter, logRouter, ruleRouter, analyticsRouter }

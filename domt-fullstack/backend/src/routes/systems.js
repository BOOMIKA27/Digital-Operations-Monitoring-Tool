const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/auth')
const {
  getSystems, getSystem, createSystem, updateSystem, deleteSystem,
  getSystemMetrics, agentHeartbeat, getDashboardStats
} = require('../controllers/systemController')

router.get('/stats/dashboard', protect, getDashboardStats)
router.post('/heartbeat', agentHeartbeat) // No auth - called by agent
router.route('/').get(protect, getSystems).post(protect, createSystem)
router.route('/:id').get(protect, getSystem).put(protect, updateSystem).delete(protect, admin, deleteSystem)
router.get('/:id/metrics', protect, getSystemMetrics)

module.exports = router

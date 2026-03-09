const crypto = require('crypto')
const System = require('../models/System')
const Alert = require('../models/Alert')
const Metric = require('../models/Metric')
const Log = require('../models/Log')
const AlertRule = require('../models/AlertRule')

exports.getSystems = async (req, res, next) => {
  try {
    const systems = await System.find().populate('addedBy', 'name email')
    res.json({ success: true, count: systems.length, data: systems })
  } catch (err) { next(err) }
}

exports.getSystem = async (req, res, next) => {
  try {
    const system = await System.findById(req.params.id).populate('addedBy', 'name email')
    if (!system) return res.status(404).json({ success: false, message: 'System not found' })
    res.json({ success: true, data: system })
  } catch (err) { next(err) }
}

exports.createSystem = async (req, res, next) => {
  try {
    const agentKey = 'agt_' + crypto.randomBytes(16).toString('hex')
    const system = await System.create({ ...req.body, agentKey, addedBy: req.user._id })
    await Log.create({ type: 'user', level: 'info', source: 'Admin', message: `System added: ${system.name}`, userId: req.user._id, systemId: system._id })
    res.status(201).json({ success: true, data: system })
  } catch (err) { next(err) }
}

exports.updateSystem = async (req, res, next) => {
  try {
    const system = await System.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!system) return res.status(404).json({ success: false, message: 'System not found' })
    res.json({ success: true, data: system })
  } catch (err) { next(err) }
}

exports.deleteSystem = async (req, res, next) => {
  try {
    const system = await System.findById(req.params.id)
    if (!system) return res.status(404).json({ success: false, message: 'System not found' })
    await Log.create({ type: 'user', level: 'info', source: 'Admin', message: `System removed: ${system.name}`, userId: req.user._id })
    await system.deleteOne()
    res.json({ success: true, message: 'System removed' })
  } catch (err) { next(err) }
}

exports.getSystemMetrics = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const metrics = await Metric.find({ system: req.params.id, timestamp: { $gte: since } }).sort({ timestamp: 1 }).limit(500)
    res.json({ success: true, data: metrics })
  } catch (err) { next(err) }
}

// Agent heartbeat endpoint — called by the monitoring agent
exports.agentHeartbeat = async (req, res, next) => {
  try {
    const { agentKey, metrics, uptime, processes } = req.body
    const system = await System.findOne({ agentKey })
    if (!system) return res.status(404).json({ success: false, message: 'Unknown agent key' })

    // Determine status from metrics
    let status = 'online'
    if (metrics.cpu > 85 || metrics.memory > 90) status = 'warning'

    system.metrics = metrics
    system.status = status
    system.uptime = uptime || system.uptime
    system.lastHeartbeat = new Date()
    await system.save()

    // Save time-series metric point
    await Metric.create({ system: system._id, ...metrics, timestamp: new Date() })

    // Check alert rules
    const rules = await AlertRule.find({ enabled: true })
    for (const rule of rules) {
      const metricVal = metrics[rule.metric.toLowerCase()]
      if (metricVal === undefined) continue
      const triggered =
        (rule.operator === '>' && metricVal > rule.threshold) ||
        (rule.operator === '>=' && metricVal >= rule.threshold) ||
        (rule.operator === '<' && metricVal < rule.threshold) ||
        (rule.operator === '<=' && metricVal <= rule.threshold)

      if (triggered) {
        const existing = await Alert.findOne({ system: system._id, type: `High ${rule.metric}`, status: { $in: ['active', 'acknowledged'] } })
        if (!existing) {
          await Alert.create({
            system: system._id,
            systemName: system.name,
            type: `High ${rule.metric}`,
            message: `${rule.metric} at ${metricVal.toFixed(1)}% — threshold ${rule.operator} ${rule.threshold}%`,
            severity: rule.severity,
          })
        }
      }
    }

    res.json({ success: true, message: 'Heartbeat received' })
  } catch (err) { next(err) }
}

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [systems, alerts] = await Promise.all([
      System.find(),
      Alert.find({ status: 'active' }),
    ])
    const stats = {
      total: systems.length,
      online: systems.filter(s => s.status === 'online').length,
      offline: systems.filter(s => s.status === 'offline').length,
      warning: systems.filter(s => s.status === 'warning').length,
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      avgCPU: systems.length ? (systems.reduce((s, x) => s + (x.metrics?.cpu || 0), 0) / systems.length).toFixed(1) : 0,
      avgMemory: systems.length ? (systems.reduce((s, x) => s + (x.metrics?.memory || 0), 0) / systems.length).toFixed(1) : 0,
    }
    res.json({ success: true, data: stats })
  } catch (err) { next(err) }
}

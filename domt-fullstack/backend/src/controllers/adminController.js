const User = require('../models/User')
const Log = require('../models/Log')
const AlertRule = require('../models/AlertRule')
const Metric = require('../models/Metric')
const Alert = require('../models/Alert')

// ─── Users ────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    res.json({ success: true, data: users })
  } catch (err) { next(err) }
}

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body)
    await Log.create({ type: 'user', level: 'info', source: 'Admin', message: `User created: ${user.email}`, userId: req.user._id })
    const u = user.toObject(); delete u.password
    res.status(201).json({ success: true, data: u })
  } catch (err) { next(err) }
}

exports.updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body }
    delete updates.password // use changePassword for that
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' })
    }
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    await Log.create({ type: 'user', level: 'info', source: 'Admin', message: `User deleted: ${user.email}`, userId: req.user._id })
    res.json({ success: true, message: 'User deleted' })
  } catch (err) { next(err) }
}

// ─── Logs ────────────────────────────────────────────────
exports.getLogs = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.type) filter.type = req.query.type
    if (req.query.level) filter.level = req.query.level
    const logs = await Log.find(filter).sort({ createdAt: -1 }).limit(500).populate('userId', 'name email')
    res.json({ success: true, data: logs })
  } catch (err) { next(err) }
}

// ─── Alert Rules ─────────────────────────────────────────
exports.getAlertRules = async (req, res, next) => {
  try {
    const rules = await AlertRule.find().populate('createdBy', 'name')
    res.json({ success: true, data: rules })
  } catch (err) { next(err) }
}

exports.createAlertRule = async (req, res, next) => {
  try {
    const rule = await AlertRule.create({ ...req.body, createdBy: req.user._id })
    res.status(201).json({ success: true, data: rule })
  } catch (err) { next(err) }
}

exports.updateAlertRule = async (req, res, next) => {
  try {
    const rule = await AlertRule.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' })
    res.json({ success: true, data: rule })
  } catch (err) { next(err) }
}

exports.deleteAlertRule = async (req, res, next) => {
  try {
    await AlertRule.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Rule deleted' })
  } catch (err) { next(err) }
}

// ─── Analytics ───────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Daily aggregated metrics (average per day)
    const dailyMetrics = await Metric.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avgCPU: { $avg: '$cpu' },
          avgMemory: { $avg: '$memory' },
          avgNetwork: { $avg: '$network' },
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Daily alert counts
    const dailyAlerts = await Alert.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, data: { dailyMetrics, dailyAlerts } })
  } catch (err) { next(err) }
}

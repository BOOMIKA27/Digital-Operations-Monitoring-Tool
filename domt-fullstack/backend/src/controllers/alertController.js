const Alert = require('../models/Alert')
const Log = require('../models/Log')

exports.getAlerts = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.severity) filter.severity = req.query.severity
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(200).populate('acknowledgedBy resolvedBy', 'name')
    res.json({ success: true, count: alerts.length, data: alerts })
  } catch (err) { next(err) }
}

exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id,
      { status: 'acknowledged', acknowledgedBy: req.user._id, acknowledgedAt: new Date() },
      { new: true }
    )
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' })
    await Log.create({ type: 'alert', level: 'info', source: 'Admin', message: `Alert acknowledged: ${alert.type} on ${alert.systemName}`, userId: req.user._id })
    res.json({ success: true, data: alert })
  } catch (err) { next(err) }
}

exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id,
      { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    )
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' })
    await Log.create({ type: 'alert', level: 'info', source: 'Admin', message: `Alert resolved: ${alert.type} on ${alert.systemName}`, userId: req.user._id })
    res.json({ success: true, data: alert })
  } catch (err) { next(err) }
}

exports.deleteAlert = async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Alert deleted' })
  } catch (err) { next(err) }
}

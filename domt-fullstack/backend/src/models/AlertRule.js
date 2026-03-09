const mongoose = require('mongoose')

const alertRuleSchema = new mongoose.Schema({
  metric: { type: String, required: true, enum: ['CPU', 'Memory', 'Disk', 'Network', 'Uptime'] },
  operator: { type: String, required: true, enum: ['>', '<', '>=', '<='] },
  threshold: { type: Number, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  enabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('AlertRule', alertRuleSchema)

const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema({
  system: { type: mongoose.Schema.Types.ObjectId, ref: 'System', required: true },
  systemName: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  status: { type: String, enum: ['active', 'acknowledged', 'resolved'], default: 'active' },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acknowledgedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Alert', alertSchema)

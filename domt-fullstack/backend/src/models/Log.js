const mongoose = require('mongoose')

const logSchema = new mongoose.Schema({
  type: { type: String, enum: ['system', 'auth', 'user', 'alert'], default: 'system' },
  level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
  source: { type: String, required: true },
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  systemId: { type: mongoose.Schema.Types.ObjectId, ref: 'System', default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

// Auto-delete logs older than 90 days
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

module.exports = mongoose.model('Log', logSchema)

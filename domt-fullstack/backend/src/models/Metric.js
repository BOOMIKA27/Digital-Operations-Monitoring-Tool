const mongoose = require('mongoose')

const metricSchema = new mongoose.Schema({
  system: { type: mongoose.Schema.Types.ObjectId, ref: 'System', required: true },
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  disk: { type: Number, default: 0 },
  network: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false })

// Keep metrics for 7 days
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 })
metricSchema.index({ system: 1, timestamp: -1 })

module.exports = mongoose.model('Metric', metricSchema)

const mongoose = require('mongoose')

const systemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  ip: { type: String, required: true },
  os: { type: String, required: true },
  type: { type: String, default: 'Server' },
  location: { type: String, default: 'Unknown' },
  agentKey: { type: String, required: true, unique: true },
  status: { type: String, enum: ['online', 'offline', 'warning'], default: 'offline' },
  metrics: {
    cpu: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    disk: { type: Number, default: 0 },
    network: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
  },
  uptime: { type: String, default: '0' },
  lastHeartbeat: { type: Date, default: null },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('System', systemSchema)

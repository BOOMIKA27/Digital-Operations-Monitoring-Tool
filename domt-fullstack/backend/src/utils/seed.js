require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const User = require('../models/User')
const System = require('../models/System')
const Alert = require('../models/Alert')
const AlertRule = require('../models/AlertRule')
const Log = require('../models/Log')
const Metric = require('../models/Metric')

const connectDB = require('../config/db')

const seed = async () => {
  await connectDB()
  console.log('🌱 Seeding database...')

  // Clear existing
  await Promise.all([User.deleteMany(), System.deleteMany(), Alert.deleteMany(), AlertRule.deleteMany(), Log.deleteMany(), Metric.deleteMany()])

  // Create users
  const admin = await User.create({ name: 'Admin User', email: 'admin@domt.io', password: 'admin123', role: 'admin' })
  const operator = await User.create({ name: 'John Operator', email: 'john@domt.io', password: 'user123', role: 'user' })
  console.log('✅ Users created')

  // Create systems
  const systems = await System.create([
    { name: 'PROD-WEB-01', ip: '192.168.1.10', os: 'Ubuntu 22.04', type: 'Web Server', location: 'US-East', agentKey: 'agt_' + crypto.randomBytes(8).toString('hex'), status: 'online', metrics: { cpu: 67, memory: 72, disk: 45, network: 120, temperature: 62 }, uptime: '14d 6h', lastHeartbeat: new Date(), addedBy: admin._id },
    { name: 'PROD-DB-01', ip: '192.168.1.20', os: 'CentOS 8', type: 'Database', location: 'US-East', agentKey: 'agt_' + crypto.randomBytes(8).toString('hex'), status: 'online', metrics: { cpu: 34, memory: 88, disk: 78, network: 45, temperature: 55 }, uptime: '30d 2h', lastHeartbeat: new Date(), addedBy: admin._id },
    { name: 'PROD-API-01', ip: '192.168.1.30', os: 'Debian 11', type: 'API Server', location: 'EU-West', agentKey: 'agt_' + crypto.randomBytes(8).toString('hex'), status: 'warning', metrics: { cpu: 85, memory: 91, disk: 32, network: 210, temperature: 75 }, uptime: '7d 14h', lastHeartbeat: new Date(Date.now() - 2 * 60 * 60 * 1000), addedBy: admin._id },
    { name: 'DEV-APP-01', ip: '10.0.0.10', os: 'Ubuntu 20.04', type: 'App Server', location: 'US-West', agentKey: 'agt_' + crypto.randomBytes(8).toString('hex'), status: 'offline', metrics: { cpu: 0, memory: 0, disk: 55, network: 0, temperature: 0 }, uptime: '0', lastHeartbeat: new Date(Date.now() - 5 * 60 * 60 * 1000), addedBy: admin._id },
    { name: 'STAGING-01', ip: '10.0.0.20', os: 'Windows Server 2022', type: 'Staging', location: 'US-East', agentKey: 'agt_' + crypto.randomBytes(8).toString('hex'), status: 'online', metrics: { cpu: 22, memory: 48, disk: 60, network: 30, temperature: 48 }, uptime: '5d 3h', lastHeartbeat: new Date(), addedBy: admin._id },
    { name: 'PROD-CACHE-01', ip: '192.168.1.40', os: 'Alpine Linux', type: 'Cache', location: 'EU-Central', agentKey: 'agt_' + crypto.randomBytes(8).toString('hex'), status: 'online', metrics: { cpu: 15, memory: 62, disk: 28, network: 340, temperature: 50 }, uptime: '60d 11h', lastHeartbeat: new Date(), addedBy: admin._id },
  ])
  console.log('✅ Systems created')

  // Generate historical metrics
  const now = Date.now()
  const metricDocs = []
  for (const sys of systems) {
    for (let i = 0; i < 48; i++) {
      metricDocs.push({
        system: sys._id,
        cpu: Math.max(0, (sys.metrics.cpu || 30) + (Math.random() - 0.5) * 20),
        memory: Math.max(0, (sys.metrics.memory || 50) + (Math.random() - 0.5) * 15),
        disk: Math.max(0, (sys.metrics.disk || 40) + (Math.random() - 0.5) * 5),
        network: Math.max(0, (sys.metrics.network || 50) + (Math.random() - 0.5) * 40),
        timestamp: new Date(now - (48 - i) * 30 * 60 * 1000), // every 30 min
      })
    }
  }
  await Metric.insertMany(metricDocs)
  console.log('✅ Metrics seeded')

  // Create alerts
  await Alert.create([
    { system: systems[2]._id, systemName: 'PROD-API-01', type: 'High CPU', message: 'CPU usage at 85% — threshold > 80%', severity: 'critical', status: 'active', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    { system: systems[2]._id, systemName: 'PROD-API-01', type: 'High Memory', message: 'Memory at 91% — critical threshold exceeded', severity: 'critical', status: 'active', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { system: systems[3]._id, systemName: 'DEV-APP-01', type: 'System Down', message: 'No heartbeat received for over 5 hours', severity: 'critical', status: 'acknowledged', acknowledgedBy: admin._id, acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { system: systems[1]._id, systemName: 'PROD-DB-01', type: 'High Disk', message: 'Disk at 78% — approaching warning threshold', severity: 'warning', status: 'active', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { system: systems[0]._id, systemName: 'PROD-WEB-01', type: 'High Network', message: 'Network traffic spike: 120 MB/s', severity: 'info', status: 'resolved', resolvedBy: admin._id, resolvedAt: new Date(), createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  ])
  console.log('✅ Alerts created')

  // Create alert rules
  await AlertRule.create([
    { metric: 'CPU', operator: '>', threshold: 80, severity: 'critical', enabled: true, createdBy: admin._id },
    { metric: 'Memory', operator: '>', threshold: 90, severity: 'critical', enabled: true, createdBy: admin._id },
    { metric: 'Disk', operator: '>', threshold: 85, severity: 'warning', enabled: true, createdBy: admin._id },
    { metric: 'Network', operator: '>', threshold: 500, severity: 'warning', enabled: true, createdBy: admin._id },
  ])
  console.log('✅ Alert rules created')

  // Create logs
  await Log.create([
    { type: 'system', level: 'error', source: 'PROD-API-01', message: 'Out of memory error in thread pool', systemId: systems[2]._id, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    { type: 'auth', level: 'info', source: 'Auth', message: `User admin@domt.io logged in`, userId: admin._id, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { type: 'system', level: 'warning', source: 'PROD-DB-01', message: 'Slow query detected: 12s execution time', systemId: systems[1]._id, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { type: 'user', level: 'info', source: 'Admin', message: `System PROD-WEB-01 added`, userId: admin._id, systemId: systems[0]._id, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { type: 'auth', level: 'warning', source: 'Auth', message: 'Failed login attempt for unknown@example.com', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { type: 'auth', level: 'info', source: 'Auth', message: 'User john@domt.io logged in', userId: operator._id, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  ])
  console.log('✅ Logs created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin: admin@domt.io / admin123')
  console.log('   User:  john@domt.io / user123')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })

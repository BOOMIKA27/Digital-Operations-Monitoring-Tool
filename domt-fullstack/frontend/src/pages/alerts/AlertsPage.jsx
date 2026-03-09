import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { alertsAPI } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { formatDistanceToNow } from 'date-fns'

export default function AlertsPage() {
  const { data, loading, refetch } = useApi(() => alertsAPI.getAll())
  const [filter, setFilter] = useState('all')
  const [severity, setSeverity] = useState('all')

  const allAlerts = data?.data || []
  const filtered = allAlerts.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter
    const matchSeverity = severity === 'all' || a.severity === severity
    return matchStatus && matchSeverity
  })

  const handleAcknowledge = async (id) => {
    try { await alertsAPI.acknowledge(id); refetch() } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }
  const handleResolve = async (id) => {
    try { await alertsAPI.resolve(id); refetch() } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const counts = {
    critical: allAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    warning: allAlerts.filter(a => a.severity === 'warning' && a.status === 'active').length,
    active: allAlerts.filter(a => a.status === 'active').length,
    resolved: allAlerts.filter(a => a.status === 'resolved').length,
  }

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Alerts & Notifications</h1>
          <p className="page-subtitle">{counts.active} active · {counts.critical} critical</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[{ label: 'Critical', val: counts.critical, color: 'var(--red)' }, { label: 'Warning', val: counts.warning, color: 'var(--yellow)' }, { label: 'Active', val: counts.active, color: 'var(--accent)' }, { label: 'Resolved', val: counts.resolved, color: 'var(--green)' }].map(item => (
          <div key={item.label} className="card" style={{ padding: '14px 20px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {['all', 'active', 'acknowledged', 'resolved'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <select className="select" style={{ width: 'auto' }} value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading alerts...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(alert => (
          <div key={alert._id} className="card" style={{ borderLeft: `4px solid ${alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--yellow)' : 'var(--accent)'}`, opacity: alert.status === 'resolved' ? 0.65 : 1 }}>
            <div className="flex-between">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                <AlertTriangle size={16} color={alert.severity === 'critical' ? 'var(--red)' : 'var(--yellow)'} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{alert.type}</span>
                    <span className={`badge badge-${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'yellow' : 'blue'}`}>{alert.severity}</span>
                    {alert.status === 'resolved' && <span className="badge badge-green">resolved</span>}
                    {alert.status === 'acknowledged' && <span className="badge badge-gray">acknowledged</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{alert.message}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>{alert.systemName}</span>
                    <span>· {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                    {alert.acknowledgedBy && <span>· Acknowledged by {alert.acknowledgedBy.name}</span>}
                  </div>
                </div>
              </div>
              {alert.status === 'active' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAcknowledge(alert._id)}><Clock size={13} /> Acknowledge</button>
                  <button className="btn btn-sm" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }} onClick={() => handleResolve(alert._id)}><CheckCircle size={13} /> Resolve</button>
                </div>
              )}
              {alert.status === 'acknowledged' && (
                <button className="btn btn-sm" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)', flexShrink: 0 }} onClick={() => handleResolve(alert._id)}><CheckCircle size={13} /> Resolve</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.3, color: 'var(--green)' }} />
            <div style={{ fontWeight: 600 }}>No alerts match this filter</div>
          </div>
        )}
      </div>
    </div>
  )
}

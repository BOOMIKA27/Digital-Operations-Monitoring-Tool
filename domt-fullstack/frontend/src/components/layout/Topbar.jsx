import React, { useState } from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function Topbar({ title, alerts = [] }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const activeAlerts = alerts.filter(a => a.status === 'active')

  return (
    <header style={{ height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 90 }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        {format(new Date(), 'EEE dd MMM · HH:mm')}
      </div>
      <div style={{ position: 'relative' }}>
        <button className="btn-ghost btn btn-icon" onClick={() => setShowNotif(!showNotif)} style={{ position: 'relative' }}>
          <Bell size={15} />
          {activeAlerts.length > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg-secondary)' }} />
          )}
        </button>
        {showNotif && (
          <div style={{ position: 'absolute', right: 0, top: 44, width: 320, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', zIndex: 200, animation: 'fade-in 0.2s ease' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
              <span className="badge badge-red">{activeAlerts.length} active</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {activeAlerts.slice(0, 6).map(alert => (
                <div key={alert._id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(30,45,69,0.4)', cursor: 'pointer' }} onClick={() => { navigate('/alerts'); setShowNotif(false) }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div className={`dot dot-${alert.severity === 'critical' ? 'red' : 'yellow'}`} style={{ marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{alert.type} — {alert.systemName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{alert.message}</div>
                    </div>
                  </div>
                </div>
              ))}
              {activeAlerts.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No active alerts</div>}
            </div>
            <div style={{ padding: '10px 16px' }}>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { navigate('/alerts'); setShowNotif(false) }}>View all alerts</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#080c14', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
        {user?.avatar}
      </div>
    </header>
  )
}

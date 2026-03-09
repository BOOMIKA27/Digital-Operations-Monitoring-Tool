import React from 'react'

export default function StatCard({ title, value, sub, icon: Icon, color = 'accent', trend, progress }) {
  const colors = {
    accent: 'var(--accent)',
    green: 'var(--green)',
    yellow: 'var(--yellow)',
    red: 'var(--red)',
    purple: 'var(--purple)',
  }
  const c = colors[color] || color
  const bgColors = {
    accent: 'rgba(0,212,255,0.08)',
    green: 'rgba(0,255,136,0.08)',
    yellow: 'rgba(255,204,0,0.08)',
    red: 'rgba(255,68,102,0.08)',
    purple: 'rgba(139,92,246,0.08)',
  }

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: bgColors[color] || 'rgba(0,212,255,0.05)', borderRadius: '0 12px 0 100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{title}</span>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: bgColors[color], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={c} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: c, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
      {progress !== undefined && (
        <div className="progress-bar" style={{ marginTop: 14 }}>
          <div className="progress-fill" style={{
            width: `${progress}%`,
            background: progress > 85 ? 'var(--red)' : progress > 70 ? 'var(--yellow)' : c
          }} />
        </div>
      )}
    </div>
  )
}

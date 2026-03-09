import React, { useState, useEffect } from 'react'
import { Cpu, Server, AlertTriangle, MemoryStick, Activity } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { systemsAPI, alertsAPI } from '../../services/api'
import { usePolling } from '../../hooks/useApi'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(1)}</div>)}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: statsData, loading: statsLoading } = usePolling(() => systemsAPI.getDashboardStats(), 15000)
  const { data: systemsData } = usePolling(() => systemsAPI.getAll(), 15000)
  const { data: alertsData } = usePolling(() => alertsAPI.getAll({ status: 'active' }), 15000)

  const stats = statsData?.data || {}
  const systems = systemsData?.data || []
  const alerts = alertsData?.data || []

  // Simulated chart data (in real app, fetch from /metrics endpoint aggregated)
  const [chartData, setChartData] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      cpu: 30 + Math.random() * 40,
      memory: 50 + Math.random() * 30,
      network: 40 + Math.random() * 60,
    }))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1]
        return [...prev.slice(1), {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          cpu: Math.min(99, Math.max(5, last.cpu + (Math.random() - 0.5) * 8)),
          memory: Math.min(99, Math.max(20, last.memory + (Math.random() - 0.5) * 5)),
          network: Math.max(0, last.network + (Math.random() - 0.5) * 20),
        }]
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--green)' }}>
          <span className="dot dot-green" style={{ width: 6, height: 6 }} />
          Live — connected to API
        </div>
      </div>

      <div className="grid-4 mb-24">
        <StatCard title="Avg CPU" value={`${stats.avgCPU || 0}%`} sub={`${stats.online || 0} systems active`} icon={Cpu} color={parseFloat(stats.avgCPU) > 80 ? 'red' : 'accent'} progress={parseFloat(stats.avgCPU) || 0} />
        <StatCard title="Avg Memory" value={`${stats.avgMemory || 0}%`} sub="Across active systems" icon={MemoryStick} color={parseFloat(stats.avgMemory) > 90 ? 'red' : 'green'} progress={parseFloat(stats.avgMemory) || 0} />
        <StatCard title="Active Alerts" value={stats.activeAlerts || 0} sub={`${stats.criticalAlerts || 0} critical`} icon={AlertTriangle} color={stats.activeAlerts > 3 ? 'red' : 'yellow'} />
        <StatCard title="Systems" value={`${stats.online || 0}/${stats.total || 0}`} sub={`${stats.offline || 0} offline · ${stats.warning || 0} warning`} icon={Server} color="green" />
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="flex-between mb-16">
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>System Metrics — Live</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CPU · Memory · Network</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)' }}>● LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/><stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.5)" />
              <XAxis dataKey="time" tick={{ fill: '#3d5070', fontSize: 10 }} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#3d5070', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cpu" name="cpu" stroke="#00d4ff" strokeWidth={1.5} fill="url(#gCpu)" dot={false} />
              <Area type="monotone" dataKey="memory" name="memory" stroke="#00ff88" strokeWidth={1.5} fill="url(#gMem)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontSize: 13, fontWeight: 700 }}>Recent Alerts</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 5).map(alert => (
              <div key={alert._id} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, borderLeft: `3px solid ${alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--yellow)' : 'var(--accent)'}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{alert.type}</span>
                    <span className={`badge badge-${alert.severity === 'critical' ? 'red' : 'yellow'}`}>{alert.severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{alert.systemName} · {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>✅ No active alerts</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-16">
          <div style={{ fontSize: 13, fontWeight: 700 }}>Systems Overview</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/systems')}>View all →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {systems.slice(0, 6).map(sys => (
            <div key={sys._id} onClick={() => navigate(`/systems/${sys._id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <span className={`dot dot-${sys.status === 'online' ? 'green' : sys.status === 'warning' ? 'yellow' : 'red'}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{sys.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sys.ip}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: sys.metrics?.cpu > 80 ? 'var(--red)' : 'var(--text-secondary)' }}>
                CPU {sys.metrics?.cpu || 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

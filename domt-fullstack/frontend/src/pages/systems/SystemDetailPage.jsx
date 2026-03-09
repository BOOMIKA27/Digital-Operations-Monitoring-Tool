import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { systemsAPI } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { ArrowLeft, Server } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { formatDistanceToNow, format } from 'date-fns'

export default function SystemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: sysData, loading: sysLoading } = useApi(() => systemsAPI.getOne(id), [id])
  const { data: metricsData } = useApi(() => systemsAPI.getMetrics(id, 6), [id])

  const system = sysData?.data
  const rawMetrics = metricsData?.data || []

  // Format metrics for chart
  const chartData = rawMetrics.map(m => ({
    time: format(new Date(m.timestamp), 'HH:mm'),
    cpu: parseFloat(m.cpu?.toFixed(1) || 0),
    memory: parseFloat(m.memory?.toFixed(1) || 0),
    network: parseFloat(m.network?.toFixed(1) || 0),
  }))

  if (sysLoading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div style={{ color: 'var(--text-secondary)' }}>Loading...</div></div>
  if (!system) return <div className="page"><div style={{ color: 'var(--red)' }}>System not found</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/systems')} style={{ marginBottom: 16, paddingLeft: 0 }}><ArrowLeft size={14} /> Back to Systems</button>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={22} color="var(--accent)" />
            </div>
            <div>
              <h1 className="page-title" style={{ fontFamily: 'var(--font-mono)' }}>{system.name}</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <span className={`badge badge-${system.status === 'online' ? 'green' : system.status === 'warning' ? 'yellow' : 'red'}`}>{system.status}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{system.ip} · {system.os}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last heartbeat</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{system.lastHeartbeat ? formatDistanceToNow(new Date(system.lastHeartbeat), { addSuffix: true }) : 'Never'}</div>
          </div>
        </div>
      </div>

      {/* Current metrics */}
      <div className="grid-4 mb-24">
        {[
          { label: 'CPU', value: system.metrics?.cpu || 0, color: (system.metrics?.cpu || 0) > 80 ? 'var(--red)' : 'var(--accent)' },
          { label: 'Memory', value: system.metrics?.memory || 0, color: (system.metrics?.memory || 0) > 90 ? 'var(--red)' : 'var(--green)' },
          { label: 'Disk', value: system.metrics?.disk || 0, color: (system.metrics?.disk || 0) > 80 ? 'var(--yellow)' : 'var(--accent)' },
          { label: 'Network', value: `${system.metrics?.network || 0}`, unit: 'MB/s', color: 'var(--purple)' },
        ].map(m => (
          <div key={m.label} className="card">
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>{m.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}{m.unit || '%'}</div>
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, m.value)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Historical chart */}
      <div className="card mb-24">
        <div className="flex-between mb-16">
          <div style={{ fontSize: 13, fontWeight: 700 }}>Historical Metrics — Last 6h</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            <span style={{ color: '#00d4ff' }}>▬ CPU</span>
            <span style={{ color: '#00ff88' }}>▬ Memory</span>
            <span style={{ color: '#8b5cf6' }}>▬ Network</span>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient>
                <linearGradient id="dMem" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/><stop offset="95%" stopColor="#00ff88" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.5)" />
              <XAxis dataKey="time" tick={{ fill: '#3d5070', fontSize: 10 }} />
              <YAxis tick={{ fill: '#3d5070', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
              <Area type="monotone" dataKey="cpu" stroke="#00d4ff" fill="url(#dCpu)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="memory" stroke="#00ff88" fill="url(#dMem)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No metrics data yet. Agent needs to send heartbeats.</div>
        )}
      </div>

      {/* System info */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>System Information</div>
        <div className="grid-2">
          {[
            { label: 'Agent Key', value: system.agentKey },
            { label: 'OS', value: system.os },
            { label: 'Location', value: system.location },
            { label: 'Type', value: system.type },
            { label: 'Uptime', value: system.uptime },
            { label: 'Added By', value: system.addedBy?.name || 'Unknown' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

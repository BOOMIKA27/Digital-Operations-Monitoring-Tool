import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, Plus, Search, Trash2, Eye } from 'lucide-react'
import { systemsAPI } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { formatDistanceToNow } from 'date-fns'

export default function SystemsPage() {
  const { data, loading, error, refetch } = useApi(() => systemsAPI.getAll())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const systems = data?.data || []
  const filtered = systems.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.ip.includes(search) || s.os.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.status === filter
    return matchSearch && matchFilter
  })

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from monitoring?`)) return
    try {
      await systemsAPI.delete(id)
      refetch()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete')
    }
  }

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div style={{ color: 'var(--text-secondary)' }}>Loading systems...</div></div>

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Systems & Devices</h1>
          <p className="page-subtitle">{systems.length} registered · {systems.filter(s => s.status === 'online').length} online</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/add-system')}><Plus size={15} /> Add System</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[{ label: 'Online', status: 'online', dotClass: 'dot-green' }, { label: 'Warning', status: 'warning', dotClass: 'dot-yellow' }, { label: 'Offline', status: 'offline', dotClass: 'dot-red' }].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: filter === item.status ? 'var(--bg-card-hover)' : 'var(--bg-card)', border: `1px solid ${filter === item.status ? 'var(--border-bright)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer' }} onClick={() => setFilter(filter === item.status ? 'all' : item.status)}>
            <span className={`dot ${item.dotClass}`} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{systems.filter(s => s.status === item.status).length}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search systems..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead><tr><th>System</th><th>Status</th><th>IP Address</th><th>OS</th><th>CPU</th><th>Memory</th><th>Disk</th><th>Last Heartbeat</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(sys => (
              <tr key={sys._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Server size={15} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{sys.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sys.type}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge badge-${sys.status === 'online' ? 'green' : sys.status === 'warning' ? 'yellow' : 'red'}`}><span className={`dot dot-${sys.status === 'online' ? 'green' : sys.status === 'warning' ? 'yellow' : 'red'}`} style={{ width: 6, height: 6 }} />{sys.status}</span></td>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{sys.ip}</code></td>
                <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sys.os}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 48 }}><div className="progress-fill" style={{ width: `${sys.metrics?.cpu || 0}%`, background: (sys.metrics?.cpu || 0) > 80 ? 'var(--red)' : 'var(--accent)' }} /></div>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{sys.metrics?.cpu || 0}%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 48 }}><div className="progress-fill" style={{ width: `${sys.metrics?.memory || 0}%`, background: (sys.metrics?.memory || 0) > 90 ? 'var(--red)' : 'var(--green)' }} /></div>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{sys.metrics?.memory || 0}%</span>
                  </div>
                </td>
                <td><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{sys.metrics?.disk || 0}%</span></td>
                <td><span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sys.lastHeartbeat ? formatDistanceToNow(new Date(sys.lastHeartbeat), { addSuffix: true }) : 'Never'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate(`/systems/${sys._id}`)}><Eye size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(sys._id, sys.name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <Server size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>No systems found</div>
          </div>
        )}
      </div>
    </div>
  )
}

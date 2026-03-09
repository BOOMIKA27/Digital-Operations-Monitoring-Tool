import React, { useState } from 'react'
import { logsAPI, analyticsAPI, usersAPI, rulesAPI, authAPI, systemsAPI } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { FileText, Search, Download, Plus, Trash2, Shield, ToggleLeft, ToggleRight, Save, Bell, Key, Eye, EyeOff, HelpCircle, ChevronRight, Server, CheckCircle, Lock, User, UserPlus, X, Check, TrendingUp, TrendingDown } from 'lucide-react'

// ─── Logs Page ────────────────────────────────────────────
export function LogsPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data, loading } = useApi(() => logsAPI.getAll({ type: typeFilter || undefined, level: levelFilter || undefined }), [typeFilter, levelFilter])
  const logs = (data?.data || []).filter(l => !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase()))

  const lvlColors = { error: 'red', warning: 'yellow', info: 'accent' }
  const typeColors = { system: 'accent', auth: 'purple', user: 'green', alert: 'yellow' }

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Logs & Activity</h1><p className="page-subtitle">{logs.length} entries shown</p></div>
        <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
      </div>
      <div className="card mb-16" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="system">System</option>
            <option value="auth">Auth</option>
            <option value="user">User</option>
            <option value="alert">Alert</option>
          </select>
          <select className="select" style={{ width: 'auto' }} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ fontFamily: 'var(--font-mono)' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading logs...</div>}
          {logs.map((log, i) => (
            <div key={log._id} style={{ display: 'flex', gap: 16, padding: '12px 20px', borderBottom: i < logs.length - 1 ? '1px solid rgba(30,45,69,0.4)' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 140 }}>{format(new Date(log.createdAt), 'MM/dd HH:mm:ss')}</span>
              <span className={`badge badge-${lvlColors[log.level] || 'gray'}`} style={{ flexShrink: 0 }}>{log.level}</span>
              <span className={`badge badge-${typeColors[log.type] || 'gray'}`} style={{ flexShrink: 0 }}>{log.type}</span>
              <span style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0, minWidth: 120 }}>[{log.source}]</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}><FileText size={32} style={{ marginBottom: 12, opacity: 0.3 }} /><div>No logs found</div></div>}
        </div>
      </div>
    </div>
  )
}

// ─── Analytics Page ───────────────────────────────────────
export function AnalyticsPage() {
  const [days, setDays] = useState(7)
  const { data, loading } = useApi(() => analyticsAPI.get(days), [days])
  const { dailyMetrics = [], dailyAlerts = [] } = data?.data || {}

  // Merge by date
  const merged = dailyMetrics.map(m => {
    const alerts = dailyAlerts.find(a => a._id === m._id)
    return { date: m._id.slice(5), avgCPU: parseFloat((m.avgCPU || 0).toFixed(1)), avgMemory: parseFloat((m.avgMemory || 0).toFixed(1)), alerts: alerts?.count || 0 }
  })

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Analytics & Reports</h1><p className="page-subtitle">Performance trends from real data</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{ padding: '7px 14px', background: days === d ? 'var(--accent)' : 'transparent', color: days === d ? '#080c14' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: days === d ? 700 : 400 }}>{d}d</button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading analytics...</div> : (
        <>
          <div className="grid-2 mb-24">
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>CPU & Memory Trends</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>Daily averages (real data)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={merged}>
                  <defs>
                    <linearGradient id="aC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient>
                    <linearGradient id="aM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/><stop offset="95%" stopColor="#00ff88" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.5)" />
                  <XAxis dataKey="date" tick={{ fill: '#3d5070', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#3d5070', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="avgCPU" name="CPU %" stroke="#00d4ff" fill="url(#aC)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="avgMemory" name="Memory %" stroke="#00ff88" fill="url(#aM)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Alerts per Day</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>Total alerts triggered</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={merged}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.5)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#3d5070', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#3d5070', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Bar dataKey="alerts" name="Alerts" fill="#ff4466" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {merged.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>No metric data for this period. Make sure agents are sending heartbeats.</div>}
        </>
      )}
    </div>
  )
}

// ─── Users Page ───────────────────────────────────────────
export function UsersPage() {
  const { data, loading, refetch } = useApi(() => usersAPI.getAll())
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' })
  const users = data?.data || []

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await usersAPI.delete(id); refetch() } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const handleToggleRole = async (id, currentRole) => {
    try { await usersAPI.update(id, { role: currentRole === 'admin' ? 'user' : 'admin' }); refetch() } catch (err) { alert('Failed') }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try { await usersAPI.create(newUser); setShowAdd(false); setNewUser({ name: '', email: '', password: '', role: 'user' }); refetch() } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">{users.length} registered users</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><UserPlus size={15} /> Add User</button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[{ label: 'Total', val: users.length, color: 'var(--accent)' }, { label: 'Admins', val: users.filter(u => u.role === 'admin').length, color: 'var(--purple)' }, { label: 'Operators', val: users.filter(u => u.role === 'user').length, color: 'var(--green)' }].map(item => (
          <div key={item.label} className="card" style={{ flex: 1, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: item.color }}>{item.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#080c14' }}>{u.avatar || u.name[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.email}</code></td>
                <td><span className={`badge badge-${u.role === 'admin' ? 'purple' : 'blue'}`}>{u.role}</span></td>
                <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.lastLogin ? formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true }) : 'Never'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleToggleRole(u._id, u.role)} title="Toggle role"><Shield size={13} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u._id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-title">Add New User</div>
            <form onSubmit={handleAdd}>
              <div className="input-group"><label className="input-label">Full Name</label><input className="input" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} required /></div>
              <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} required /></div>
              <div className="input-group"><label className="input-label">Password</label><input className="input" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required /></div>
              <div className="input-group"><label className="input-label">Role</label><select className="select" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}><option value="user">User</option><option value="admin">Admin</option></select></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Alert Config Page ────────────────────────────────────
export function AlertConfigPage() {
  const { data, refetch } = useApi(() => rulesAPI.getAll())
  const [showAdd, setShowAdd] = useState(false)
  const [newRule, setNewRule] = useState({ metric: 'CPU', operator: '>', threshold: 80, severity: 'warning' })
  const rules = data?.data || []

  const handleToggle = async (id, current) => {
    try { await rulesAPI.update(id, { enabled: !current }); refetch() } catch {}
  }
  const handleDelete = async (id) => {
    try { await rulesAPI.delete(id); refetch() } catch {}
  }
  const handleAdd = async (e) => {
    e.preventDefault()
    try { await rulesAPI.create({ ...newRule, threshold: parseInt(newRule.threshold) }); setShowAdd(false); refetch() } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Alert Configuration</h1><p className="page-subtitle">Define thresholds that trigger alerts</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Rule</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead><tr><th>Metric</th><th>Condition</th><th>Threshold</th><th>Severity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rules.map(r => (
              <tr key={r._id}>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.metric}</span></td>
                <td><code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{r.operator}</code></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.threshold}%</span></td>
                <td><span className={`badge badge-${r.severity === 'critical' ? 'red' : 'yellow'}`}>{r.severity}</span></td>
                <td>
                  <button onClick={() => handleToggle(r._id, r.enabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.enabled ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    {r.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {r.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td><button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(r._id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-title">New Alert Rule</div>
            <form onSubmit={handleAdd}>
              <div className="input-group"><label className="input-label">Metric</label><select className="select" value={newRule.metric} onChange={e => setNewRule(p => ({ ...p, metric: e.target.value }))}>{['CPU', 'Memory', 'Disk', 'Network'].map(m => <option key={m}>{m}</option>)}</select></div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Operator</label><select className="select" value={newRule.operator} onChange={e => setNewRule(p => ({ ...p, operator: e.target.value }))}><option value=">">&gt;</option><option value="<">&lt;</option><option value=">=">&gt;=</option></select></div>
                <div className="input-group"><label className="input-label">Threshold (%)</label><input className="input" type="number" min="1" max="99" value={newRule.threshold} onChange={e => setNewRule(p => ({ ...p, threshold: e.target.value }))} /></div>
              </div>
              <div className="input-group"><label className="input-label">Severity</label><select className="select" value={newRule.severity} onChange={e => setNewRule(p => ({ ...p, severity: e.target.value }))}><option value="warning">Warning</option><option value="critical">Critical</option></select></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────
export function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [apiKey] = useState('sk_domt_' + Math.random().toString(36).substr(2, 20))
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Settings</h1><p className="page-subtitle">Configure application preferences</p></div>
        <button className="btn btn-primary" onClick={save}>{saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save</>}</button>
      </div>
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}><Bell size={16} color="var(--accent)" /><span style={{ fontSize: 14, fontWeight: 700 }}>Notifications</span></div>
          <div className="input-group"><label className="input-label">Alert Email</label><input className="input" type="email" placeholder="alerts@company.com" /></div>
          <div className="input-group"><label className="input-label">Slack Webhook</label><input className="input" placeholder="https://hooks.slack.com/..." /></div>
          <div className="input-group"><label className="input-label">Agent Poll Interval (sec)</label><input className="input" type="number" defaultValue={30} /></div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}><Key size={16} color="var(--accent)" /><span style={{ fontSize: 14, fontWeight: 700 }}>API Key</span></div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Use this key to connect agents to the API.</p>
          <div className="input-group"><label className="input-label">API Key</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showKey ? 'text' : 'password'} value={apiKey} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: 12, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Help Page ────────────────────────────────────────────
export function HelpPage() {
  const [expanded, setExpanded] = useState(null)
  const topics = [
    { icon: Server, title: 'How to Add Systems', content: 'Navigate to Systems → Add System. Fill in the details and generate an Agent Key. Install the DOMT agent on the target machine using the provided key. It will appear online after the first heartbeat.' },
    { icon: Bell, title: 'Configuring Alerts', content: 'Go to Alert Config to set threshold rules like "CPU > 80%". Set severity and notification channels in Settings.' },
    { icon: HelpCircle, title: 'Troubleshooting', content: 'System offline: Check if the agent service is running (systemctl status domt-agent). Verify the IP and firewall allow outbound connections to port 5000.' },
  ]
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Help & Documentation</h1><p className="page-subtitle">Guides for DOMT administrators</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics.map((t, i) => (
          <div key={i} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
            <div className="flex-between">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><t.icon size={16} color="var(--accent)" /></div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</span>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ transform: expanded === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {expanded === i && <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{t.content}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────
export function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saved, setSaved] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      const { data } = await authAPI.updateProfile(form)
      updateUser(data.user)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) return setPwMsg('Passwords do not match')
    try {
      await authAPI.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPwMsg('Password updated!')
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) { setPwMsg(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">My Profile</h1></div>
      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#080c14' }}>{user?.avatar}</div>
              <div><div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name}</div><span className={`badge badge-${user?.role === 'admin' ? 'purple' : 'blue'}`}>{user?.role}</span></div>
            </div>
            <form onSubmit={saveProfile}>
              <div className="input-group"><label className="input-label">Full Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <button type="submit" className="btn btn-primary btn-sm">{saved ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> Save</>}</button>
            </form>
          </div>
          <div className="card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}><Lock size={16} color="var(--accent)" /><span style={{ fontSize: 14, fontWeight: 700 }}>Change Password</span></div>
            {pwMsg && <div className={`notification-banner notification-${pwMsg.includes('updated') ? 'success' : 'error'}`} style={{ marginBottom: 12 }}>{pwMsg}</div>}
            <form onSubmit={changePassword}>
              <div className="input-group"><label className="input-label">Current Password</label><input className="input" type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">New Password</label><input className="input" type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Confirm</label><input className="input" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} /></div>
              <button type="submit" className="btn btn-secondary btn-sm">Update Password</button>
            </form>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Account Info</div>
          {[{ label: 'Role', value: user?.role }, { label: 'Email', value: user?.email }, { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A' }].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
          <button className="btn btn-danger btn-sm" style={{ marginTop: 24 }} onClick={() => { logout(); navigate('/login') }}>Sign Out</button>
        </div>
      </div>
    </div>
  )
}

// ─── Add System Page ──────────────────────────────────────
export function AddSystemPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', ip: '', os: 'Ubuntu 22.04', type: 'Web Server', location: 'US-East', agentKey: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const genKey = () => setForm(p => ({ ...p, agentKey: 'agt_' + Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('') }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await systemsAPI.create(form)
      navigate('/systems')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add system')
    } finally { setLoading(false) }
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Add New System</h1><p className="page-subtitle">Connect a machine to DOMT monitoring</p></div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          {error && <div className="notification-banner notification-error" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="input-group"><label className="input-label">System Name</label><input className="input" value={form.name} onChange={set('name')} placeholder="PROD-WEB-03" required /></div>
            <div className="input-group"><label className="input-label">IP Address</label><input className="input" value={form.ip} onChange={set('ip')} placeholder="192.168.1.50" required /></div>
            <div className="input-group"><label className="input-label">OS Type</label><select className="select" value={form.os} onChange={set('os')}>{['Ubuntu 22.04', 'Ubuntu 20.04', 'Debian 11', 'CentOS 8', 'RHEL 9', 'Alpine Linux', 'Windows Server 2022'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">System Type</label><select className="select" value={form.type} onChange={set('type')}>{['Web Server', 'Database', 'API Server', 'Cache', 'Load Balancer', 'Staging'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="input-group"><label className="input-label">Location</label><input className="input" value={form.location} onChange={set('location')} placeholder="US-East" /></div>
            </div>
            <div className="input-group"><label className="input-label">Agent Key</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={form.agentKey} onChange={set('agentKey')} placeholder="Click Generate or enter manually" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={genKey} style={{ whiteSpace: 'nowrap' }}>Generate</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/systems')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add System'}</button>
            </div>
          </form>
        </div>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Agent Installation</div>
          {[
            { label: '1. Download agent', cmd: 'curl -sSL https://domt.io/install.sh -o install.sh' },
            { label: '2. Run installer', cmd: `sudo bash install.sh --key ${form.agentKey || 'YOUR_AGENT_KEY'} --server http://YOUR_SERVER:5000` },
            { label: '3. Verify', cmd: 'systemctl status domt-agent' },
          ].map(step => (
            <div key={step.label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.label}</div>
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)' }}>{step.cmd}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Real-Time Page ───────────────────────────────────────
export function RealtimePage() {
  const { data: sysData } = useApi(() => systemsAPI.getAll())
  const systems = sysData?.data || []
  const [selectedId, setSelectedId] = useState(null)
  const selectedSystem = systems.find(s => s._id === selectedId) || systems[0]

  const [live, setLive] = useState({ cpu: 0, memory: 0, network: 0, disk: 0 })
  const [history, setHistory] = useState([])

  React.useEffect(() => {
    if (!selectedSystem) return
    setLive({ cpu: selectedSystem.metrics?.cpu || 0, memory: selectedSystem.metrics?.memory || 0, network: selectedSystem.metrics?.network || 0, disk: selectedSystem.metrics?.disk || 0 })
    setHistory(Array.from({ length: 30 }, (_, i) => ({
      t: i,
      cpu: (selectedSystem.metrics?.cpu || 30) + (Math.random() - 0.5) * 20,
      memory: (selectedSystem.metrics?.memory || 50) + (Math.random() - 0.5) * 15,
    })))
  }, [selectedSystem?._id])

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLive(prev => ({
        cpu: Math.min(99, Math.max(1, prev.cpu + (Math.random() - 0.5) * 6)),
        memory: Math.min(99, Math.max(10, prev.memory + (Math.random() - 0.5) * 4)),
        network: Math.max(0, prev.network + (Math.random() - 0.5) * 10),
        disk: Math.min(99, Math.max(10, prev.disk + (Math.random() - 0.5) * 0.3)),
      }))
      setHistory(prev => [...prev.slice(1), { t: prev.length, cpu: live.cpu, memory: live.memory }])
    }, 1000)
    return () => clearInterval(interval)
  }, [live])

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Real-Time Monitor</h1><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}><span className="dot dot-green" style={{ width: 6, height: 6 }} /><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>1-second refresh</span></div></div>
        {systems.length > 0 && <select className="select" style={{ width: 'auto' }} value={selectedId || systems[0]?._id} onChange={e => setSelectedId(e.target.value)}>
          {systems.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>}
      </div>
      <div className="grid-4 mb-24">
        {[{ label: 'CPU', val: live.cpu, color: live.cpu > 80 ? '#ff4466' : '#00d4ff' }, { label: 'Memory', val: live.memory, color: live.memory > 90 ? '#ff4466' : '#00ff88' }, { label: 'Network', val: live.network, color: '#8b5cf6', unit: ' MB/s' }, { label: 'Disk', val: live.disk, color: '#00d4ff' }].map(m => (
          <div key={m.label} className="card">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>{m.label}</div>
            <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--font-mono)', color: m.color, letterSpacing: '-0.04em' }}>{m.val.toFixed(1)}{m.unit || '%'}</div>
            <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, m.val)}%`, background: m.color, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="flex-between mb-16">
          <div style={{ fontSize: 13, fontWeight: 700 }}>Live Feed — {selectedSystem?.name || 'No system selected'}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}><span style={{ color: '#00d4ff' }}>▬ CPU</span><span style={{ color: '#00ff88' }}>▬ Memory</span></div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="rC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient>
              <linearGradient id="rM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/><stop offset="95%" stopColor="#00ff88" stopOpacity={0}/></linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis tick={{ fill: '#3d5070', fontSize: 10 }} domain={[0, 100]} />
            <Area type="monotone" dataKey="cpu" stroke="#00d4ff" fill="url(#rC)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="memory" stroke="#00ff88" fill="url(#rM)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

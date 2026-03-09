import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Zap, Shield, Activity } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@domt.io')
  const [password, setPassword] = useState('admin123')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 40%, transparent 100%)' }} />
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,212,255,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#080c14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>DOMT</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Digital Operations Monitor</div>
          </div>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Full visibility.<br /><span style={{ color: 'var(--accent)' }}>Zero blindspots.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
          Monitor CPU, memory, network, and all your systems in real-time. Get alerted before issues become outages.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: Activity, label: 'Real-time system metrics', sub: 'CPU, memory, network, disk live feeds' },
            { icon: Shield, label: 'Intelligent alerting', sub: 'Configurable thresholds, severity levels' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, borderLeft: '1px solid var(--border)', background: 'rgba(13,20,32,0.8)', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fade-in 0.5s ease' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Access your monitoring dashboard</p>

          {error && <div className="notification-banner notification-error" style={{ marginBottom: 16 }}><Shield size={14} /> {error}</div>}

          <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent)' }}>Admin:</strong> admin@domt.io / admin123<br />
            <strong style={{ color: 'var(--accent)' }}>User:</strong> john@domt.io / user123<br />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Run <code>npm run seed</code> in backend first)</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 42 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

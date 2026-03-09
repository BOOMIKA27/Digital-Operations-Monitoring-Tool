import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, CheckCircle } from 'lucide-react'

function AuthShell({ title, sub, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ width: 420, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, position: 'relative', animation: 'fade-in 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#080c14" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800 }}>DOMT</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>{sub}</p>
        {children}
      </div>
    </div>
  )
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' })
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // In real app, would call API
    navigate('/login')
  }

  return (
    <AuthShell title="Create Account" sub="Join your monitoring team">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="John Doe" required />
        </div>
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" required />
        </div>
        <div className="input-group">
          <label className="input-label">Role</label>
          <select className="select" value={form.role} onChange={set('role')}>
            <option value="user">User (Operator)</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 42 }}>Create Account</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <AuthShell title="Forgot Password" sub="We'll send a reset link to your email">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle size={48} color="var(--green)" style={{ marginBottom: 16 }} />
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Reset link sent!</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Check your inbox at {email}</div>
          <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Back to login</Link>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 42 }}>Send Reset Link</button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>← Back to login</Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  return (
    <AuthShell title="Reset Password" sub="Choose a new secure password">
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle size={48} color="var(--green)" style={{ marginBottom: 16 }} />
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Password updated!</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>You can now sign in with your new password.</div>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 42 }}>Reset Password</button>
        </form>
      )}
    </AuthShell>
  )
}

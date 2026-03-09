import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Server, Bell, FileText, BarChart3,
  Users, Settings, HelpCircle, User, Activity, LogOut,
  ChevronLeft, ChevronRight, Shield, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Systems', icon: Server, path: '/systems' },
  { label: 'Real-Time', icon: Activity, path: '/realtime' },
  { label: 'Alerts', icon: Bell, path: '/alerts', badge: 'alerts' },
  { label: 'Logs', icon: FileText, path: '/logs' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
]

const ADMIN_ITEMS = [
  { label: 'Users', icon: Users, path: '/users' },
  { label: 'Alert Config', icon: Shield, path: '/alert-config' },
]

const BOTTOM_ITEMS = [
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'Help', icon: HelpCircle, path: '/help' },
  { label: 'Profile', icon: User, path: '/profile' },
]

export default function Sidebar({ alertCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      minWidth: collapsed ? 64 : 220,
      height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '20px 16px' : '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, animation: 'glow-pulse 3s infinite'
        }}>
          <Zap size={16} color="#080c14" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>DOMT</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Monitor v1.0</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px 8px', fontFamily: 'var(--font-mono)' }}>Monitoring</div>}
        {NAV_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 16px' : '9px 10px',
                borderRadius: 'var(--radius)', marginBottom: 2,
                background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer', position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
                {!collapsed && item.badge === 'alerts' && alertCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{alertCount}</span>
                )}
                {collapsed && item.badge === 'alerts' && alertCount > 0 && (
                  <div style={{ position: 'absolute', top: 6, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
                )}
              </div>
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '10px 8px' }} />
            {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px 8px', fontFamily: 'var(--font-mono)' }}>Admin</div>}
            {ADMIN_ITEMS.map(item => (
              <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '10px 16px' : '9px 10px',
                    borderRadius: 'var(--radius)', marginBottom: 2,
                    background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.15s', cursor: 'pointer',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}>
                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
                  </div>
                )}
              </NavLink>
            ))}
          </>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '10px 8px' }} />
        {BOTTOM_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 16px' : '9px 10px',
                borderRadius: 'var(--radius)', marginBottom: 2,
                background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '8px' : '8px 10px',
          borderRadius: 'var(--radius)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#080c14', flexShrink: 0
          }}>{user?.avatar}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, truncate: true, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }} title="Logout">
              <LogOut size={14} />
            </button>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          width: '100%', background: 'none', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '6px', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginTop: 6, transition: 'all 0.15s'
        }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}

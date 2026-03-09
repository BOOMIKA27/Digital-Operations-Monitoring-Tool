import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { usePolling } from '../../hooks/useApi'
import { alertsAPI } from '../../services/api'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/systems': 'Systems & Devices',
  '/realtime': 'Real-Time Monitor',
  '/alerts': 'Alerts & Notifications',
  '/logs': 'Logs & Activity',
  '/analytics': 'Analytics & Reports',
  '/users': 'User Management',
  '/alert-config': 'Alert Configuration',
  '/settings': 'Settings',
  '/help': 'Help & Documentation',
  '/profile': 'My Profile',
  '/add-system': 'Add New System',
}

export default function AppLayout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'DOMT'

  // Poll alerts every 30s for notification badge
  const { data: alertsData } = usePolling(() => alertsAPI.getAll({ status: 'active' }), 30000)
  const alerts = alertsData?.data || []
  const activeCount = alerts.filter(a => a.status === 'active').length

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar alertCount={activeCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title={title} alerts={alerts} />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

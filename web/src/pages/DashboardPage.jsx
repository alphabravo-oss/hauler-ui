import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge.jsx'

function Dashboard() {
  const [health, setHealth] = useState(null)
  const [capabilities, setCapabilities] = useState(null)

  useEffect(() => {
    fetch('/healthz')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'error' }))

    fetch('/api/hauler/capabilities')
      .then(res => res.json())
      .then(data => setCapabilities(data))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your hauler system</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">System Status</div>
        {health && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StatusBadge status={health.status === 'ok' ? 'succeeded' : 'failed'} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Backend: {health.status}
              </span>
            </div>
            {capabilities && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hauler CLI:</span>
                <code style={{ fontSize: '0.9rem', color: 'var(--accent-amber)' }}>
                  {capabilities.version.Full || 'Unknown'}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <NavLink to="/store" className="btn">View Store</NavLink>
          <NavLink to="/manifests" className="btn">Manage Manifests</NavLink>
          <NavLink to="/jobs" className="btn">Job History</NavLink>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Getting Started</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Welcome to Hauler UI. Use the navigation sidebar to manage your container store,
          create manifests, run hauls, and monitor background jobs.
        </p>
      </div>
    </div>
  )
}

export default Dashboard

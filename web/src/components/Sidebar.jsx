import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const navGroups = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard' },
        { path: '/hauls', label: 'Hauls' }
      ]
    },
    {
      title: 'Active Haul',
      items: [
        { path: '/store', label: 'Store Operations' },
        { path: '/store/contents', label: 'Store Contents' },
        { path: '/manifests', label: 'Manifests' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/publish', label: 'Publishing' },
        { path: '/serve', label: 'Serve' },
        { path: '/registry', label: 'Registry Login' }
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/jobs', label: 'Job History' },
        { path: '/settings', label: 'Settings' }
      ]
    }
  ]

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/hauler-logo.svg" alt="Hauler" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          {navGroups.map((group, i) => (
            <div key={i} className="sidebar-section">
              <div className="sidebar-section-title">{group.title}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="nav-link"
                  end
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-attribution">Hauler-UI built by <a href="https://alphabravo.io" target="_blank" rel="noopener noreferrer">AlphaBravo</a></div>
          <div className="sidebar-version">v0.1.0-alpha</div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

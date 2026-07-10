import { useState, useEffect } from 'react'

function Settings() {
  const [config, setConfig] = useState(null)
  const [settings, setSettings] = useState({
    logLevel: 'info',
    retries: '0',
    ignoreErrors: 'false',
    defaultPlatform: '',
    defaultKeyPath: '',
    tempDir: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch both config and settings on mount
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig({}))

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          logLevel: data.logLevel || 'info',
          retries: data.retries || '0',
          ignoreErrors: data.ignoreErrors || 'false',
          defaultPlatform: data.defaultPlatform || '',
          defaultKeyPath: data.defaultKeyPath || '',
          tempDir: data.tempDir || ''
        })
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!res.ok) {
        throw new Error('Failed to update settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Global hauler flags and defaults</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--accent-red)', marginBottom: '1rem' }}>
          <div className="card-title" style={{ color: 'var(--accent-red)' }}>Error</div>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="card" style={{ borderColor: 'var(--accent-green)', marginBottom: '1rem' }}>
          <div className="card-title" style={{ color: 'var(--accent-green)' }}>Success</div>
          <p style={{ color: 'var(--text-secondary)' }}>Settings updated successfully</p>
        </div>
      )}

      <div className="card">
        <div className="card-title">Global Settings</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
          These settings are applied to every hauler job execution. Values are stored in the database
          and can be overridden by environment variables.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Log Level
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (HAULER_LOG_LEVEL)
              </span>
            </label>
            <select
              className="form-select"
              value={settings.logLevel}
              onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
              disabled={loading}
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Controls the verbosity of hauler output. Default: info
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Retries
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (HAULER_RETRIES)
              </span>
            </label>
            <input
              className="form-input"
              type="number"
              min="0"
              max="10"
              value={settings.retries}
              onChange={(e) => setSettings({ ...settings, retries: e.target.value })}
              disabled={loading}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Number of times to retry failed operations. Default: 0
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Ignore Errors
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (HAULER_IGNORE_ERRORS)
              </span>
            </label>
            <select
              className="form-select"
              value={settings.ignoreErrors}
              onChange={(e) => setSettings({ ...settings, ignoreErrors: e.target.value })}
              disabled={loading}
            >
              <option value="false">False (stop on errors)</option>
              <option value="true">True (continue on errors)</option>
            </select>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Continue operations even when individual items fail. Default: false
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Default Platform
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (HAULER_DEFAULT_PLATFORM)
              </span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="linux/amd64 or linux/arm64"
              value={settings.defaultPlatform}
              onChange={(e) => setSettings({ ...settings, defaultPlatform: e.target.value })}
              disabled={loading}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Default platform for multi-platform operations (e.g., linux/amd64). Leave empty for auto-detection.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Default Key Path
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (HAULER_KEY_PATH)
              </span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="/path/to/cosign.key"
              value={settings.defaultKeyPath}
              onChange={(e) => setSettings({ ...settings, defaultKeyPath: e.target.value })}
              disabled={loading}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Default path to cosign private key for signature verification.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Temp Directory
              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (HAULER_TEMP_DIR)
              </span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="/data/tmp"
              value={settings.tempDir}
              onChange={(e) => setSettings({ ...settings, tempDir: e.target.value })}
              disabled={loading}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Directory for temporary files during operations. Default: /data/tmp
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {config && (
        <div className="card">
          <div className="card-title">System Paths</div>
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ width: '150px' }}>Hauls Directory</td>
                <td className="primary">
                  <code>{config.haulerDir ? `${config.haulerDir}/hauls` : '-'}</code>
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  one isolated store per haul
                </td>
              </tr>
              <tr>
                <td>Hauler Directory</td>
                <td className="primary">
                  <code>{config.haulerDir || '-'}</code>
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {config.haulerDirEnv || 'HAULER_DIR'}
                </td>
              </tr>
              <tr>
                <td>Database Path</td>
                <td className="primary">
                  <code>{config.databasePath || '-'}</code>
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {config.databasePathEnv || 'DATABASE_PATH'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ borderColor: 'var(--accent-amber-dim)' }}>
        <div className="card-title" style={{ color: 'var(--accent-amber)' }}>About Settings</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            Settings stored in the database are applied as defaults to every hauler job execution.
            These values can be overridden by setting the corresponding environment variable on the
            hauler-ui container.
          </p>
          <p>
            Environment variables take precedence over database settings. To reset a setting to its
            default value, clear the field and save.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings

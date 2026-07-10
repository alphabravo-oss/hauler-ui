import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Check, X, Loader } from 'lucide-react'
import StatusBadge from '../components/StatusBadge.jsx'

function JobDetail() {
  const location = useLocation()
  const jobId = location.pathname.split('/').pop()
  const [job, setJob] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)

  // Normalize job data from API (handles both capitalized and lowercase fields)
  const normalizeJob = (data) => ({
    id: data.ID || data.id,
    command: data.Command || data.command,
    args: data.Args || data.args || [],
    status: (data.Status || data.status || '').toLowerCase(),
    exitCode: data.ExitCode ?? data.exitCode,
    startedAt: data.StartedAt || data.startedAt,
    completedAt: data.CompletedAt || data.completedAt,
    createdAt: data.CreatedAt || data.createdAt,
    result: data.Result?.String || data.result,
    envOverrides: data.EnvOverrides || data.envOverrides
  })

  useEffect(() => {
    let eventSource = null
    let pollInterval = null
    let sseActive = false

    // Polling function to refresh job status
    const pollJobStatus = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (res.ok) {
          const data = await res.json()
          const normalizedJob = normalizeJob(data)
          setJob(normalizedJob)
          // Stop polling if job is complete
          if (normalizedJob.status === 'succeeded' || normalizedJob.status === 'failed') {
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll job status:', err)
      }
    }

    // Fetch job details
    fetch(`/api/jobs/${jobId}`)
      .then(res => {
        if (!res.ok) throw new Error('Job not found')
        return res.json()
      })
      .then(data => {
        const normalizedJob = normalizeJob(data)
        setJob(normalizedJob)
        // Start polling if job is not complete
        if (normalizedJob.status !== 'succeeded' && normalizedJob.status !== 'failed') {
          pollInterval = setInterval(pollJobStatus, 2000)
        }
      })
      .catch(err => setError(err.message))

    // Fetch initial logs
    fetch(`/api/jobs/${jobId}/logs`)
      .then(res => res.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch logs:', err))

    // Set up SSE for streaming
    eventSource = new EventSource(`/api/jobs/${jobId}/stream`)

    eventSource.addEventListener('log', (e) => {
      try {
        const data = JSON.parse(e.data)
        setLogs(prev => [...prev, data])
      } catch (err) {
        console.error('Failed to parse log event:', err)
      }
    })

    eventSource.addEventListener('state', (e) => {
      try {
        const data = JSON.parse(e.data)
        setJob(normalizeJob(data))
      } catch (err) {
        console.error('Failed to parse state event:', err)
      }
    })

    eventSource.addEventListener('complete', (e) => {
      try {
        const data = JSON.parse(e.data)
        setJob(normalizeJob(data))
      } catch (err) {
        console.error('Failed to parse complete event:', err)
      }
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    })

    eventSource.onopen = () => {
      sseActive = true
      // If SSE is working well, we can reduce polling frequency or stop it
      if (pollInterval && !sseActive) {
        clearInterval(pollInterval)
        pollInterval = setInterval(pollJobStatus, 5000)
      }
    }

    eventSource.onerror = () => {
      // Don't close immediately, just note the error
      // Polling will keep the status updated
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [jobId])

  if (error) {
    return (
      <div className="page">
        <div className="card" style={{ borderColor: 'var(--accent-red)' }}>
          <div className="card-title" style={{ color: 'var(--accent-red)' }}>Error</div>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <NavLink to="/jobs" className="btn btn-sm">Back to Jobs</NavLink>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="page">
        <div className="loading">Loading job details...</div>
      </div>
    )
  }

  const formatCommand = () => {
    const args = (job.args || []).map(a => a.includes(' ') ? `"${a}"` : a).join(' ')
    return `${job.command} ${args}`
  }

  const formatExitInfo = () => {
    if (job.status === 'succeeded') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} style={{ color: 'var(--accent-green)' }} />
          <span>Exit code: 0</span>
        </div>
      )
    }
    if (job.status === 'failed' && job.exitCode !== undefined) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <X size={18} style={{ color: 'var(--accent-red)' }} />
          <span>Exit code: {job.exitCode}</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Job #{job.id}</h1>
          <p className="page-subtitle">
            <StatusBadge status={job.status} />
            <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(job.createdAt).toLocaleString()}
            </span>
          </p>
        </div>
        <NavLink to="/jobs" className="btn">← Back</NavLink>
      </div>

      <div className="card">
        <div className="card-title">Command</div>
        <code style={{
          display: 'block',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: 'var(--accent-amber)'
        }}>
          {formatCommand()}
        </code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div className="card-title">Status</div>
          <StatusBadge status={job.status} />
        </div>
        <div className="card">
          <div className="card-title">Created</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {new Date(job.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Started</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Completed</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
          </div>
        </div>
      </div>

      {(job.status === 'failed' || job.status === 'succeeded') && (
        <div className={`card ${job.status === 'failed' ? 'error-card' : ''}`}>
          <div className="card-title">Result</div>
          {formatExitInfo()}
        </div>
      )}

      {/* Show download link for store save jobs */}
      {job.status === 'succeeded' && job.result && (() => {
        try {
          const result = JSON.parse(job.result)
          // Store save job result
          if (result.archivePath && result.filename) {
            return (
              <div className="card" style={{ borderColor: 'var(--accent-green)' }}>
                <div className="card-title" style={{ color: 'var(--accent-green)' }}>
                  Archive Ready
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Archive path:</strong> <code>{result.archivePath}</code>
                  </p>
                  <a
                    href={result.downloadUrl || `/api/downloads/${result.filename}`}
                    className="btn btn-primary"
                    download
                  >
                    Download {result.filename}
                  </a>
                </div>
              </div>
            )
          }
          // Store extract job result
          if (result.outputDir) {
            return (
              <div className="card" style={{ borderColor: 'var(--accent-green)' }}>
                <div className="card-title" style={{ color: 'var(--accent-green)' }}>
                  Extraction Complete
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Output directory:</strong> <code>{result.outputDir}</code>
                  </p>
                </div>
              </div>
            )
          }
        } catch {
          return null
        }
        return null
      })()}

      <div className="card">
        <div className="card-title">Output</div>
        <div className="terminal-output">
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No output yet...</div>
          ) : (
            logs.map((log, i) => {
              const content = typeof log === 'string' ? log : (log?.content || String(log))
              const stream = typeof log === 'object' ? log?.stream : ''
              return (
                <div key={i} className={`terminal-line ${stream || ''}`}>
                  <span className="content">{content}</span>
                </div>
              )
            })
          )}
          {job.status === 'running' && (
            <div className="terminal-line">
              <span className="content" style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader size={14} className="spin" />
                Loading...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobDetail

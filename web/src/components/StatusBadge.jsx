function StatusBadge({ status, className = '' }) {
  const badges = {
    queued: 'badge-info',
    running: 'badge-warning',
    succeeded: 'badge-success',
    failed: 'badge-error'
  }
  return <span className={`badge ${badges[status] || ''} ${className}`}>{status}</span>
}

export default StatusBadge

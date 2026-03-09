import React, { useState, useEffect } from 'react'
import './StatusPanel.css'

const BADGE = { M: 'badge-M', A: 'badge-A', D: 'badge-D', R: 'badge-R', '?': 'badge-U' }

function FileRow({ file, badge }) {
  const name = typeof file === 'string' ? file : (file?.path || file?.to || '?')
  const b = badge === '?' ? '?' : badge
  return (
    <div className="status-file">
      <span className={`status-badge ${BADGE[b] || 'badge-U'}`}>{b}</span>
      <span className="status-file-name">{name}</span>
    </div>
  )
}

export default function StatusPanel({ repo }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!repo) { setStatus(null); return }
    setLoading(true)
    window.dgit.gitStatus(repo.path).then(s => {
      setStatus(s)
      setLoading(false)
    })
  }, [repo?.path])

  if (!repo) return <div className="empty-state">Open a repository</div>
  if (loading) return <div className="loading-state">Loading…</div>
  if (!status) return null

  const staged    = status.staged || []
  const modified  = (status.modified || []).filter(f => !staged.find(s => (s.path || s) === f))
  const deleted   = status.deleted || []
  const renamed   = status.renamed || []
  const untracked = status.not_added || []
  const isClean   = !staged.length && !modified.length && !deleted.length && !renamed.length && !untracked.length

  return (
    <div className="status-panel overflow-y flex1">
      {isClean && <div className="empty-state">Working tree clean ✓</div>}
      {staged.length > 0 && <Group title="Staged" count={staged.length}>{staged.map((f, i) => <FileRow key={i} file={f.path || f} badge={f.index || 'M'} />)}</Group>}
      {modified.length > 0 && <Group title="Modified" count={modified.length}>{modified.map((f, i) => <FileRow key={i} file={f} badge="M" />)}</Group>}
      {renamed.length > 0 && <Group title="Renamed" count={renamed.length}>{renamed.map((f, i) => <FileRow key={i} file={`${f.from} → ${f.to}`} badge="R" />)}</Group>}
      {deleted.length > 0 && <Group title="Deleted" count={deleted.length}>{deleted.map((f, i) => <FileRow key={i} file={f} badge="D" />)}</Group>}
      {untracked.length > 0 && <Group title="Untracked" count={untracked.length}>{untracked.map((f, i) => <FileRow key={i} file={f} badge="?" />)}</Group>}
    </div>
  )
}

function Group({ title, count, children }) {
  return (
    <div className="status-group">
      <div className="status-group-title">{title} <span className="status-count">{count}</span></div>
      {children}
    </div>
  )
}

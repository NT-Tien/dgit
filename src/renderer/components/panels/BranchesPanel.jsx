import React, { useState, useEffect } from 'react'
import './BranchesPanel.css'

export default function BranchesPanel({ repo }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!repo) { setBranches([]); return }
    setLoading(true)
    window.dgit.gitBranches(repo.path).then(res => {
      setBranches(Array.isArray(res) ? res : [])
      setLoading(false)
    })
  }, [repo?.path])

  if (!repo) return <div className="empty-state">Open a repository</div>
  if (loading) return <div className="loading-state">Loading…</div>

  const local  = branches.filter(b => !b.name.startsWith('remotes/'))
  const remote = branches.filter(b => b.name.startsWith('remotes/'))

  return (
    <div className="branches-panel overflow-y flex1" style={{ padding: 16 }}>
      <div className="branch-group-title">Local ({local.length})</div>
      {local.map(b => (
        <div key={b.name} className={`branch-row ${b.current ? 'current' : ''}`}>
          <span className="branch-indicator" />
          <span className="branch-name">{b.name}</span>
          {b.sha && <span className="branch-sha">{b.sha}</span>}
          {b.subject && <span className="branch-sub">{b.subject}</span>}
        </div>
      ))}

      {remote.length > 0 && <>
        <div className="branch-group-title" style={{ marginTop: 16 }}>Remote ({remote.length})</div>
        {remote.map(b => (
          <div key={b.name} className="branch-row remote">
            <span className="branch-indicator" />
            <span className="branch-name">{b.name.replace('remotes/', '')}</span>
            {b.sha && <span className="branch-sha">{b.sha}</span>}
          </div>
        ))}
      </>}
    </div>
  )
}

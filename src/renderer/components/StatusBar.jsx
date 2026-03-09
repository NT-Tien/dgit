import React, { useState, useEffect, useRef } from 'react'

export default function StatusBar({ activeRepo, onBranchChange }) {
  const [branches, setBranches] = useState([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (!activeRepo) { setBranches([]); return }
    window.dgit.gitBranches(activeRepo.path).then(res => {
      setBranches(Array.isArray(res) ? res : [])
    })
  }, [activeRepo?.path, activeRepo?.currentBranch])

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const checkout = async (branch) => {
    if (!activeRepo || branch === activeRepo.currentBranch || switching) return
    setSwitching(true); setOpen(false); setQ('')
    const res = await window.dgit.gitCheckout(activeRepo.path, branch)
    setSwitching(false)
    if (res?.success) onBranchChange?.(res.currentBranch)
  }

  const local = branches.filter(b => !b.name.startsWith('remotes/'))
  const filtered = q ? local.filter(b => b.name.toLowerCase().includes(q.toLowerCase())) : local

  return (
    <div className="status-bar">
      <span className="status-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
        dgit
      </span>

      {activeRepo && (
        <>
          {/* Branch switcher */}
          <div className="branch-switcher" ref={ref}>
            <div
              className={`status-item branch-trigger ${switching ? 'switching' : ''}`}
              onClick={() => { if (!switching) setOpen(o => !o) }}
              title="Switch branch"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <path d="M18 9a9 9 0 0 1-9 9"/>
              </svg>
              {switching ? 'Switching…' : (activeRepo.currentBranch || '?')}
              <span style={{ fontSize: 8, opacity: 0.7 }}>▲</span>
            </div>

            {open && (
              <div className="branch-switcher-drop">
                <input
                  autoFocus
                  className="branch-switcher-search"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search branch…"
                />
                <div className="branch-switcher-list">
                  {filtered.length === 0 && <div className="branch-switcher-empty">No branches found</div>}
                  {filtered.map(b => (
                    <div
                      key={b.name}
                      className={`branch-switcher-item ${b.current ? 'active' : ''}`}
                      onClick={() => checkout(b.name)}
                    >
                      <span className="bsi-dot" />
                      <span className="bsi-name">{b.name}</span>
                      {b.current && <span className="bsi-current">current</span>}
                      {b.sha && <span className="bsi-sha">{b.sha}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="status-item" style={{ opacity: 0.7 }}>{activeRepo.name}</span>
        </>
      )}
    </div>
  )
}

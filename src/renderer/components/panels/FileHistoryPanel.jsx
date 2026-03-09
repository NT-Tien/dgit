import React, { useState } from 'react'
import DiffView from '../DiffView'
import './FileHistoryPanel.css'

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d), diff = (Date.now() - dt) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`
  return dt.toLocaleDateString()
}

export default function FileHistoryPanel({ repo }) {
  const [filePath, setFilePath] = useState('')
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [diff, setDiff] = useState('')
  const [diffLoading, setDiffLoading] = useState(false)

  const loadLog = async () => {
    if (!repo || !filePath.trim()) return
    setLoading(true); setLog([]); setSelected(null); setDiff('')
    const res = await window.dgit.gitFileLog(repo.path, filePath.trim())
    setLog(Array.isArray(res) ? res : [])
    setLoading(false)
  }

  const selectCommit = async (commit, idx) => {
    setSelected(commit)
    setDiffLoading(true)
    const prev = log[idx + 1]?.hash
    if (prev) {
      const res = await window.dgit.gitDiff(repo.path, prev, commit.hash, filePath.trim())
      setDiff(typeof res === 'string' ? res : '')
    } else {
      const res = await window.dgit.gitShow(repo.path, commit.hash, filePath.trim())
      setDiff(typeof res === 'string' ? `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1 @@\n${res}` : '')
    }
    setDiffLoading(false)
  }

  if (!repo) return <div className="empty-state">Open a repository</div>

  return (
    <div className="filelog-panel">
      <div className="filelog-left">
        <div className="filelog-input">
          <input
            value={filePath}
            onChange={e => setFilePath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadLog()}
            placeholder="path/to/file"
          />
          <button onClick={loadLog}>Go</button>
        </div>
        <div className="filelog-list">
          {loading && <div className="loading-state">Loading…</div>}
          {!loading && !log.length && <div className="empty-state" style={{ fontSize: 12 }}>Enter a file path</div>}
          {log.map((c, i) => (
            <div
              key={c.hash}
              className={`commit-item ${selected?.hash === c.hash ? 'active' : ''}`}
              onClick={() => selectCommit(c, i)}
            >
              <div className="commit-dot" />
              <div className="commit-info">
                <div className="commit-subject">{c.subject}</div>
                <div className="commit-meta">
                  <span className="chash">{c.short}</span>
                  <span className="cauthor">{c.authorName}</span>
                  <span className="cdate">{fmtDate(c.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="filelog-right">
        {!selected && <div className="empty-state">Select a commit</div>}
        {diffLoading && <div className="loading-state">Loading…</div>}
        {selected && !diffLoading && <DiffView raw={diff} />}
      </div>
    </div>
  )
}

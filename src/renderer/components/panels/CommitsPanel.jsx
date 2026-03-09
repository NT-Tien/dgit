import React, { useState, useEffect, useMemo } from 'react'
import DiffView from '../DiffView'
import './CommitsPanel.css'

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d), diff = (Date.now() - dt) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`
  return dt.toLocaleDateString()
}

export default function CommitsPanel({ repo }) {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [diff, setDiff] = useState('')
  const [diffLoading, setDiffLoading] = useState(false)

  useEffect(() => {
    if (!repo) { setCommits([]); setSelected(null); return }
    setLoading(true)
    setSelected(null); setDiff(''); setFiles([])
    window.dgit.gitLog(repo.path).then(res => {
      setCommits(Array.isArray(res) ? res : [])
      setLoading(false)
    })
  }, [repo?.path])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return commits
    return commits.filter(c =>
      c.subject.toLowerCase().includes(q) ||
      c.short.includes(q) ||
      c.authorName.toLowerCase().includes(q)
    )
  }, [commits, search])

  const selectCommit = async (commit) => {
    setSelected(commit)
    setSelectedFile(null)
    setFiles([])
    setDiffLoading(true)

    const [filesRes, diffRes] = await Promise.all([
      window.dgit.gitCommitFiles(repo.path, commit.hash),
      window.dgit.gitDiff(repo.path, commit.parents?.[0] || null, commit.hash, null)
    ])
    setFiles(Array.isArray(filesRes) ? filesRes : [])
    setDiff(typeof diffRes === 'string' ? diffRes : '')
    setDiffLoading(false)
  }

  const selectFile = async (file) => {
    if (!selected) return
    setSelectedFile(file.file)
    setDiffLoading(true)
    const res = await window.dgit.gitDiff(repo.path, selected.parents?.[0] || null, selected.hash, file.file)
    setDiff(typeof res === 'string' ? res : '')
    setDiffLoading(false)
  }

  if (!repo) return <div className="empty-state">Open a repository to start</div>

  return (
    <div className="commits-panel">
      {/* Left: commit list */}
      <div className="commit-list-col">
        <div className="commit-search">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search commits…"
          />
        </div>
        <div className="commit-list">
          {loading && <div className="loading-state">Loading…</div>}
          {!loading && filtered.map(c => (
            <div
              key={c.hash}
              className={`commit-item ${selected?.hash === c.hash ? 'active' : ''}`}
              onClick={() => selectCommit(c)}
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

      {/* Middle: file list */}
      {selected && (
        <div className="commit-files-col">
          <div className="commit-files-header">
            <span>Changed Files</span>
            <span className="file-count">{files.length}</span>
          </div>
          <div className="commit-files-list">
            <div
              className={`cf-item ${!selectedFile ? 'active' : ''}`}
              onClick={() => { setSelectedFile(null); selectCommit(selected) }}
            >
              <span className="cf-icon">≣</span>
              <span className="cf-name">All changes</span>
            </div>
            {files.map((f, i) => (
              <div
                key={i}
                className={`cf-item ${selectedFile === f.file ? 'active' : ''}`}
                onClick={() => selectFile(f)}
              >
                <span className={`cf-badge cf-${f.status}`}>{f.status}</span>
                <span className="cf-name" title={f.file}>{f.file.split('/').pop()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right: diff */}
      <div className="commit-diff-col">
        {selected && (
          <div className="commit-header">
            <div className="commit-header-subject">{selected.subject}</div>
            <div className="commit-header-meta">
              <span><b>Hash</b> {selected.hash.slice(0, 12)}</span>
              <span><b>Author</b> {selected.authorName}</span>
              <span><b>Date</b> {selected.date?.slice(0, 16)}</span>
            </div>
          </div>
        )}
        <div className="diff-scroll">
          {!selected && <div className="empty-state">Select a commit</div>}
          {selected && diffLoading && <div className="loading-state">Loading diff…</div>}
          {selected && !diffLoading && <DiffView raw={diff} />}
        </div>
      </div>
    </div>
  )
}

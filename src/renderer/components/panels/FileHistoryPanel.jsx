import React, { useState, useEffect, useCallback } from 'react'
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

// ─── File tree (reused pattern) ───────────────────────────────────────────────

function buildTree(paths) {
  const root = { children: {} }
  for (const p of paths) {
    const parts = p.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (!node.children[seg]) node.children[seg] = { type: 'dir', name: seg, children: {} }
      node = node.children[seg]
    }
    const fname = parts[parts.length - 1]
    node.children[fname] = { type: 'file', name: fname, path: p }
  }
  return root
}

function sortedEntries(children) {
  const dirs = [], files = []
  for (const [, n] of Object.entries(children)) {
    if (n.type === 'dir') dirs.push(n); else files.push(n)
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name))
  files.sort((a, b) => a.name.localeCompare(b.name))
  return [...dirs, ...files]
}

function FileTreeNode({ node, depth, active, onSelect, filterQ }) {
  const [open, setOpen] = useState(true)

  if (node.type === 'file') {
    if (filterQ && !node.path.toLowerCase().includes(filterQ.toLowerCase())) return null
    return (
      <div
        className={`fh-tree-file ${active === node.path ? 'active' : ''}`}
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => onSelect(node.path)}
        title={node.path}
      >
        <span className="fh-tree-file-icon">📄</span>
        <span className="fh-tree-name">{node.name}</span>
      </div>
    )
  }

  const kids = sortedEntries(node.children)
  const visibleKids = filterQ
    ? kids.filter(k => k.type === 'dir' || k.path?.toLowerCase().includes(filterQ.toLowerCase()))
    : kids
  if (filterQ && visibleKids.length === 0) return null

  return (
    <div>
      <div
        className="fh-tree-dir"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="fh-tree-arrow">{open || filterQ ? '▾' : '▸'}</span>
        <span className="fh-tree-dir-icon">📁</span>
        <span className="fh-tree-name">{node.name}</span>
      </div>
      {(open || filterQ) && visibleKids.map(child => (
        <FileTreeNode key={child.name} node={child} depth={depth + 1} active={active} onSelect={onSelect} filterQ={filterQ} />
      ))}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function FileHistoryPanel({ repo }) {
  const [allFiles, setAllFiles] = useState([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [filterQ, setFilterQ] = useState('')

  const [activeFile, setActiveFile] = useState(null)
  const [log, setLog] = useState([])
  const [logLoading, setLogLoading] = useState(false)

  const [selected, setSelected] = useState(null)
  const [diff, setDiff] = useState('')
  const [diffLoading, setDiffLoading] = useState(false)

  // Load file tree when repo or branch changes
  useEffect(() => {
    if (!repo) { setAllFiles([]); return }
    setTreeLoading(true)
    setActiveFile(null); setLog([]); setSelected(null); setDiff('')
    window.dgit.gitTree(repo.path, 'HEAD').then(files => {
      setAllFiles(Array.isArray(files) ? files : [])
      setTreeLoading(false)
    })
  }, [repo?.path, repo?.currentBranch])

  const selectFile = useCallback(async (path) => {
    if (!repo) return
    setActiveFile(path); setLog([]); setSelected(null); setDiff('')
    setLogLoading(true)
    const res = await window.dgit.gitFileLog(repo.path, path)
    setLog(Array.isArray(res) ? res : [])
    setLogLoading(false)
  }, [repo])

  const selectCommit = useCallback(async (commit) => {
    if (!repo || !activeFile) return
    setSelected(commit); setDiffLoading(true)
    const res = await window.dgit.gitShowFileDiff(repo.path, commit.hash, activeFile)
    setDiff(typeof res === 'string' ? res : '')
    setDiffLoading(false)
  }, [repo, activeFile])

  if (!repo) return <div className="empty-state">Open a repository</div>

  const tree = buildTree(allFiles)

  return (
    <div className="filelog-panel">
      {/* Left: file tree */}
      <div className="fh-tree-pane">
        <div className="fh-tree-header">
          <span>Files</span>
          <span className="fh-branch-badge">⎇ {repo.currentBranch || 'HEAD'}</span>
        </div>
        <div className="fh-tree-search-wrap">
          <input
            className="fh-tree-search"
            value={filterQ}
            onChange={e => setFilterQ(e.target.value)}
            placeholder="Filter files…"
          />
        </div>
        <div className="fh-tree-scroll">
          {treeLoading && <div className="loading-state" style={{ fontSize: 12 }}>Loading…</div>}
          {!treeLoading && allFiles.length === 0 && <div className="empty-state" style={{ fontSize: 12 }}>No files</div>}
          {!treeLoading && sortedEntries(tree.children).map(node => (
            <FileTreeNode key={node.name} node={node} depth={0} active={activeFile} onSelect={selectFile} filterQ={filterQ} />
          ))}
        </div>
      </div>

      {/* Middle: commit history */}
      <div className="filelog-left">
        <div className="fh-log-header">
          {activeFile
            ? <span title={activeFile}>{activeFile.split('/').pop()}</span>
            : <span style={{ color: 'var(--sub)' }}>Select a file</span>
          }
        </div>
        <div className="filelog-list">
          {logLoading && <div className="loading-state">Loading…</div>}
          {!logLoading && !log.length && (
            <div className="empty-state" style={{ fontSize: 12 }}>
              {activeFile ? 'No history' : 'Pick a file →'}
            </div>
          )}
          {log.map((c, i) => (
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

      {/* Right: diff */}
      <div className="filelog-right">
        {!selected && !diffLoading && <div className="empty-state">Select a commit to view diff</div>}
        {diffLoading && <div className="loading-state">Loading…</div>}
        {selected && !diffLoading && <DiffView raw={diff} />}
      </div>
    </div>
  )
}

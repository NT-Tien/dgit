import React, { useState, useEffect, useRef, memo, useCallback } from 'react'
import ResizeHandle from '../ResizeHandle'
import './ComparePanel.css'

// ─── Ref Picker ───────────────────────────────────────────────────────────────

function RefPicker({ value, onChange, branches, commits, placeholder }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef()

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const options = [
    ...branches.filter(b => !b.name.startsWith('remotes/')).map(b => ({ type: 'local', value: b.name, label: b.name, sub: b.sha })),
    ...branches.filter(b => b.name.startsWith('remotes/')).map(b => ({ type: 'remote', value: b.name, label: b.name.replace('remotes/', ''), sub: b.sha })),
    ...commits.slice(0, 50).map(c => ({ type: 'commit', value: c.hash, label: `${c.short} ${c.subject}`, sub: c.authorName })),
  ]

  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options
  const select = (opt) => { onChange(opt.value, opt.label); setOpen(false); setQ('') }

  return (
    <div className="ref-picker" ref={ref}>
      <div className="ref-picker-trigger" onClick={() => setOpen(o => !o)}>
        <span className="ref-picker-val">{value || <span style={{ color: 'var(--sub)' }}>{placeholder}</span>}</span>
        <span className="ref-picker-arrow">▼</span>
      </div>
      {open && (
        <div className="ref-picker-drop">
          <input autoFocus className="ref-picker-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" />
          <div className="ref-picker-list">
            {filtered.length === 0 && <div className="ref-picker-empty">No results</div>}
            {filtered.map((o, i) => (
              <div key={i} className={`ref-picker-opt ref-${o.type}`} onClick={() => select(o)}>
                <span className="rpo-icon">{o.type === 'commit' ? '◉' : '⎇'}</span>
                <span className="rpo-label">{o.label}</span>
                {o.sub && <span className="rpo-sub">{o.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Full-file side-by-side diff parser ──────────────────────────────────────

function parseSideBySide(raw) {
  if (!raw?.trim()) return []
  const lines = raw.split('\n')
  const files = []
  let cur = null
  let leftLine = 0, rightLine = 0
  let pendingRows = []

  const flush = () => {
    if (cur) { cur.pairs = alignRows(pendingRows); files.push(cur); pendingRows = [] }
  }

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      flush()
      const m = line.match(/b\/(.+)$/)
      cur = { name: m ? m[1] : line, pairs: [] }
      leftLine = 0; rightLine = 0
    } else if (line.startsWith('@@') && cur) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/)
      if (m) { leftLine = parseInt(m[1]) - 1; rightLine = parseInt(m[2]) - 1 }
      pendingRows.push({ type: 'hunk', text: line })
    } else if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('index ') ||
               line.startsWith('new file') || line.startsWith('deleted') ||
               line.startsWith('Binary') || line.startsWith('similarity') || line.startsWith('rename')) {
      // skip meta
    } else if (cur) {
      if (line.startsWith('+')) {
        rightLine++
        pendingRows.push({ type: 'add', rightNum: rightLine, text: line.slice(1) })
      } else if (line.startsWith('-')) {
        leftLine++
        pendingRows.push({ type: 'del', leftNum: leftLine, text: line.slice(1) })
      } else if (!line.startsWith('\\')) {
        leftLine++; rightLine++
        pendingRows.push({ type: 'ctx', leftNum: leftLine, rightNum: rightLine, text: line.slice(1) })
      }
    }
  }
  flush()
  return files
}

function alignRows(rows) {
  const pairs = []
  let i = 0
  while (i < rows.length) {
    const row = rows[i]
    if (row.type === 'hunk') { pairs.push({ type: 'hunk', text: row.text }); i++ }
    else if (row.type === 'ctx') { pairs.push({ type: 'ctx', left: row, right: row }); i++ }
    else {
      const dels = [], adds = []
      while (i < rows.length && rows[i].type === 'del') { dels.push(rows[i]); i++ }
      while (i < rows.length && rows[i].type === 'add') { adds.push(rows[i]); i++ }
      const count = Math.max(dels.length, adds.length)
      for (let j = 0; j < count; j++) {
        pairs.push({ type: 'change', left: dels[j] || null, right: adds[j] || null })
      }
    }
  }
  return pairs
}

// ─── Side-by-side diff view ───────────────────────────────────────────────────

const SbsRow = memo(({ pair }) => {
  if (pair.type === 'hunk') {
    return (
      <>
        <div className="sbs-hunk">{pair.text}</div>
        <div className="sbs-sep" />
        <div className="sbs-hunk">{pair.text}</div>
      </>
    )
  }
  if (pair.type === 'ctx') {
    return (
      <>
        <div className="sbs-cell sbs-ctx">
          <span className="sbs-ln">{pair.left.leftNum}</span>
          <span className="sbs-code">{pair.left.text || ' '}</span>
        </div>
        <div className="sbs-sep" />
        <div className="sbs-cell sbs-ctx">
          <span className="sbs-ln">{pair.right.rightNum}</span>
          <span className="sbs-code">{pair.right.text || ' '}</span>
        </div>
      </>
    )
  }
  const { left, right } = pair
  return (
    <>
      <div className={`sbs-cell ${left ? 'sbs-del' : 'sbs-empty'}`}>
        {left
          ? <><span className="sbs-ln">{left.leftNum}</span><span className="sbs-code">{left.text || ' '}</span></>
          : <span className="sbs-ln" />
        }
      </div>
      <div className="sbs-sep" />
      <div className={`sbs-cell ${right ? 'sbs-add' : 'sbs-empty'}`}>
        {right
          ? <><span className="sbs-ln">{right.rightNum}</span><span className="sbs-code">{right.text || ' '}</span></>
          : <span className="sbs-ln" />
        }
      </div>
    </>
  )
})

function SideBySideDiff({ files, fromLabel, toLabel, activeFile }) {
  const file = files.find(f => f.name === activeFile) || files[0]
  if (!file) return <div className="empty-state">Select a file</div>

  return (
    <div className="sbs-wrap">
      <div className="sbs-col-headers">
        <div className="sbs-col-header sbs-col-del">
          <span className="sbs-col-icon">⎇</span> {fromLabel}
        </div>
        <div className="sbs-col-sep" />
        <div className="sbs-col-header sbs-col-add">
          <span className="sbs-col-icon">⎇</span> {toLabel || 'HEAD'}
        </div>
      </div>
      <div className="sbs-scroll">
        <div className="sbs-grid">
          {file.pairs.map((pair, i) => <SbsRow key={i} pair={pair} />)}
        </div>
      </div>
    </div>
  )
}

// ─── File tree builder ────────────────────────────────────────────────────────

const STATUS_CLASS = { M: 'badge-M', A: 'badge-A', D: 'badge-D', R: 'badge-R' }

function buildTree(files) {
  const root = { children: {} }
  for (const f of files) {
    const parts = f.path.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (!node.children[seg]) node.children[seg] = { type: 'dir', name: seg, children: {} }
      node = node.children[seg]
    }
    const fname = parts[parts.length - 1]
    node.children[fname] = { type: 'file', name: fname, path: f.path, status: f.status }
  }
  return root
}

function sortedEntries(children) {
  const dirs = [], files = []
  for (const [, node] of Object.entries(children)) {
    if (node.type === 'dir') dirs.push(node)
    else files.push(node)
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name))
  files.sort((a, b) => a.name.localeCompare(b.name))
  return [...dirs, ...files]
}

function FileTreeNode({ node, depth, activeFile, onSelect }) {
  const [open, setOpen] = useState(true)

  if (node.type === 'file') {
    return (
      <div
        className={`ftree-file ${activeFile === node.path ? 'active' : ''}`}
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => onSelect(node.path)}
        title={node.path}
      >
        <span className="ftree-indent" />
        <span className="ftree-file-icon">📄</span>
        <span className="ftree-name">{node.name}</span>
        <span className={`status-badge ${STATUS_CLASS[node.status] || 'badge-U'}`}>{node.status}</span>
      </div>
    )
  }

  // dir
  return (
    <div>
      <div
        className="ftree-dir"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ftree-arrow">{open ? '▾' : '▸'}</span>
        <span className="ftree-dir-icon">📁</span>
        <span className="ftree-name">{node.name}</span>
      </div>
      {open && sortedEntries(node.children).map(child => (
        <FileTreeNode key={child.name} node={child} depth={depth + 1} activeFile={activeFile} onSelect={onSelect} />
      ))}
    </div>
  )
}

function FileTree({ files, activeFile, onSelect }) {
  if (!files.length) return null
  const tree = buildTree(files)
  return (
    <div className="ftree-root">
      {sortedEntries(tree.children).map(node => (
        <FileTreeNode key={node.name} node={node} depth={0} activeFile={activeFile} onSelect={onSelect} />
      ))}
    </div>
  )
}

// ─── Main ComparePanel ────────────────────────────────────────────────────────

export default function ComparePanel({ repo }) {
  const [branches, setBranches] = useState([])
  const [commits, setCommits] = useState([])
  const [from, setFrom] = useState({ value: '', label: '' })
  const [to, setTo] = useState({ value: '', label: '' })
  const [fileList, setFileList] = useState([])
  const [diffFiles, setDiffFiles] = useState([])
  const [activeFile, setActiveFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [diffLoading, setDiffLoading] = useState(false)
  const [filelistWidth, setFilelistWidth] = useState(210)

  useEffect(() => {
    if (!repo) return
    setFrom({ value: '', label: '' }); setTo({ value: '', label: '' })
    setFileList([]); setDiffFiles([]); setActiveFile(null)
    Promise.all([
      window.dgit.gitBranches(repo.path),
      window.dgit.gitLog(repo.path),
    ]).then(([b, c]) => {
      setBranches(Array.isArray(b) ? b : [])
      setCommits(Array.isArray(c) ? c : [])
    })
  }, [repo?.path])

  const compare = async () => {
    if (!repo || !from.value) return
    setLoading(true); setFileList([]); setDiffFiles([]); setActiveFile(null)
    const files = await window.dgit.gitDiffFiles(repo.path, from.value, to.value || null)
    setFileList(Array.isArray(files) ? files : [])
    setLoading(false)
  }

  const loadFileDiff = useCallback(async (filePath) => {
    if (!repo || !from.value) return
    setActiveFile(filePath); setDiffLoading(true)
    // Use unified=99999 to get full file context (like Android Studio)
    const raw = await window.dgit.gitDiff(repo.path, from.value, to.value || 'HEAD', filePath, { unified: 99999 })
    const parsed = parseSideBySide(typeof raw === 'string' ? raw : '')
    setDiffFiles(parsed); setDiffLoading(false)
  }, [repo, from.value, to.value])

  if (!repo) return <div className="empty-state">Open a repository</div>

  return (
    <div className="compare-panel">
      {/* Toolbar */}
      <div className="compare-toolbar">
        <label>From</label>
        <RefPicker value={from.label} onChange={(v, l) => setFrom({ value: v, label: l })} branches={branches} commits={commits} placeholder="Select branch / commit…" />
        <span className="compare-arrow">→</span>
        <label>To</label>
        <RefPicker value={to.label} onChange={(v, l) => setTo({ value: v, label: l })} branches={branches} commits={commits} placeholder="HEAD (default)" />
        <button className="compare-btn" onClick={compare} disabled={!from.value || loading}>
          {loading ? 'Loading…' : 'Compare'}
        </button>
      </div>

      {/* Body */}
      <div className="compare-body">
        {/* File list sidebar */}
        <div className="compare-filelist" style={{ width: filelistWidth }}>
          <div className="compare-filelist-header">
            Files changed
            {fileList.length > 0 && <span className="compare-file-count">{fileList.length}</span>}
          </div>
          <div className="compare-filelist-items">
            {!fileList.length && !loading && (
              <div className="compare-hint">Select refs and click Compare</div>
            )}
            <FileTree files={fileList} activeFile={activeFile} onSelect={loadFileDiff} />
          </div>
        </div>
        <ResizeHandle
          direction="horizontal"
          onResize={setFilelistWidth}
          currentSize={filelistWidth}
          minSize={140}
          maxSize={420}
        />

        {/* Diff viewer */}
        <div className="compare-diff-area">
          {diffLoading && <div className="loading-state">Loading diff…</div>}
          {!diffLoading && !activeFile && fileList.length > 0 && (
            <div className="empty-state">← Select a file to view diff</div>
          )}
          {!diffLoading && !activeFile && !fileList.length && (
            <div className="empty-state">Select two refs and click Compare</div>
          )}
          {!diffLoading && activeFile && (
            <SideBySideDiff
              files={diffFiles}
              fromLabel={from.label}
              toLabel={to.label || 'HEAD'}
              activeFile={activeFile}
            />
          )}
        </div>
      </div>
    </div>
  )
}

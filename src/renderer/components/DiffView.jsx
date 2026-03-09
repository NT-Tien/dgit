import React, { memo } from 'react'
import './DiffView.css'

function parseDiff(raw) {
  if (!raw?.trim()) return []
  const lines = raw.split('\n')
  const files = []
  let cur = null
  let leftLine = 0, rightLine = 0

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      const m = line.match(/b\/(.+)$/)
      cur = { name: m ? m[1] : line, hunks: [] }
      files.push(cur)
    } else if (line.startsWith('@@') && cur) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/)
      if (m) { leftLine = parseInt(m[1]) - 1; rightLine = parseInt(m[2]) - 1 }
      cur.hunks.push({ type: 'hunk', text: line })
    } else if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('index ') ||
               line.startsWith('new file') || line.startsWith('deleted') ||
               line.startsWith('Binary') || line.startsWith('similarity') || line.startsWith('rename')) {
      // skip meta
    } else if (cur && cur.hunks.length > 0) {
      if (line.startsWith('+')) {
        rightLine++
        cur.hunks.push({ type: 'add', left: '', right: rightLine, text: line.slice(1) })
      } else if (line.startsWith('-')) {
        leftLine++
        cur.hunks.push({ type: 'del', left: leftLine, right: '', text: line.slice(1) })
      } else if (!line.startsWith('\\')) {
        leftLine++; rightLine++
        cur.hunks.push({ type: 'ctx', left: leftLine, right: rightLine, text: line.slice(1) })
      }
    }
  }
  return files
}

const DiffLine = memo(({ row }) => {
  if (row.type === 'hunk') return (
    <div className="diff-hunk-header"><span className="diff-ln" /><span className="diff-ln" /><span className="diff-text">{row.text}</span></div>
  )
  return (
    <div className={`diff-row diff-${row.type}`}>
      <span className="diff-ln">{row.left}</span>
      <span className="diff-ln">{row.right}</span>
      <span className="diff-prefix">{row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' '}</span>
      <span className="diff-text">{row.text}</span>
    </div>
  )
})

export default memo(function DiffView({ raw }) {
  if (!raw) return <div className="empty-state">No diff</div>
  const files = parseDiff(raw)
  if (!files.length) return <div className="empty-state">No changes</div>
  return (
    <div className="diff-view">
      {files.map((f, fi) => (
        <div key={fi} className="diff-file">
          <div className="diff-file-header">
            <span className="diff-file-icon">📄</span>
            <span className="diff-file-name">{f.name}</span>
          </div>
          <div className="diff-file-body">
            {f.hunks.map((row, i) => <DiffLine key={i} row={row} />)}
          </div>
        </div>
      ))}
    </div>
  )
})

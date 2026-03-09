import React from 'react'

export default function Sidebar({ repos, activeRepo, onOpen, onSelect, onRemove }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>Explorer</span>
        <button onClick={onOpen} title="Open repository">+</button>
      </div>

      <div className="sidebar-header" style={{ paddingTop: 2, paddingBottom: 2, fontSize: 10, color: 'var(--sub)' }}>
        REPOSITORIES
      </div>

      <div className="sidebar-list">
        {repos.length === 0 && (
          <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--sub)', lineHeight: 1.6 }}>
            No repositories.<br />Click <b style={{ color: 'var(--text)' }}>+</b> to open one.
          </div>
        )}
        {repos.map(repo => (
          <div
            key={repo.path}
            className={`repo-row ${activeRepo?.path === repo.path ? 'active' : ''}`}
            onClick={() => onSelect(repo)}
          >
            <span className="repo-row-icon">📁</span>
            <div className="repo-row-info">
              <div className="repo-row-name">{repo.name}</div>
              <div className="repo-row-branch">⎇ {repo.currentBranch || '?'}</div>
            </div>
            <button
              className="repo-row-del"
              title="Remove"
              onClick={e => { e.stopPropagation(); onRemove(repo.path) }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

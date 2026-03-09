import React from 'react'

const items = [
  { id: 'explorer', label: 'Explorer', icon: '⊞' },
  { id: 'search',   label: 'Search',   icon: '⌕' },
]

export default function ActivityBar({ active, onChange }) {
  return (
    <div className="activity-bar">
      {items.map(item => (
        <button
          key={item.id}
          className={`act-btn ${active === item.id ? 'active' : ''}`}
          title={item.label}
          onClick={() => onChange(item.id)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {item.id === 'explorer' && <>
              <path d="M3 7h6l2 3h10v9H3z"/>
            </>}
            {item.id === 'search' && <>
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </>}
          </svg>
        </button>
      ))}
    </div>
  )
}

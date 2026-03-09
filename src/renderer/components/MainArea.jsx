import React, { useState } from 'react'
import CommitsPanel from './panels/CommitsPanel'
import BranchesPanel from './panels/BranchesPanel'
import ComparePanel from './panels/ComparePanel'
import FileHistoryPanel from './panels/FileHistoryPanel'
import StatusPanel from './panels/StatusPanel'

const TABS = [
  { id: 'commits',  label: 'Commits' },
  { id: 'branches', label: 'Branches' },
  { id: 'compare',  label: 'Compare' },
  { id: 'filelog',  label: 'File History' },
  { id: 'status',   label: 'Status' },
]

export default function MainArea({ activeRepo }) {
  const [activeTab, setActiveTab] = useState('commits')

  return (
    <div className="flex flex-col flex1 overflow-hidden">
      <div className="tab-bar">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`editor-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="flex1 overflow-hidden" style={{ display: 'flex' }}>
        {activeTab === 'commits'  && <CommitsPanel     repo={activeRepo} />}
        {activeTab === 'branches' && <BranchesPanel    repo={activeRepo} />}
        {activeTab === 'compare'  && <ComparePanel     repo={activeRepo} />}
        {activeTab === 'filelog'  && <FileHistoryPanel repo={activeRepo} />}
        {activeTab === 'status'   && <StatusPanel      repo={activeRepo} />}
      </div>
    </div>
  )
}

import React, { useState, useCallback } from 'react'
import ActivityBar from './components/ActivityBar'
import Sidebar from './components/Sidebar'
import MainArea from './components/MainArea'
import Terminal from './components/Terminal'
import StatusBar from './components/StatusBar'
import ResizeHandle from './components/ResizeHandle'
import './styles/layout.css'

const STORAGE_KEY = 'dgit-repos'
const loadRepos = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
const saveRepos = (repos) => localStorage.setItem(STORAGE_KEY, JSON.stringify(repos))

export default function App() {
  const [repos, setRepos] = useState(loadRepos)
  const [activeRepo, setActiveRepo] = useState(() => loadRepos()[0] || null)
  const [activePanel, setActivePanel] = useState('explorer') // activity bar panel
  const [termHeight, setTermHeight] = useState(() => parseInt(localStorage.getItem('dgit-term-h') || '220'))

  const handleOpenRepo = useCallback(async () => {
    const result = await window.dgit.openFolder()
    if (!result || result.error) return
    setRepos(prev => {
      const exists = prev.find(r => r.path === result.path)
      const next = exists ? prev : [...prev, result]
      saveRepos(next)
      return next
    })
    setActiveRepo(result)
  }, [])

  const handleSelectRepo = useCallback((repo) => {
    setActiveRepo(repo)
  }, [])

  const handleRemoveRepo = useCallback((path) => {
    setRepos(prev => {
      const next = prev.filter(r => r.path !== path)
      saveRepos(next)
      return next
    })
    setActiveRepo(prev => {
      if (prev?.path === path) return loadRepos().find(r => r.path !== path) || null
      return prev
    })
  }, [])

  const handleTermResize = useCallback((h) => {
    setTermHeight(h)
    localStorage.setItem('dgit-term-h', h)
  }, [])

  const handleBranchChange = useCallback((newBranch) => {
    setActiveRepo(prev => prev ? { ...prev, currentBranch: newBranch } : prev)
  }, [])

  return (
    <div className="app-shell">
      {/* Titlebar (macOS traffic lights area) */}
      <div className="titlebar" />

      {/* Body */}
      <div className="app-body">
        <ActivityBar active={activePanel} onChange={setActivePanel} />

        <Sidebar
          panel={activePanel}
          repos={repos}
          activeRepo={activeRepo}
          onOpen={handleOpenRepo}
          onSelect={handleSelectRepo}
          onRemove={handleRemoveRepo}
        />

        <div className="main-col flex flex-col flex1 overflow-hidden">
          <MainArea activeRepo={activeRepo} />
          <ResizeHandle onResize={handleTermResize} currentH={termHeight} minH={60} maxH={600} />
          <Terminal activeRepo={activeRepo} height={termHeight} />
        </div>
      </div>

      <StatusBar activeRepo={activeRepo} onBranchChange={handleBranchChange} />
    </div>
  )
}

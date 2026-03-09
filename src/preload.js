const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dgit', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  gitLog: (repoPath, options) => ipcRenderer.invoke('git:log', repoPath, options),
  gitFileLog: (repoPath, filePath) => ipcRenderer.invoke('git:fileLog', repoPath, filePath),
  gitDiff: (repoPath, from, to, filePath, options) => ipcRenderer.invoke('git:diff', repoPath, from, to, filePath, options),
  gitShow: (repoPath, commitHash, filePath) => ipcRenderer.invoke('git:show', repoPath, commitHash, filePath),
  gitBranches: (repoPath) => ipcRenderer.invoke('git:branches', repoPath),
  gitStatus: (repoPath) => ipcRenderer.invoke('git:status', repoPath),
  gitTree: (repoPath, commitHash) => ipcRenderer.invoke('git:tree', repoPath, commitHash),
  gitCommitFiles: (repoPath, commitHash) => ipcRenderer.invoke('git:commitFiles', repoPath, commitHash),
  gitDiffFiles: (repoPath, from, to) => ipcRenderer.invoke('git:diffFiles', repoPath, from, to),
  gitCheckout: (repoPath, branch) => ipcRenderer.invoke('git:checkout', repoPath, branch),
  pty: {
    create: (repoPath) => ipcRenderer.invoke('pty:create', repoPath),
    write: (data) => ipcRenderer.send('pty:write', data),
    resize: (cols, rows) => ipcRenderer.send('pty:resize', cols, rows),
    kill: () => ipcRenderer.send('pty:kill'),
    onData: (cb) => {
      ipcRenderer.removeAllListeners('pty:data')
      ipcRenderer.on('pty:data', (_, data) => cb(data))
    },
    onExit: (cb) => {
      ipcRenderer.removeAllListeners('pty:exit')
      ipcRenderer.on('pty:exit', cb)
    },
  }
})

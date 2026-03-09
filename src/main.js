const electron = require('electron')
const { app, BrowserWindow, ipcMain, dialog } = electron
const path = require('path')
const simpleGit = require('simple-git')
const os = require('os')

let pty
try { pty = require('node-pty') } catch (e) { console.error('node-pty load error:', e.message) }

let mainWindow
let ptyProcess = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e2e'
  })

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ─── Repo helpers ────────────────────────────────────────────────────────────

function git(repoPath) {
  return simpleGit(repoPath)
}

// ─── IPC: open folder ────────────────────────────────────────────────────────

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (result.canceled) return null
  const folder = result.filePaths[0]
  try {
    const g = git(folder)
    const isRepo = await g.checkIsRepo()
    if (!isRepo) return { error: 'Not a git repository' }
    const status = await g.status()
    const branches = await g.branch()
    return { path: folder, name: path.basename(folder), currentBranch: status.current, branches: branches.all }
  } catch (e) {
    return { error: e.message }
  }
})

// ─── IPC: git log ─────────────────────────────────────────────────────────────

ipcMain.handle('git:log', async (_, repoPath, options = {}) => {
  try {
    const g = git(repoPath)
    const args = ['--max-count=200', '--format=%H|%h|%s|%an|%ae|%ai|%P']
    if (options.branch) args.push(options.branch)
    const result = await g.raw(['log', ...args])
    return result.trim().split('\n').filter(Boolean).map(line => {
      const [hash, short, subject, authorName, authorEmail, date, parents] = line.split('|')
      return { hash, short, subject, authorName, authorEmail, date, parents: parents ? parents.split(' ') : [] }
    })
  } catch (e) { return { error: e.message } }
})

// ─── IPC: file log ────────────────────────────────────────────────────────────

ipcMain.handle('git:fileLog', async (_, repoPath, filePath) => {
  try {
    const g = git(repoPath)
    const result = await g.raw(['log', '--max-count=100', '--format=%H|%h|%s|%an|%ai', '--follow', '--', filePath])
    return result.trim().split('\n').filter(Boolean).map(line => {
      const [hash, short, subject, authorName, date] = line.split('|')
      return { hash, short, subject, authorName, date }
    })
  } catch (e) { return { error: e.message } }
})

// ─── IPC: diff ────────────────────────────────────────────────────────────────

ipcMain.handle('git:diff', async (_, repoPath, from, to, filePath, options = {}) => {
  try {
    const g = git(repoPath)
    const unified = options.unified ?? 5
    const args = ['diff', `--unified=${unified}`]
    if (from && to) args.push(`${from}..${to}`)
    else if (from) args.push(from, 'HEAD')
    if (filePath) args.push('--', filePath)
    const result = await g.raw(args)
    return result
  } catch (e) { return { error: e.message } }
})

// ─── IPC: show file at commit ─────────────────────────────────────────────────

ipcMain.handle('git:show', async (_, repoPath, commitHash, filePath) => {
  try {
    const g = git(repoPath)
    if (filePath) {
      const result = await g.raw(['show', `${commitHash}:${filePath}`])
      return result
    }
    const result = await g.raw(['show', '--stat', '--format=%H%n%an%n%ai%n%s%n%b', commitHash])
    return result
  } catch (e) { return { error: e.message } }
})

// ─── IPC: branches ───────────────────────────────────────────────────────────

ipcMain.handle('git:branches', async (_, repoPath) => {
  try {
    const g = git(repoPath)
    const raw = await g.raw(['branch', '-a', '--format=%(refname:short)|%(objectname:short)|%(subject)|%(upstream:short)|%(HEAD)'])
    return raw.trim().split('\n').filter(Boolean).map(line => {
      const [refname, sha, subject, upstream, head] = line.split('|')
      return { name: refname, sha, subject, upstream, current: head === '*' }
    })
  } catch (e) { return { error: e.message } }
})

ipcMain.handle('git:checkout', async (_, repoPath, branch) => {
  try {
    const g = git(repoPath)
    await g.checkout(branch)
    const status = await g.status()
    return { success: true, currentBranch: status.current }
  } catch (e) { return { error: e.message } }
})

// ─── IPC: status ─────────────────────────────────────────────────────────────

ipcMain.handle('git:status', async (_, repoPath) => {
  try {
    const g = git(repoPath)
    const s = await g.status()
    return {
      current: s.current,
      tracking: s.tracking,
      staged: s.staged.map(f => ({ path: f.path, index: f.index })),
      modified: s.modified,
      deleted: s.deleted,
      renamed: s.renamed.map(f => ({ from: f.from, to: f.to })),
      not_added: s.not_added,
      conflicted: s.conflicted,
      ahead: s.ahead,
      behind: s.behind,
    }
  } catch (e) { return { error: e.message } }
})

// ─── IPC: files changed in a commit ──────────────────────────────────────────

ipcMain.handle('git:commitFiles', async (_, repoPath, commitHash) => {
  try {
    const g = git(repoPath)
    // --diff-filter shows status: A=added, M=modified, D=deleted, R=renamed
    const result = await g.raw(['show', '--name-status', '--format=', commitHash])
    return result.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split('\t')
      const status = parts[0]
      const file = parts[2] || parts[1] // for renames: parts[1]=old, parts[2]=new
      const oldFile = parts[2] ? parts[1] : null
      return { status: status[0], file, oldFile }
    })
  } catch (e) { return { error: e.message } }
})

// ─── IPC: file tree at commit ─────────────────────────────────────────────────

ipcMain.handle('git:tree', async (_, repoPath, commitHash) => {
  try {
    const g = git(repoPath)
    const ref = commitHash || 'HEAD'
    const result = await g.raw(['ls-tree', '-r', '--name-only', ref])
    return result.trim().split('\n').filter(Boolean)
  } catch (e) { return { error: e.message } }
})

// ─── IPC: diff file list ─────────────────────────────────────────────────────

ipcMain.handle('git:diffFiles', async (_, repoPath, from, to) => {
  try {
    const g = git(repoPath)
    const args = ['diff', '--name-status']
    if (from && to) args.push(`${from}..${to}`)
    else if (from) args.push(from, 'HEAD')
    const result = await g.raw(args)
    return result.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split('\t')
      const status = parts[0][0]
      const path = parts[parts.length - 1]
      const oldPath = parts[0].startsWith('R') ? parts[1] : null
      return { status, path, oldPath }
    })
  } catch (e) { return { error: e.message } }
})

// ─── IPC: Terminal (PTY) ──────────────────────────────────────────────────────

ipcMain.handle('pty:create', async (_, repoPath) => {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
  }
  const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash')
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: repoPath || os.homedir(),
    env: process.env
  })
  ptyProcess.onData(data => {
    mainWindow.webContents.send('pty:data', data)
  })
  ptyProcess.onExit(() => {
    mainWindow.webContents.send('pty:exit')
    ptyProcess = null
  })
  return true
})

ipcMain.on('pty:write', (_, data) => {
  if (ptyProcess) ptyProcess.write(data)
})

ipcMain.on('pty:resize', (_, cols, rows) => {
  if (ptyProcess) ptyProcess.resize(cols, rows)
})

ipcMain.on('pty:kill', () => {
  if (ptyProcess) { ptyProcess.kill(); ptyProcess = null }
})

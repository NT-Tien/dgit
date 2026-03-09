import React, { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

const THEME = {
  background: '#11111b', foreground: '#cdd6f4', cursor: '#f5c2e7',
  black: '#45475a', brightBlack: '#585b70',
  red: '#f38ba8', brightRed: '#f38ba8',
  green: '#a6e3a1', brightGreen: '#a6e3a1',
  yellow: '#f9e2af', brightYellow: '#f9e2af',
  blue: '#89b4fa', brightBlue: '#89b4fa',
  magenta: '#f5c2e7', brightMagenta: '#cba6f7',
  cyan: '#94e2d5', brightCyan: '#89dceb',
  white: '#bac2de', brightWhite: '#a6adc8',
}

export default function Terminal({ activeRepo, height }) {
  const containerRef = useRef(null)
  const xtermRef    = useRef(null)
  const fitRef      = useRef(null)

  const doFit = useCallback(() => {
    if (!fitRef.current) return
    try { fitRef.current.fit() } catch {}
  }, [])

  const initTerminal = useCallback(async (repoPath) => {
    window.dgit.pty.kill()

    if (xtermRef.current) {
      try { xtermRef.current.dispose() } catch {}
      xtermRef.current = null
    }
    if (!containerRef.current) return

    // clear previous xterm DOM
    containerRef.current.innerHTML = ''

    const term = new XTerm({
      theme: THEME,
      fontFamily: '"SF Mono","Fira Code","JetBrains Mono",monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      macOptionIsMeta: true,
      allowProposedApi: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)

    // wait for layout to settle before fitting
    await new Promise(r => requestAnimationFrame(r))
    fit.fit()

    // IPC: pty → xterm  (removeAllListeners happens inside preload)
    window.dgit.pty.onData(data => { if (xtermRef.current) xtermRef.current.write(data) })
    window.dgit.pty.onExit(() => {
      if (xtermRef.current) xtermRef.current.writeln('\r\n\x1b[90m[Process exited]\x1b[0m')
    })

    // xterm → pty
    term.onData(data => window.dgit.pty.write(data))
    term.onResize(({ cols, rows }) => window.dgit.pty.resize(cols, rows))

    xtermRef.current = term
    fitRef.current   = fit

    await window.dgit.pty.create(repoPath)

    // fit again after pty is ready
    await new Promise(r => requestAnimationFrame(r))
    fit.fit()
    term.focus()
  }, [])

  useEffect(() => {
    initTerminal(activeRepo?.path || null)
  }, [activeRepo?.path, initTerminal])

  // refit when height prop changes
  useEffect(() => {
    const id = setTimeout(doFit, 60)
    return () => clearTimeout(id)
  }, [height, doFit])

  // refit on window resize
  useEffect(() => {
    window.addEventListener('resize', doFit)
    return () => window.removeEventListener('resize', doFit)
  }, [doFit])

  const handleClear   = () => { if (xtermRef.current) xtermRef.current.clear() }
  const handleRestart = () => initTerminal(activeRepo?.path || null)
  const handleClick   = () => { if (xtermRef.current) xtermRef.current.focus() }

  return (
    <div
      style={{ height, display: 'flex', flexDirection: 'column', background: '#11111b', flexShrink: 0, overflow: 'hidden' }}
    >
      <div className="terminal-header">
        <span className="terminal-header-title">Terminal</span>
        <div className="terminal-header-spacer" />
        <button onClick={handleClear}>⊘ Clear</button>
        <button onClick={handleRestart}>↺ Restart</button>
      </div>
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{ flex: 1, overflow: 'hidden', background: '#11111b' }}
      />
    </div>
  )
}

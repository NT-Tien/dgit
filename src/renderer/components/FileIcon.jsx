import React from 'react'

// ─── Color + label map per extension ─────────────────────────────────────────

const EXT = {
  // JS / TS
  js:         { bg: '#f7df1e', fg: '#000', t: 'JS' },
  mjs:        { bg: '#f7df1e', fg: '#000', t: 'JS' },
  cjs:        { bg: '#f7df1e', fg: '#000', t: 'JS' },
  jsx:        { bg: '#61dafb', fg: '#000', t: '⚛' },
  ts:         { bg: '#3178c6', fg: '#fff', t: 'TS' },
  tsx:        { bg: '#61dafb', fg: '#1a1a2e', t: '⚛' },
  d_ts:       { bg: '#3178c6', fg: '#fff', t: 'DT' },
  // Web
  html:       { bg: '#e34c26', fg: '#fff', t: '</>' },
  htm:        { bg: '#e34c26', fg: '#fff', t: '</>' },
  css:        { bg: '#42a5f5', fg: '#fff', t: '#' },
  scss:       { bg: '#cc6699', fg: '#fff', t: 'SC' },
  sass:       { bg: '#cc6699', fg: '#fff', t: 'SA' },
  less:       { bg: '#2a4f80', fg: '#fff', t: 'LE' },
  svg:        { bg: '#ffb13b', fg: '#000', t: 'SV' },
  // Data / Config
  json:       { bg: '#cbcb41', fg: '#1a1a1a', t: '{}' },
  yaml:       { bg: '#cc2936', fg: '#fff', t: 'YM' },
  yml:        { bg: '#cc2936', fg: '#fff', t: 'YM' },
  toml:       { bg: '#9c4121', fg: '#fff', t: 'TM' },
  xml:        { bg: '#e37933', fg: '#fff', t: 'XM' },
  env:        { bg: '#ecd53f', fg: '#000', t: 'EV' },
  // Docs
  md:         { bg: '#519aba', fg: '#fff', t: 'MD' },
  mdx:        { bg: '#519aba', fg: '#fff', t: 'MDX' },
  txt:        { bg: '#888', fg: '#fff', t: 'TXT' },
  pdf:        { bg: '#e53935', fg: '#fff', t: 'PDF' },
  // Code
  py:         { bg: '#3572a5', fg: '#fff', t: 'PY' },
  java:       { bg: '#b07219', fg: '#fff', t: 'JV' },
  kt:         { bg: '#a97bff', fg: '#fff', t: 'KT' },
  go:         { bg: '#00add8', fg: '#fff', t: 'GO' },
  rs:         { bg: '#dea584', fg: '#1a1a1a', t: 'RS' },
  cpp:        { bg: '#f34b7d', fg: '#fff', t: 'C++' },
  c:          { bg: '#555555', fg: '#fff', t: 'C' },
  h:          { bg: '#555555', fg: '#fff', t: 'H' },
  cs:         { bg: '#178600', fg: '#fff', t: 'C#' },
  php:        { bg: '#4f5d95', fg: '#fff', t: 'PHP' },
  rb:         { bg: '#701516', fg: '#fff', t: 'RB' },
  swift:      { bg: '#f05138', fg: '#fff', t: 'SW' },
  dart:       { bg: '#00b4ab', fg: '#fff', t: 'DT' },
  // Shell
  sh:         { bg: '#4eaa25', fg: '#fff', t: 'SH' },
  bash:       { bg: '#4eaa25', fg: '#fff', t: 'SH' },
  zsh:        { bg: '#4eaa25', fg: '#fff', t: 'ZS' },
  // Build / Package
  gradle:     { bg: '#02303a', fg: '#fff', t: 'GR' },
  makefile:   { bg: '#427819', fg: '#fff', t: 'MK' },
  dockerfile: { bg: '#0db7ed', fg: '#fff', t: 'DF' },
  // Images
  png:        { bg: '#a074c4', fg: '#fff', t: '🖼' },
  jpg:        { bg: '#a074c4', fg: '#fff', t: '🖼' },
  jpeg:       { bg: '#a074c4', fg: '#fff', t: '🖼' },
  gif:        { bg: '#a074c4', fg: '#fff', t: '🖼' },
  ico:        { bg: '#a074c4', fg: '#fff', t: '🖼' },
  webp:       { bg: '#a074c4', fg: '#fff', t: '🖼' },
  // Lock / config files
  lock:       { bg: '#555', fg: '#fff', t: '🔒' },
  gitignore:  { bg: '#f14e32', fg: '#fff', t: 'GI' },
  // Default
  _:          { bg: '#6a737d', fg: '#fff', t: '·' },
}

// Special full-filename matches (higher priority)
const NAMES = {
  'package.json':    { bg: '#cc3534', fg: '#fff', t: 'NP' },
  'package-lock.json': { bg: '#cc3534', fg: '#fff', t: 'NP' },
  'tsconfig.json':   { bg: '#3178c6', fg: '#fff', t: 'TS' },
  'vite.config.js':  { bg: '#646cff', fg: '#fff', t: 'VT' },
  'vite.config.ts':  { bg: '#646cff', fg: '#fff', t: 'VT' },
  '.gitignore':      { bg: '#f14e32', fg: '#fff', t: 'GI' },
  '.env':            { bg: '#ecd53f', fg: '#000', t: 'EV' },
  '.env.local':      { bg: '#ecd53f', fg: '#000', t: 'EV' },
  'dockerfile':      { bg: '#0db7ed', fg: '#fff', t: 'DF' },
  'makefile':        { bg: '#427819', fg: '#fff', t: 'MK' },
  'readme.md':       { bg: '#519aba', fg: '#fff', t: 'MD' },
}

function getIcon(filename) {
  if (!filename) return EXT._
  const lower = filename.toLowerCase()
  if (NAMES[lower]) return NAMES[lower]
  const parts = lower.split('.')
  if (parts.length > 2 && parts[parts.length - 2] === 'd' && parts[parts.length - 1] === 'ts') {
    return EXT.d_ts
  }
  const ext = parts[parts.length - 1]
  return EXT[ext] || EXT._
}

// ─── Folder SVG ───────────────────────────────────────────────────────────────

const FOLDER_COLORS = {
  src:        '#e8ab27',
  components: '#61dafb',
  styles:     '#42a5f5',
  assets:     '#a074c4',
  utils:      '#4eaa25',
  hooks:      '#cc6699',
  pages:      '#e34c26',
  api:        '#3178c6',
  lib:        '#cbcb41',
  tests:      '#cc2936',
  __tests__:  '#cc2936',
  node_modules: '#4eaa25',
  dist:       '#888',
  build:      '#888',
  public:     '#ff9800',
  static:     '#ff9800',
}

function getFolderColor(name) {
  return FOLDER_COLORS[name?.toLowerCase()] || '#dcb67a'
}

// ─── Components ───────────────────────────────────────────────────────────────

export function FolderIcon({ name, open, size = 15 }) {
  const color = getFolderColor(name)
  if (open) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M1 4a1 1 0 011-1h4l1.5 1.5H14a1 1 0 011 1v1H1V4z" fill={color} opacity="0.9"/>
        <path d="M1 6.5h14l-1.5 7H2.5L1 6.5z" fill={color}/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 4a1 1 0 011-1h4l1.5 1.5H14a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" fill={color} opacity="0.85"/>
      <path d="M1 6.5H15v5.5a1 1 0 01-1 1H2a1 1 0 01-1-1V6.5z" fill={color}/>
    </svg>
  )
}

export function FileIcon({ name, size = 14 }) {
  const { bg, fg, t } = getIcon(name)
  const isEmoji = /\p{Emoji}/u.test(t)
  const fontSize = t.length > 2 ? 5.5 : t.length === 2 ? 6.5 : 9

  return (
    <svg width={size} height={size + 2} viewBox="0 0 14 16" fill="none" style={{ flexShrink: 0 }}>
      {/* File shape */}
      <path d="M2 1h7l3 3v11H2V1z" fill={bg} opacity="0.15"/>
      <path d="M2 1h7l3 3v11H2V1z" stroke={bg} strokeWidth="1" fill="none"/>
      <path d="M9 1v3h3" stroke={bg} strokeWidth="1" fill="none"/>
      {/* Label */}
      {isEmoji ? (
        <text x="7" y="11" textAnchor="middle" fontSize="8" style={{ userSelect: 'none' }}>{t}</text>
      ) : (
        <text x="7" y="11.5" textAnchor="middle" fontSize={fontSize} fill={bg}
              fontFamily="'SF Mono','Fira Code',monospace" fontWeight="700"
              style={{ userSelect: 'none' }}>
          {t}
        </text>
      )}
    </svg>
  )
}

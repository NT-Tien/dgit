import React, { useRef, useCallback } from 'react'

// direction='vertical' → resize height (ns-resize)
// direction='horizontal' → resize width (ew-resize)
export default function ResizeHandle({ onResize, currentSize, minSize, maxSize, direction = 'vertical' }) {
  const dragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)
  const handleRef = useRef()

  const isH = direction === 'horizontal'

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startPos.current = isH ? e.clientX : e.clientY
    startSize.current = currentSize
    handleRef.current?.classList.add('dragging')
    document.body.style.userSelect = 'none'
    document.body.style.cursor = isH ? 'ew-resize' : 'ns-resize'

    const onMove = (e) => {
      if (!dragging.current) return
      const delta = isH
        ? e.clientX - startPos.current   // drag right = bigger
        : startPos.current - e.clientY   // drag up = bigger
      const newSize = Math.max(minSize, Math.min(maxSize, startSize.current + delta))
      onResize(newSize)
    }
    const onUp = () => {
      dragging.current = false
      handleRef.current?.classList.remove('dragging')
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [currentSize, minSize, maxSize, onResize, isH])

  if (isH) {
    return <div ref={handleRef} className="resize-handle-h" onMouseDown={onMouseDown} />
  }
  return <div ref={handleRef} className="resize-handle" onMouseDown={onMouseDown} />
}

import { type CSSProperties, useEffect, useRef } from 'react'
import { useStore, type TextEl } from '../../store/useStore'

interface Props {
  el: TextEl
}

export default function TextElement({ el }: Props) {
  const selected = useStore((s) => s.selectedTextId === el.id)
  const selectText = useStore((s) => s.selectText)
  const updateText = useStore((s) => s.updateText)
  const deleteText = useStore((s) => s.deleteText)

  const contentRef = useRef<HTMLDivElement>(null)
  const editingRef = useRef(false)

  // 选中态变化时同步 contentEditable 文本
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== el.content) {
      contentRef.current.innerText = el.content
    }
  }, [el.content])

  const containerStyle: CSSProperties = {
    left: el.x,
    top: el.y,
  }

  const startDrag = (e: React.PointerEvent) => {
    if (editingRef.current) {
      return
    }
    if ((e.target as HTMLElement).closest('.text-toolbar, .resize-handle-text, .delete-text-button')) {
      return
    }
    e.stopPropagation()
    selectText(el.id)
    const startX = e.clientX
    const startY = e.clientY
    const origX = el.x
    const origY = el.y
    const onMove = (ev: PointerEvent) => {
      updateText(el.id, { x: origX + (ev.clientX - startX), y: origY + (ev.clientY - startY) })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const origSize = el.fontSize
    const onMove = (ev: PointerEvent) => {
      const next = Math.max(8, origSize + (ev.clientY - startY) * 0.5)
      updateText(el.id, { fontSize: Math.round(next) })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className={`text-element-container${selected ? ' selected' : ''}`}
      style={containerStyle}
      onPointerDown={startDrag}
    >
      {selected && (
        <div className="text-toolbar" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="number"
            aria-label="文字字号"
            value={el.fontSize}
            min={8}
            max={200}
            onChange={(e) => updateText(el.id, { fontSize: parseInt(e.target.value, 10) || 8 })}
          />
          <input
            type="color"
            aria-label="文字颜色"
            value={el.color}
            onChange={(e) => updateText(el.id, { color: e.target.value })}
          />
        </div>
      )}

      <div
        ref={contentRef}
        className="text-content"
        style={{ color: el.color, fontSize: el.fontSize }}
        contentEditable
        suppressContentEditableWarning
        onDoubleClick={() => {
          editingRef.current = true
          contentRef.current?.focus()
        }}
        onFocus={() => {
          editingRef.current = true
        }}
        onBlur={(e) => {
          editingRef.current = false
          updateText(el.id, { content: e.currentTarget.innerText })
        }}
      >
        {el.content}
      </div>

      {selected && (
        <button
          className="delete-text-button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => deleteText(el.id)}
        >
          ×
        </button>
      )}
      {selected && <div className="resize-handle-text se" onPointerDown={startResize} />}
    </div>
  )
}

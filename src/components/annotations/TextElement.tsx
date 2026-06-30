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
  const commitHistory = useStore((s) => s.commitHistory)

  const contentRef = useRef<HTMLDivElement>(null)
  const editingRef = useRef(false)

  // 文本变化时同步 contentEditable 内容
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== el.content) {
      contentRef.current.innerText = el.content
    }
  }, [el.content])

  // 新建空文字：延迟到本次点击序列（含浏览器原生焦点处理）结束后再聚焦。
  // 否则真实点击的 pointerup/click 会与自动聚焦抢占，焦点落不进输入框、无法打字。
  useEffect(() => {
    if (el.content !== '') {
      return
    }
    const timer = window.setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus()
        editingRef.current = true
      }
    }, 0)
    return () => window.clearTimeout(timer)
    // 仅在挂载时聚焦一次新建的空文字
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const containerStyle: CSSProperties = {
    left: el.x,
    top: el.y,
    padding: 3,
  }

  const startDrag = (e: React.PointerEvent) => {
    if (editingRef.current) {
      return
    }
    if ((e.target as HTMLElement).closest('.resize-handle-text, .delete-text-button')) {
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
      commitHistory()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // 拖右下角手柄缩放字号
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
      commitHistory()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    editingRef.current = false
    const text = e.currentTarget.innerText.trim()
    // 失焦时若内容为空，移除该空文字框
    if (text === '') {
      deleteText(el.id)
      return
    }
    updateText(el.id, { content: text })
    commitHistory()
  }

  return (
    <div
      className={`text-element-container${selected ? ' selected' : ''}`}
      style={containerStyle}
      onPointerDown={startDrag}
    >
      <div
        ref={contentRef}
        className="text-content"
        style={{ color: el.color, fontSize: el.fontSize, padding: '2px 4px', fontWeight: 'normal', textShadow: 'none', whiteSpace: 'pre' }}
        contentEditable
        suppressContentEditableWarning
        onDoubleClick={() => {
          editingRef.current = true
          contentRef.current?.focus()
        }}
        onFocus={() => {
          editingRef.current = true
        }}
        onBlur={onBlur}
      >
        {el.content}
      </div>

      {selected && (
        <button
          className="delete-text-button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            deleteText(el.id)
            commitHistory()
          }}
        >
          ×
        </button>
      )}
      {selected && <div className="resize-handle-text se" onPointerDown={startResize} />}
    </div>
  )
}

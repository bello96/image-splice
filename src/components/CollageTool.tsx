import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import Canvas from './Canvas'
import { ChevronLeftIcon, ChevronRightIcon, UploadIcon } from '../lib/icons'

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) {
    return false
  }
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

export default function CollageTool() {
  const leftCollapsed = useStore((s) => s.leftCollapsed)
  const rightCollapsed = useStore((s) => s.rightCollapsed)
  const leftMobileOpen = useStore((s) => s.leftMobileOpen)
  const rightMobileOpen = useStore((s) => s.rightMobileOpen)
  const toggleLeft = useStore((s) => s.toggleLeft)
  const toggleRight = useStore((s) => s.toggleRight)
  const setLeftMobileOpen = useStore((s) => s.setLeftMobileOpen)
  const setRightMobileOpen = useStore((s) => s.setRightMobileOpen)

  const [dragActive, setDragActive] = useState(false)
  const dragCounter = useRef(0)

  // 进入拼图工具时锁定页面滚动
  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [])

  // 全局键盘：方向键平移选中单元格、Delete 删除选中标注、Esc 取消选中
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) {
        return
      }
      const s = useStore.getState()
      if (e.key === 'Escape') {
        s.deselectAll()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (s.selectedTextId) {
          e.preventDefault()
          s.deleteText(s.selectedTextId)
        } else if (s.selectedShapeId) {
          e.preventDefault()
          s.deleteShape(s.selectedShapeId)
        } else if (s.selectedLinearId) {
          e.preventDefault()
          s.deleteLinear(s.selectedLinearId)
        } else if (s.selectedBrushId) {
          e.preventDefault()
          s.deleteBrush(s.selectedBrushId)
        }
        return
      }
      if (s.activeCellId !== null) {
        let qx = 0
        let qy = 0
        switch (e.key) {
          case 'ArrowUp':
            qy = -1.5
            break
          case 'ArrowDown':
            qy = 1.5
            break
          case 'ArrowLeft':
            qx = -1.5
            break
          case 'ArrowRight':
            qx = 1.5
            break
          default:
            return
        }
        e.preventDefault()
        s.panCell(s.activeCellId, qx, qy)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 全局拖拽上传遮罩
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        dragCounter.current++
        setDragActive(true)
      }
    }
    const onDragLeave = () => {
      dragCounter.current--
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setDragActive(false)
      }
    }
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setDragActive(false)
      const files = e.dataTransfer?.files
      if (files && files.length) {
        void useStore.getState().addFiles(Array.from(files))
      }
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  // 移动端侧栏打开时锁定滚动
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', leftMobileOpen || rightMobileOpen)
  }, [leftMobileOpen, rightMobileOpen])

  const containerClass = [
    leftCollapsed ? 'left-sidebar-collapsed' : '',
    rightCollapsed ? 'right-sidebar-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const closeMobile = () => {
    setLeftMobileOpen(false)
    setRightMobileOpen(false)
  }

  return (
    <>
      <div id="app-container" className={containerClass}>
        <LeftSidebar />
        <Canvas />
        <RightSidebar />

        <button id="pc-toggle-left" className="pc-sidebar-toggle" aria-label="折叠/展开左侧边栏" onClick={toggleLeft}>
          <ChevronLeftIcon size={24} />
        </button>
        <button id="pc-toggle-right" className="pc-sidebar-toggle" aria-label="折叠/展开右侧边栏" onClick={toggleRight}>
          <ChevronRightIcon size={24} />
        </button>
      </div>

      {(leftMobileOpen || rightMobileOpen) && <div id="mobile-overlay" onClick={closeMobile} />}

      {dragActive && (
        <div id="drag-drop-overlay">
          <div className="drag-drop-content">
            <UploadIcon size={80} strokeWidth={1} />
            <p>松开即可上传图片</p>
          </div>
        </div>
      )}
    </>
  )
}

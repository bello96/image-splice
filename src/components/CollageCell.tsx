import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useStore, type CellImage } from '../store/useStore'
import { ReplaceIcon, ZoomInIcon, ZoomOutIcon, UploadIcon } from '../lib/icons'

interface Props {
  index: number
  style: CSSProperties
  image?: CellImage
}

/** 拖拽阈值与平移灵敏度 */
const DRAG_THRESHOLD = 4
const PAN_SENSITIVITY = 1.4

export default function CollageCell({ index, style, image }: Props) {
  const radius = useStore((s) => s.radius)
  const selected = useStore((s) => s.activeCellId === index)
  const selectCell = useStore((s) => s.selectCell)
  const replaceCellImage = useStore((s) => s.replaceCellImage)
  const removeCellImage = useStore((s) => s.removeCellImage)
  const addFiles = useStore((s) => s.addFiles)
  const panCell = useStore((s) => s.panCell)
  const zoomCell = useStore((s) => s.zoomCell)
  const swapCells = useStore((s) => s.swapCells)

  const cellRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [cellSize, setCellSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [dragOver, setDragOver] = useState(false)
  const [panning, setPanning] = useState(false)

  // 监听单元格尺寸（用于缩放时计算 background-size）
  useEffect(() => {
    const el = cellRef.current
    if (!el) {
      return
    }
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setCellSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 读取图片自然尺寸
  useEffect(() => {
    if (!image?.src) {
      setNatural(null)
      return
    }
    const img = new Image()
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = image.src
  }, [image?.src])

  const hasImage = !!image

  // 计算 background-size：scale=1 时为 cover；放大时按自然比例计算像素值
  let backgroundSize = 'cover'
  if (image && image.scale !== 1 && natural && cellSize.w > 0 && cellSize.h > 0) {
    const cover = Math.max(cellSize.w / natural.w, cellSize.h / natural.h)
    const w = natural.w * cover * image.scale
    const h = natural.h * cover * image.scale
    backgroundSize = `${w}px ${h}px`
  }

  const cellStyle: CSSProperties = {
    ...style,
    borderRadius: radius,
  }
  if (image) {
    cellStyle.backgroundImage = `url(${image.src})`
    cellStyle.backgroundSize = backgroundSize
    cellStyle.backgroundPosition = `${image.posX}% ${image.posY}%`
  }

  // ---- 指针交互：Alt+拖拽平移 / 普通拖拽交换 ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (!hasImage || e.button !== 0) {
      return
    }
    // 点击按钮区域不触发拖拽
    if ((e.target as HTMLElement).closest('.cell-icon-btn')) {
      return
    }
    const startX = e.clientX
    const startY = e.clientY
    const w = cellRef.current?.offsetWidth || 1
    const h = cellRef.current?.offsetHeight || 1
    let moved = false
    let mode: 'pan' | 'swap' | null = null
    const altAtStart = e.altKey
    selectCell(index)

    // 增量平移：持续更新起点做增量计算
    let lastX = startX
    let lastY = startY
    const onMovePan = (ev: PointerEvent) => {
      const dx = ev.clientX - lastX
      const dy = ev.clientY - lastY
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_THRESHOLD) {
        moved = true
        mode = altAtStart || ev.altKey ? 'pan' : 'swap'
        if (mode === 'pan') {
          setPanning(true)
        }
      }
      if (mode === 'pan') {
        const qx = (-dx / w) * 100 * PAN_SENSITIVITY
        const qy = (-dy / h) * 100 * PAN_SENSITIVITY
        panCell(index, qx, qy)
        lastX = ev.clientX
        lastY = ev.clientY
      } else if (mode === 'swap') {
        const under = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.grid-cell') as
          | HTMLElement
          | null
        document
          .querySelectorAll('.grid-cell.drag-over')
          .forEach((c) => c.classList.remove('drag-over'))
        if (under && under !== cellRef.current) {
          under.classList.add('drag-over')
        }
      }
    }

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMovePan)
      window.removeEventListener('pointerup', onUp)
      setPanning(false)
      if (mode === 'swap') {
        const under = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.grid-cell') as
          | HTMLElement
          | null
        document
          .querySelectorAll('.grid-cell.drag-over')
          .forEach((c) => c.classList.remove('drag-over'))
        if (under && under !== cellRef.current) {
          const targetIndex = Number(under.dataset.index)
          if (!Number.isNaN(targetIndex)) {
            swapCells(index, targetIndex)
          }
        }
      }
    }

    window.addEventListener('pointermove', onMovePan)
    window.addEventListener('pointerup', onUp)
  }

  const onClick = () => {
    if (!hasImage) {
      fileRef.current?.click()
    } else {
      selectCell(index)
    }
  }

  // ---- 文件拖放到单元格 ----
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (hasImage) {
        void replaceCellImage(index, file)
      } else {
        void addFiles([file])
      }
    }
  }

  return (
    <div
      ref={cellRef}
      className={`grid-cell${hasImage ? ' has-image' : ''}${selected ? ' selected' : ''}${
        dragOver ? ' drag-over' : ''
      }${panning ? ' is-panning' : ''}`}
      data-index={index}
      style={cellStyle}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {!hasImage && (
        <div className="upload-icon-container">
          <UploadIcon className="upload-icon" />
        </div>
      )}

      {hasImage && (
        <div className="cell-button-container">
          <button
            type="button"
            className="cell-icon-btn replace-btn"
            title="替换图片"
            onClick={(e) => {
              e.stopPropagation()
              fileRef.current?.click()
            }}
          >
            <ReplaceIcon size={16} />
          </button>
          <button
            type="button"
            className="cell-icon-btn zoom-in-btn"
            title="放大"
            onClick={(e) => {
              e.stopPropagation()
              zoomCell(index, 0.1)
            }}
          >
            <ZoomInIcon size={16} />
          </button>
          <button
            type="button"
            className="cell-icon-btn zoom-out-btn"
            title="缩小"
            onClick={(e) => {
              e.stopPropagation()
              zoomCell(index, -0.1)
            }}
          >
            <ZoomOutIcon size={16} />
          </button>
          <button
            type="button"
            className="cell-icon-btn remove-btn"
            title="移除图片"
            onClick={(e) => {
              e.stopPropagation()
              removeCellImage(index)
            }}
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            void replaceCellImage(index, file)
          }
          e.target.value = ''
        }}
      />
    </div>
  )
}

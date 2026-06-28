import { useRef, useState } from 'react'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  baseName,
  type LoadedImage,
} from '../../lib/imageUtils'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'

export default function CropTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [disp, setDisp] = useState({ w: 0, h: 0 })
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 0, h: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  const onFiles = async (files: File[]) => {
    try {
      setSrc(await fileToLoadedImage(files[0]))
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  const onImgLoad = () => {
    const el = imgRef.current
    if (!el) {
      return
    }
    const w = el.clientWidth
    const h = el.clientHeight
    setDisp({ w, h })
    setBox({ x: w * 0.15, y: h * 0.15, w: w * 0.7, h: h * 0.7 })
  }

  const clampBox = (b: Box): Box => {
    const w = Math.max(20, Math.min(b.w, disp.w))
    const h = Math.max(20, Math.min(b.h, disp.h))
    const x = Math.max(0, Math.min(b.x, disp.w - w))
    const y = Math.max(0, Math.min(b.y, disp.h - h))
    return { x, y, w, h }
  }

  const startMove = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains('crop-handle')) {
      return
    }
    e.preventDefault()
    const sx = e.clientX
    const sy = e.clientY
    const o = { ...box }
    const onMove = (ev: PointerEvent) => {
      setBox(clampBox({ ...o, x: o.x + (ev.clientX - sx), y: o.y + (ev.clientY - sy) }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (corner: Corner) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    const o = { ...box }
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      let { x, y, w, h } = o
      if (corner.includes('e')) {
        w = o.w + dx
      }
      if (corner.includes('s')) {
        h = o.h + dy
      }
      if (corner.includes('w')) {
        w = o.w - dx
        x = o.x + dx
      }
      if (corner.includes('n')) {
        h = o.h - dy
        y = o.y + dy
      }
      setBox(clampBox({ x, y, w, h }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onCrop = async () => {
    if (!src || disp.w === 0) {
      return
    }
    const scale = src.width / disp.w
    const sx = Math.round(box.x * scale)
    const sy = Math.round(box.y * scale)
    const sw = Math.round(box.w * scale)
    const sh = Math.round(box.h * scale)
    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(src.img, sx, sy, sw, sh, 0, 0, sw, sh)
    const isJpeg = src.type === 'image/jpeg'
    const blob = await canvasToBlob(canvas, isJpeg ? 'image/jpeg' : 'image/png', isJpeg ? 0.92 : undefined)
    downloadBlob(blob, `${baseName(src.name)}-cropped.${isJpeg ? 'jpg' : 'png'}`)
    showToast('已裁剪并开始下载', 'success')
  }

  const handles: Corner[] = ['nw', 'ne', 'sw', 'se']
  const handlePos: Record<Corner, React.CSSProperties> = {
    nw: { left: -7, top: -7, cursor: 'nwse-resize' },
    ne: { right: -7, top: -7, cursor: 'nesw-resize' },
    sw: { left: -7, bottom: -7, cursor: 'nesw-resize' },
    se: { right: -7, bottom: -7, cursor: 'nwse-resize' },
  }

  const scale = src && disp.w ? src.width / disp.w : 1

  return (
    <ToolShell title="图片裁剪" desc="拖动选框选择要保留的区域，支持四角缩放，裁剪结果本地生成，无水印直接下载。">
      {!src ? (
        <Dropzone hint="拖动选框裁剪" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area">
            <div className="crop-stage">
              <img ref={imgRef} src={src.dataURL} alt="裁剪" onLoad={onImgLoad} draggable={false} />
              {disp.w > 0 && (
                <div
                  className="crop-box"
                  style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                  onPointerDown={startMove}
                >
                  {handles.map((c) => (
                    <div
                      key={c}
                      className="crop-handle"
                      style={handlePos[c]}
                      onPointerDown={startResize(c)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">裁剪</h3>
            <div className="tool-stat">
              <span>选区尺寸</span>
              <span className="v">
                {Math.round(box.w * scale)} × {Math.round(box.h * scale)}
              </span>
            </div>
            <div className="tool-stat">
              <span>原图尺寸</span>
              <span className="v">
                {src.width} × {src.height}
              </span>
            </div>
            <div className="tool-actions">
              <button className="action-button primary" onClick={onCrop}>
                裁剪并下载
              </button>
              <button className="action-button secondary" onClick={() => setSrc(null)}>
                换一张
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  )
}

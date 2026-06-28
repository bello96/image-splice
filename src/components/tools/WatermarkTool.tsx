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

type Mode = 'pixelate' | 'blur' | 'solid'

export default function WatermarkTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [disp, setDisp] = useState({ w: 0, h: 0 })
  const [regions, setRegions] = useState<Box[]>([])
  const [draft, setDraft] = useState<Box | null>(null)
  const [mode, setMode] = useState<Mode>('pixelate')
  const [intensity, setIntensity] = useState(14)
  const [resultUrl, setResultUrl] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const resultBlob = useRef<Blob | null>(null)

  const onFiles = async (files: File[]) => {
    try {
      setSrc(await fileToLoadedImage(files[0]))
      setRegions([])
      setResultUrl('')
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  const onImgLoad = () => {
    const el = imgRef.current
    if (el) {
      setDisp({ w: el.clientWidth, h: el.clientHeight })
    }
  }

  const startDraw = (e: React.PointerEvent) => {
    const el = imgRef.current
    if (!el) {
      return
    }
    const rect = el.getBoundingClientRect()
    const ox = e.clientX - rect.left
    const oy = e.clientY - rect.top
    let current: Box | null = null
    const onMove = (ev: PointerEvent) => {
      const cx = Math.max(0, Math.min(ev.clientX - rect.left, rect.width))
      const cy = Math.max(0, Math.min(ev.clientY - rect.top, rect.height))
      current = { x: Math.min(ox, cx), y: Math.min(oy, cy), w: Math.abs(cx - ox), h: Math.abs(cy - oy) }
      setDraft(current)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (current && current.w > 8 && current.h > 8) {
        setRegions((prev) => [...prev, current as Box])
      }
      setDraft(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const apply = async () => {
    if (!src || !regions.length) {
      showToast('请先在图片上框选水印区域', 'warning')
      return
    }
    const dispW = imgRef.current?.clientWidth || disp.w || src.width
    const scale = src.width / dispW
    try {
    const canvas = document.createElement('canvas')
    canvas.width = src.width
    canvas.height = src.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(src.img, 0, 0)

    for (const reg of regions) {
      const rx = Math.round(reg.x * scale)
      const ry = Math.round(reg.y * scale)
      const rw = Math.round(reg.w * scale)
      const rh = Math.round(reg.h * scale)
      if (rw < 1 || rh < 1) {
        continue
      }
      if (mode === 'pixelate') {
        const block = Math.max(2, intensity)
        const sw = Math.max(1, Math.round(rw / block))
        const sh = Math.max(1, Math.round(rh / block))
        const tmp = document.createElement('canvas')
        tmp.width = sw
        tmp.height = sh
        tmp.getContext('2d')!.drawImage(canvas, rx, ry, rw, rh, 0, 0, sw, sh)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(tmp, 0, 0, sw, sh, rx, ry, rw, rh)
        ctx.imageSmoothingEnabled = true
      } else if (mode === 'blur') {
        ctx.save()
        ctx.beginPath()
        ctx.rect(rx, ry, rw, rh)
        ctx.clip()
        ctx.filter = `blur(${Math.max(2, intensity)}px)`
        ctx.drawImage(src.img, 0, 0)
        ctx.restore()
        ctx.filter = 'none'
      } else {
        // 取区域平均色填充
        const t = document.createElement('canvas')
        t.width = 1
        t.height = 1
        t.getContext('2d')!.drawImage(canvas, rx, ry, rw, rh, 0, 0, 1, 1)
        const [r, g, b] = t.getContext('2d')!.getImageData(0, 0, 1, 1).data
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(rx, ry, rw, rh)
      }
    }

    const isJpeg = src.type === 'image/jpeg'
    const blob = await canvasToBlob(canvas, isJpeg ? 'image/jpeg' : 'image/png', isJpeg ? 0.92 : undefined)
    resultBlob.current = blob
    setResultUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return URL.createObjectURL(blob)
    })
      showToast('已应用遮挡', 'success')
    } catch {
      showToast('处理失败，请重试', 'error')
    }
  }

  const onDownload = () => {
    if (!resultBlob.current || !src) {
      return
    }
    const isJpeg = src.type === 'image/jpeg'
    downloadBlob(resultBlob.current, `${baseName(src.name)}-cleaned.${isJpeg ? 'jpg' : 'png'}`)
    showToast('已开始下载', 'success')
  }

  return (
    <ToolShell
      title="去除水印"
      desc="在图片上框选水印区域，使用马赛克 / 模糊 / 纯色覆盖遮挡水印，全部在本地处理。"
    >
      {!src ? (
        <Dropzone hint="框选区域后处理" onFiles={onFiles} />
      ) : resultUrl ? (
        <div className="tool-workspace">
          <div className="tool-preview-area checkerboard">
            <img className="tool-preview-img" src={resultUrl} alt="处理结果" />
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">处理完成</h3>
            <p className="tool-desc" style={{ textAlign: 'left', marginBottom: '1rem' }}>
              对结果满意即可下载；想继续调整可返回重新框选。
            </p>
            <div className="tool-actions">
              <button className="action-button primary" onClick={onDownload}>
                下载图片
              </button>
              <button className="action-button secondary" onClick={() => setResultUrl('')}>
                返回继续编辑
              </button>
              <button className="action-button secondary" onClick={() => setSrc(null)}>
                换一张
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area">
            <div className="crop-stage" onPointerDown={startDraw}>
              <img ref={imgRef} src={src.dataURL} alt="原图" onLoad={onImgLoad} draggable={false} />
              {regions.map((reg, i) => (
                <div
                  key={i}
                  className="crop-box"
                  style={{ left: reg.x, top: reg.y, width: reg.w, height: reg.h, boxShadow: 'none', background: 'rgba(3,222,109,0.3)' }}
                />
              ))}
              {draft && (
                <div
                  className="crop-box"
                  style={{ left: draft.x, top: draft.y, width: draft.w, height: draft.h, boxShadow: 'none', background: 'rgba(3,222,109,0.3)' }}
                />
              )}
            </div>
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">遮挡设置</h3>
            <div className="tool-field">
              <label>遮挡方式</label>
              <div className="tool-toggle-group">
                <button className={`option-btn${mode === 'pixelate' ? ' active' : ''}`} onClick={() => setMode('pixelate')}>
                  马赛克
                </button>
                <button className={`option-btn${mode === 'blur' ? ' active' : ''}`} onClick={() => setMode('blur')}>
                  模糊
                </button>
                <button className={`option-btn${mode === 'solid' ? ' active' : ''}`} onClick={() => setMode('solid')}>
                  纯色
                </button>
              </div>
            </div>
            <div className="tool-field">
              <label>强度：{intensity}</label>
              <input
                type="range"
                aria-label="强度"
                min={2}
                max={40}
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="tool-stat">
              <span>已选区域</span>
              <span className="v good">{regions.length} 个</span>
            </div>
            <div className="tool-actions">
              <button className="action-button primary" onClick={apply}>
                应用遮挡
              </button>
              <button
                className="action-button secondary"
                onClick={() => setRegions((prev) => prev.slice(0, -1))}
              >
                撤销上一个
              </button>
              <button className="action-button secondary" onClick={() => setRegions([])}>
                清空选区
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  )
}

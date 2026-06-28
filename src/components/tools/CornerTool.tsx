import { useEffect, useRef, useState } from 'react'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  baseName,
  type LoadedImage,
} from '../../lib/imageUtils'

function roundedPath(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(rr, 0)
  ctx.arcTo(w, 0, w, h, rr)
  ctx.arcTo(w, h, 0, h, rr)
  ctx.arcTo(0, h, 0, 0, rr)
  ctx.arcTo(0, 0, w, 0, rr)
  ctx.closePath()
}

export default function CornerTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [radiusPct, setRadiusPct] = useState(20)
  const [outUrl, setOutUrl] = useState('')
  const blobRef = useRef<Blob | null>(null)

  const onFiles = async (files: File[]) => {
    try {
      setSrc(await fileToLoadedImage(files[0]))
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  useEffect(() => {
    if (!src) {
      return
    }
    let cancelled = false
    const run = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = src.width
      canvas.height = src.height
      const ctx = canvas.getContext('2d')!
      const r = (Math.min(src.width, src.height) / 2) * (radiusPct / 50)
      roundedPath(ctx, src.width, src.height, r)
      ctx.clip()
      ctx.drawImage(src.img, 0, 0)
      const blob = await canvasToBlob(canvas, 'image/png')
      if (cancelled) {
        return
      }
      blobRef.current = blob
      setOutUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return URL.createObjectURL(blob)
      })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [src, radiusPct])

  const onDownload = () => {
    if (!blobRef.current || !src) {
      return
    }
    downloadBlob(blobRef.current, `${baseName(src.name)}-rounded.png`)
    showToast('已开始下载', 'success')
  }

  return (
    <ToolShell title="图片圆角" desc="为图片添加圆角并导出为透明 PNG，适合做头像、卡片配图，本地处理无水印。">
      {!src ? (
        <Dropzone hint="导出为透明 PNG" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area checkerboard">
            {outUrl && <img className="tool-preview-img" src={outUrl} alt="圆角预览" />}
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">圆角设置</h3>
            <div className="tool-field">
              <label>圆角程度：{radiusPct}%</label>
              <input
                type="range"
                aria-label="圆角程度"
                min={0}
                max={50}
                value={radiusPct}
                onChange={(e) => setRadiusPct(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="tool-field">
              <label>预设</label>
              <div className="tool-toggle-group">
                {[
                  { label: '小', v: 8 },
                  { label: '中', v: 20 },
                  { label: '大', v: 35 },
                  { label: '圆', v: 50 },
                ].map((p) => (
                  <button
                    key={p.v}
                    className={`option-btn${radiusPct === p.v ? ' active' : ''}`}
                    onClick={() => setRadiusPct(p.v)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="tool-actions">
              <button className="action-button primary" onClick={onDownload}>
                下载 PNG
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

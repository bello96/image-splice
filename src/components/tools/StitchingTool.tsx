import { useEffect, useRef, useState } from 'react'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  timestamp,
  type LoadedImage,
} from '../../lib/imageUtils'

type Dir = 'vertical' | 'horizontal'

export default function StitchingTool() {
  const showToast = useStore((s) => s.showToast)
  const [images, setImages] = useState<LoadedImage[]>([])
  const [dir, setDir] = useState<Dir>('vertical')
  const [spacing, setSpacing] = useState(0)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [outUrl, setOutUrl] = useState('')
  const blobRef = useRef<Blob | null>(null)

  const onFiles = async (files: File[]) => {
    try {
      const loaded = await Promise.all(files.map(fileToLoadedImage))
      setImages((prev) => [...prev, ...loaded])
    } catch {
      showToast('部分图片加载失败', 'error')
    }
  }

  const removeAt = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i))
  const move = (i: number, delta: number) =>
    setImages((prev) => {
      const j = i + delta
      if (j < 0 || j >= prev.length) {
        return prev
      }
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  useEffect(() => {
    if (!images.length) {
      setOutUrl('')
      return
    }
    let cancelled = false
    const run = async () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const n = images.length
      const gap = spacing
      if (dir === 'vertical') {
        const W = Math.max(...images.map((im) => im.width))
        const scaled = images.map((im) => ({ im, w: W, h: Math.round((im.height * W) / im.width) }))
        const H = scaled.reduce((a, s) => a + s.h, 0) + gap * (n - 1)
        canvas.width = W
        canvas.height = H
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, W, H)
        let y = 0
        for (const s of scaled) {
          ctx.drawImage(s.im.img, 0, y, s.w, s.h)
          y += s.h + gap
        }
      } else {
        const H = Math.max(...images.map((im) => im.height))
        const scaled = images.map((im) => ({ im, h: H, w: Math.round((im.width * H) / im.height) }))
        const W = scaled.reduce((a, s) => a + s.w, 0) + gap * (n - 1)
        canvas.width = W
        canvas.height = H
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, W, H)
        let x = 0
        for (const s of scaled) {
          ctx.drawImage(s.im.img, x, 0, s.w, s.h)
          x += s.w + gap
        }
      }
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
  }, [images, dir, spacing, bgColor])

  const onDownload = () => {
    if (!blobRef.current) {
      return
    }
    downloadBlob(blobRef.current, `stitch-${timestamp()}.png`)
    showToast('已开始下载', 'success')
  }

  return (
    <ToolShell title="长图拼接" desc="将多张图片按横向或纵向拼接成一张长图，可调间距与背景，常用于聊天记录、长截图拼接。">
      {!images.length ? (
        <Dropzone multiple hint="可一次选择多张，按上传顺序拼接" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area checkerboard">
            {outUrl && <img className="tool-preview-img" src={outUrl} alt="拼接预览" />}
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">拼接设置</h3>
            <div className="tool-field">
              <label>拼接方向</label>
              <div className="tool-toggle-group">
                <button
                  className={`option-btn${dir === 'vertical' ? ' active' : ''}`}
                  onClick={() => setDir('vertical')}
                >
                  竖向
                </button>
                <button
                  className={`option-btn${dir === 'horizontal' ? ' active' : ''}`}
                  onClick={() => setDir('horizontal')}
                >
                  横向
                </button>
              </div>
            </div>
            <div className="tool-field">
              <label>间距：{spacing}px</label>
              <input
                type="range"
                aria-label="间距"
                min={0}
                max={80}
                value={spacing}
                onChange={(e) => setSpacing(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="tool-field">
              <label>背景颜色</label>
              <input
                type="color"
                aria-label="背景颜色"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
            <div className="tool-field">
              <label>图片（{images.length}）— 点缩略图箭头可调整顺序</label>
              <div className="tool-thumbs">
                {images.map((im, i) => (
                  <div key={i} className="tool-thumb" style={{ backgroundImage: `url(${im.dataURL})` }}>
                    <button title="删除" onClick={() => removeAt(i)}>
                      ×
                    </button>
                    <button
                      title="前移"
                      style={{ right: 'auto', left: 2, background: 'rgba(3,170,90,0.85)' }}
                      onClick={() => move(i, -1)}
                    >
                      ‹
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="tool-actions">
              <button className="action-button primary" onClick={onDownload}>
                下载长图
              </button>
              <button className="action-button secondary" onClick={() => setImages([])}>
                清空重选
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  )
}

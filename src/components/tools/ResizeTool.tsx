import { useState } from 'react'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  baseName,
  type LoadedImage,
} from '../../lib/imageUtils'

export default function ResizeTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lock, setLock] = useState(true)
  const ratio = src ? src.width / src.height : 1

  const onFiles = async (files: File[]) => {
    try {
      const loaded = await fileToLoadedImage(files[0])
      setSrc(loaded)
      setWidth(loaded.width)
      setHeight(loaded.height)
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  const changeWidth = (v: number) => {
    setWidth(v)
    if (lock && v > 0) {
      setHeight(Math.round(v / ratio))
    }
  }
  const changeHeight = (v: number) => {
    setHeight(v)
    if (lock && v > 0) {
      setWidth(Math.round(v * ratio))
    }
  }
  const scaleBy = (factor: number) => {
    if (!src) {
      return
    }
    setWidth(Math.round(src.width * factor))
    setHeight(Math.round(src.height * factor))
  }

  const onDownload = async () => {
    if (!src || width < 1 || height < 1) {
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src.img, 0, 0, width, height)
    const isJpeg = src.type === 'image/jpeg'
    if (isJpeg) {
      const tmp = document.createElement('canvas')
      tmp.width = width
      tmp.height = height
      const tctx = tmp.getContext('2d')!
      tctx.fillStyle = '#ffffff'
      tctx.fillRect(0, 0, width, height)
      tctx.drawImage(canvas, 0, 0)
      const blob = await canvasToBlob(tmp, 'image/jpeg', 0.92)
      downloadBlob(blob, `${baseName(src.name)}-${width}x${height}.jpg`)
    } else {
      const blob = await canvasToBlob(canvas, 'image/png')
      downloadBlob(blob, `${baseName(src.name)}-${width}x${height}.png`)
    }
    showToast('已开始下载', 'success')
  }

  return (
    <ToolShell title="调整大小" desc="精确设置图片的宽高像素，可锁定比例等比缩放，本地处理，无需上传。">
      {!src ? (
        <Dropzone hint="支持 JPG / PNG / WebP" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area checkerboard">
            <img className="tool-preview-img" src={src.dataURL} alt="预览" />
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">尺寸设置</h3>
            <div className="tool-field">
              <label>宽度 (px)</label>
              <input
                type="number"
                className="num-input"
                aria-label="宽度"
                min={1}
                value={width}
                onChange={(e) => changeWidth(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="tool-field">
              <label>高度 (px)</label>
              <input
                type="number"
                className="num-input"
                aria-label="高度"
                min={1}
                value={height}
                onChange={(e) => changeHeight(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="tool-field">
              <label className="tool-checkbox">
                <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
                锁定宽高比例
              </label>
            </div>
            <div className="tool-field">
              <label>快捷缩放</label>
              <div className="tool-toggle-group">
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <button key={f} className="option-btn" onClick={() => scaleBy(f)}>
                    {f * 100}%
                  </button>
                ))}
              </div>
            </div>
            <div className="tool-stat">
              <span>原始尺寸</span>
              <span className="v">
                {src.width} × {src.height}
              </span>
            </div>
            <div className="tool-actions">
              <button className="action-button primary" onClick={onDownload}>
                下载图片
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

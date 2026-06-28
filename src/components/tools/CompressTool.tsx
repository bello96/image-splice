import { useEffect, useRef, useState } from 'react'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  formatBytes,
  baseName,
  type LoadedImage,
} from '../../lib/imageUtils'

type Format = 'image/jpeg' | 'image/webp'

export default function CompressTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [quality, setQuality] = useState(0.8)
  const [format, setFormat] = useState<Format>('image/jpeg')
  const [outUrl, setOutUrl] = useState<string>('')
  const [outSize, setOutSize] = useState(0)
  const blobRef = useRef<Blob | null>(null)

  const onFiles = async (files: File[]) => {
    try {
      const loaded = await fileToLoadedImage(files[0])
      setSrc(loaded)
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  // 重新压缩
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
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(src.img, 0, 0)
      const blob = await canvasToBlob(canvas, format, quality)
      if (cancelled) {
        return
      }
      blobRef.current = blob
      setOutSize(blob.size)
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
  }, [src, quality, format])

  const onDownload = () => {
    if (!blobRef.current || !src) {
      return
    }
    const ext = format === 'image/webp' ? 'webp' : 'jpg'
    downloadBlob(blobRef.current, `${baseName(src.name)}-compressed.${ext}`)
    showToast('已开始下载', 'success')
  }

  const reduction = src && outSize ? Math.max(0, Math.round((1 - outSize / src.size) * 100)) : 0

  return (
    <ToolShell
      title="图片压缩"
      desc="在浏览器本地压缩图片，调节质量即可大幅减小体积，原图不会上传到任何服务器。"
    >
      {!src ? (
        <Dropzone hint="支持 JPG / PNG / WebP" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area checkerboard">
            {outUrl && <img className="tool-preview-img" src={outUrl} alt="压缩预览" />}
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">压缩设置</h3>
            <div className="tool-field">
              <label>输出格式</label>
              <div className="tool-toggle-group">
                <button
                  className={`option-btn${format === 'image/jpeg' ? ' active' : ''}`}
                  onClick={() => setFormat('image/jpeg')}
                >
                  JPG
                </button>
                <button
                  className={`option-btn${format === 'image/webp' ? ' active' : ''}`}
                  onClick={() => setFormat('image/webp')}
                >
                  WebP
                </button>
              </div>
            </div>
            <div className="tool-field">
              <label>质量：{Math.round(quality * 100)}%</label>
              <input
                type="range"
                aria-label="压缩质量"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
              />
            </div>
            <div className="tool-field">
              <div className="tool-stat">
                <span>原始大小</span>
                <span className="v">{formatBytes(src.size)}</span>
              </div>
              <div className="tool-stat">
                <span>压缩后</span>
                <span className="v good">{formatBytes(outSize)}</span>
              </div>
              <div className="tool-stat">
                <span>减少</span>
                <span className="v good">{reduction}%</span>
              </div>
              <div className="tool-stat">
                <span>尺寸</span>
                <span className="v">
                  {src.width} × {src.height}
                </span>
              </div>
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

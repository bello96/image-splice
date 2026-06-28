import { useState } from 'react'
import JSZip from 'jszip'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  baseName,
  type LoadedImage,
} from '../../lib/imageUtils'

export default function SplitTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [busy, setBusy] = useState(false)

  const onFiles = async (files: File[]) => {
    try {
      setSrc(await fileToLoadedImage(files[0]))
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  const clamp = (n: number) => Math.max(1, Math.min(10, n))

  const onSplit = async () => {
    if (!src || busy) {
      return
    }
    setBusy(true)
    try {
      const zip = new JSZip()
      const pieceW = Math.floor(src.width / cols)
      const pieceH = Math.floor(src.height / rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas')
          canvas.width = pieceW
          canvas.height = pieceH
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(
            src.img,
            c * pieceW,
            r * pieceH,
            pieceW,
            pieceH,
            0,
            0,
            pieceW,
            pieceH,
          )
          const blob = await canvasToBlob(canvas, 'image/png')
          const idx = r * cols + c + 1
          zip.file(`${baseName(src.name)}_${idx}_r${r + 1}c${c + 1}.png`, blob)
        }
      }
      const content = await zip.generateAsync({ type: 'blob' })
      downloadBlob(content, `${baseName(src.name)}-split-${rows}x${cols}.zip`)
      showToast(`已分割为 ${rows * cols} 张并打包下载`, 'success')
    } catch {
      showToast('分割失败', 'error')
    } finally {
      setBusy(false)
    }
  }

  const vLines = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100)
  const hLines = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100)

  return (
    <ToolShell
      title="图片分割"
      desc="把一张图片按网格切成多块（如九宫格），一键打包成 ZIP 下载，常用于小红书 / 朋友圈拼图。"
    >
      {!src ? (
        <Dropzone hint="切片打包为 ZIP" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area">
            <div className="crop-stage">
              <img src={src.dataURL} alt="预览" />
              <div className="split-overlay">
                {vLines.map((x, i) => (
                  <div
                    key={`v${i}`}
                    className="line"
                    style={{ left: `${x}%`, top: 0, bottom: 0, width: 2 }}
                  />
                ))}
                {hLines.map((y, i) => (
                  <div
                    key={`h${i}`}
                    className="line"
                    style={{ top: `${y}%`, left: 0, right: 0, height: 2 }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="tool-card">
            <h3 className="tool-section-title">分割设置</h3>
            <div className="tool-field">
              <label>行数：{rows}</label>
              <input
                type="range"
                aria-label="行数"
                min={1}
                max={8}
                value={rows}
                onChange={(e) => setRows(clamp(parseInt(e.target.value, 10)))}
              />
            </div>
            <div className="tool-field">
              <label>列数：{cols}</label>
              <input
                type="range"
                aria-label="列数"
                min={1}
                max={8}
                value={cols}
                onChange={(e) => setCols(clamp(parseInt(e.target.value, 10)))}
              />
            </div>
            <div className="tool-field">
              <label>常用预设</label>
              <div className="tool-toggle-group">
                {[
                  { label: '九宫格', r: 3, c: 3 },
                  { label: '2×2', r: 2, c: 2 },
                  { label: '1×3', r: 1, c: 3 },
                  { label: '3×1', r: 3, c: 1 },
                ].map((p) => (
                  <button
                    key={p.label}
                    className={`option-btn${rows === p.r && cols === p.c ? ' active' : ''}`}
                    onClick={() => {
                      setRows(p.r)
                      setCols(p.c)
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="tool-stat">
              <span>将生成</span>
              <span className="v good">{rows * cols} 张</span>
            </div>
            <div className="tool-actions">
              <button className="action-button primary" onClick={onSplit} disabled={busy}>
                {busy ? '处理中…' : '分割并打包下载'}
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

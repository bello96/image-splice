import { useEffect, useMemo, useRef, useState } from 'react'
import { ToolShell, Dropzone } from './ToolShell'
import { useStore } from '../../store/useStore'
import { beadify, type PaletteMode } from '../../lib/beadify'
import { renderBeads, type BeadStyle, type BeadBackground } from '../../lib/beadRender'
import {
  fileToLoadedImage,
  canvasToBlob,
  downloadBlob,
  baseName,
  type LoadedImage,
} from '../../lib/imageUtils'

const ALPHA_THRESHOLD = 128

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export default function BeadsTool() {
  const showToast = useStore((s) => s.showToast)
  const [src, setSrc] = useState<LoadedImage | null>(null)
  const [busy, setBusy] = useState(false)

  // 配色 / 网格参数（影响量化）
  const [beadsAcross, setBeadsAcross] = useState(58)
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('auto')
  const [colorCount, setColorCount] = useState(16)
  const [dither, setDither] = useState(false)

  // 视觉参数（仅影响渲染）
  const [style, setStyle] = useState<BeadStyle>('hole')
  const [showGrid, setShowGrid] = useState(true)
  const [gridInterval, setGridInterval] = useState(10)
  const [background, setBackground] = useState<BeadBackground>('white')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFiles = async (files: File[]) => {
    try {
      setSrc(await fileToLoadedImage(files[0]))
    } catch {
      showToast('图片加载失败', 'error')
    }
  }

  const grid = useMemo(() => {
    if (!src) {
      return null
    }
    return beadify(src.img, {
      beadsAcross,
      paletteMode,
      colorCount,
      dither,
      alphaThreshold: ALPHA_THRESHOLD,
    })
  }, [src, beadsAcross, paletteMode, colorCount, dither])

  useEffect(() => {
    if (!grid || !canvasRef.current) {
      return
    }
    const beadPx = clamp(Math.floor(760 / grid.cols), 4, 24)
    renderBeads(canvasRef.current, grid, {
      beadPx,
      style,
      showGrid,
      gridInterval,
      background,
    })
  }, [grid, style, showGrid, gridInterval, background])

  const legend = useMemo(() => {
    if (!grid) {
      return []
    }
    return grid.palette
      .map((p, i) => ({ ...p, count: grid.counts[i] }))
      .sort((a, b) => b.count - a.count)
  }, [grid])

  const onExport = async () => {
    if (!grid || !src || busy) {
      return
    }
    setBusy(true)
    try {
      const exportPx = clamp(Math.floor(3600 / Math.max(grid.cols, grid.rows)), 10, 28)
      const c = document.createElement('canvas')
      renderBeads(c, grid, { beadPx: exportPx, style, showGrid, gridInterval, background })
      const blob = await canvasToBlob(c, 'image/png')
      downloadBlob(blob, `${baseName(src.name)}-拼豆-${grid.cols}x${grid.rows}.png`)
      showToast('已导出拼豆图 PNG', 'success')
    } catch {
      showToast('导出失败', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolShell
      title="拼豆图"
      desc="把图片转成拼豆（perler / hama）效果：像素化后映射到豆子色卡，生成可照着摆的图纸，并列出每种颜色用量。"
    >
      {!src ? (
        <Dropzone hint="转为拼豆图纸 + 配色清单" onFiles={onFiles} />
      ) : (
        <div className="tool-workspace">
          <div className="tool-preview-area">
            <div className="bead-preview">
              <div className={`bead-canvas-frame bg-${background}`}>
                <canvas ref={canvasRef} className="bead-canvas" />
              </div>
              {grid && (
                <div className="bead-meta">
                  <span>
                    尺寸 <b>{grid.cols} × {grid.rows}</b>
                  </span>
                  <span>
                    总豆数 <b>{grid.total.toLocaleString()}</b>
                  </span>
                  <span>
                    用色 <b>{grid.palette.length}</b> 种
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="tool-card">
            <h3 className="tool-section-title">配色与网格</h3>

            <div className="tool-field">
              <label>配色方案</label>
              <div className="tool-toggle-group">
                <button
                  className={`option-btn${paletteMode === 'auto' ? ' active' : ''}`}
                  onClick={() => setPaletteMode('auto')}
                >
                  自适应取色
                </button>
                <button
                  className={`option-btn${paletteMode === 'card' ? ' active' : ''}`}
                  onClick={() => setPaletteMode('card')}
                >
                  通用色卡
                </button>
              </div>
            </div>

            <div className="tool-field">
              <label>
                横向豆数：{beadsAcross}
                {grid ? `（${grid.cols} × ${grid.rows}）` : ''}
              </label>
              <input
                type="range"
                aria-label="横向豆数"
                min={16}
                max={140}
                value={beadsAcross}
                onChange={(e) => setBeadsAcross(clamp(parseInt(e.target.value, 10), 16, 140))}
              />
            </div>

            {paletteMode === 'auto' && (
              <div className="tool-field">
                <label>颜色数量：{colorCount}</label>
                <input
                  type="range"
                  aria-label="颜色数量"
                  min={6}
                  max={36}
                  value={colorCount}
                  onChange={(e) => setColorCount(clamp(parseInt(e.target.value, 10), 6, 36))}
                />
              </div>
            )}

            <div className="tool-field">
              <label>豆子样式</label>
              <div className="tool-toggle-group">
                {(
                  [
                    { v: 'hole', label: '带孔圆豆' },
                    { v: 'round', label: '实心圆豆' },
                    { v: 'square', label: '方块' },
                  ] as { v: BeadStyle; label: string }[]
                ).map((o) => (
                  <button
                    key={o.v}
                    className={`option-btn${style === o.v ? ' active' : ''}`}
                    onClick={() => setStyle(o.v)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="tool-field">
              <label>背景</label>
              <div className="tool-toggle-group">
                {(
                  [
                    { v: 'white', label: '白色' },
                    { v: 'dark', label: '深色' },
                    { v: 'transparent', label: '透明' },
                  ] as { v: BeadBackground; label: string }[]
                ).map((o) => (
                  <button
                    key={o.v}
                    className={`option-btn${background === o.v ? ' active' : ''}`}
                    onClick={() => setBackground(o.v)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bead-checks">
              <label className="bead-check">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span>显示网格线</span>
              </label>
              {showGrid && (
                <div className="tool-field bead-interval">
                  <label>每 {gridInterval} 颗一格</label>
                  <input
                    type="range"
                    aria-label="网格间隔"
                    min={5}
                    max={20}
                    value={gridInterval}
                    onChange={(e) =>
                      setGridInterval(clamp(parseInt(e.target.value, 10), 5, 20))
                    }
                  />
                </div>
              )}
              <label className="bead-check">
                <input
                  type="checkbox"
                  checked={dither}
                  onChange={(e) => setDither(e.target.checked)}
                />
                <span>抖动（渐变更细腻）</span>
              </label>
            </div>

            {legend.length > 0 && (
              <div className="tool-field">
                <label>配色清单（按用量）</label>
                <div className="bead-legend">
                  {legend.map((c) => (
                    <div key={c.code} className="bead-legend-item" title={`${c.code} ${c.name}`}>
                      <span className="bead-swatch" style={{ background: c.hex }} />
                      <span className="bead-code">{c.code}</span>
                      <span className="bead-count">×{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="tool-actions">
              <button className="action-button primary" onClick={onExport} disabled={busy}>
                {busy ? '导出中…' : '导出拼豆图 PNG'}
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

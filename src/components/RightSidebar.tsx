import { useRef, useState } from 'react'
import { useStore, type Density, type Quality } from '../store/useStore'
import { ResetIcon, DensityIcon } from '../lib/icons'
import { downloadCollage, copyCollageToClipboard } from '../lib/export'

const RATIOS = ['1/1', '16/9', '9/16', '16/10', '4/3', '3/4']
const QUALITIES: { key: Quality; label: string }[] = [
  { key: 'high-jpg', label: '高清JPG' },
  { key: 'medium-jpg', label: '标准JPG' },
  { key: 'png', label: '无损PNG' },
]
const DENSITY_ROW1: { key: Density; label: string }[] = [
  { key: 'low', label: '稀疏' },
  { key: 'medium', label: '中等' },
  { key: 'high', label: '密集' },
]
const DENSITY_POS: { key: Density; title: string }[] = [
  { key: 'top-left', title: '左上角' },
  { key: 'top-right', title: '右上角' },
  { key: 'center', title: '居中' },
  { key: 'bottom-left', title: '左下角' },
  { key: 'bottom-right', title: '右下角' },
]

function ratioLabel(r: string): string {
  return r.replace('/', ':')
}

export default function RightSidebar() {
  const aspectRatio = useStore((s) => s.aspectRatio)
  const setAspectRatio = useStore((s) => s.setAspectRatio)
  const spacing = useStore((s) => s.spacing)
  const setSpacing = useStore((s) => s.setSpacing)
  const radius = useStore((s) => s.radius)
  const setRadius = useStore((s) => s.setRadius)
  const border = useStore((s) => s.border)
  const setBorder = useStore((s) => s.setBorder)
  const bgColor = useStore((s) => s.bgColor)
  const setBgColor = useStore((s) => s.setBgColor)
  const setBgImage = useStore((s) => s.setBgImage)
  const watermark = useStore((s) => s.watermark)
  const updateWatermark = useStore((s) => s.updateWatermark)
  const downloadQuality = useStore((s) => s.downloadQuality)
  const setQuality = useStore((s) => s.setQuality)
  const resetSettings = useStore((s) => s.resetSettings)
  const deselectAll = useStore((s) => s.deselectAll)
  const showToast = useStore((s) => s.showToast)
  const rightMobileOpen = useStore((s) => s.rightMobileOpen)

  const bgFileRef = useRef<HTMLInputElement>(null)
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')
  const [busy, setBusy] = useState(false)

  const applyCustomRatio = (w: string, h: string) => {
    const nw = parseInt(w, 10)
    const nh = parseInt(h, 10)
    if (nw > 0 && nh > 0) {
      setAspectRatio(`${nw}/${nh}`)
    }
  }

  const onBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setBgImage(reader.result as string)
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const waitFrames = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  const onDownload = async () => {
    if (busy) {
      return
    }
    setBusy(true)
    deselectAll()
    showToast('正在生成图片…', 'info')
    try {
      await waitFrames()
      await downloadCollage(downloadQuality, bgColor)
      showToast('图片已开始下载', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导出失败', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onCopy = async () => {
    if (busy) {
      return
    }
    setBusy(true)
    deselectAll()
    showToast('正在复制到剪贴板…', 'info')
    try {
      await waitFrames()
      await copyCollageToClipboard(bgColor)
      showToast('已复制到剪贴板', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '复制失败', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside id="right-sidebar" className={rightMobileOpen ? 'is-open' : ''}>
      <div className="sidebar-content-wrapper">
        <button id="reset-settings-btn" title="恢复默认设置" onClick={resetSettings}>
          <ResetIcon size={18} />
        </button>

        <div className="panel">
          {/* 画布设置 */}
          <div className="settings-block">
            <details open>
              <summary className="panel-section-title cursor-pointer select-none">画布设置</summary>
              <div className="settings-body">
                <div id="aspect-ratio-btns" style={{ marginBottom: '1rem' }}>
                  {RATIOS.map((r) => (
                    <button
                      key={r}
                      className={`option-btn${aspectRatio === r ? ' active' : ''}`}
                      onClick={() => {
                        setAspectRatio(r)
                        setCustomW('')
                        setCustomH('')
                      }}
                    >
                      {ratioLabel(r)}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="form-label">自定义比例</label>
                  <div className="ratio-inputs">
                    <input
                      type="number"
                      className="num-input"
                      placeholder="宽"
                      aria-label="自定义比例宽度"
                      min={1}
                      value={customW}
                      onChange={(e) => {
                        setCustomW(e.target.value)
                        applyCustomRatio(e.target.value, customH)
                      }}
                    />
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
                    <input
                      type="number"
                      className="num-input"
                      placeholder="高"
                      aria-label="自定义比例高度"
                      min={1}
                      value={customH}
                      onChange={(e) => {
                        setCustomH(e.target.value)
                        applyCustomRatio(customW, e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* 样式调整 */}
          <div className="settings-block">
            <details>
              <summary className="panel-section-title cursor-pointer select-none">样式调整</summary>
              <div className="settings-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">边框 (上 / 右 / 下 / 左) px</label>
                  <div className="border-grid">
                    {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
                      const sideLabel = { top: '上', right: '右', bottom: '下', left: '左' }[side]
                      return (
                        <input
                          key={side}
                          type="number"
                          className="num-input"
                          aria-label={`${sideLabel}边框`}
                          min={0}
                          value={border[side]}
                          onChange={(e) => setBorder(side, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        />
                      )
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    间距: <span>{spacing}</span>px
                  </label>
                  <input
                    type="range"
                    aria-label="间距"
                    min={0}
                    max={100}
                    value={spacing}
                    onChange={(e) => setSpacing(parseInt(e.target.value, 10))}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    圆角: <span>{radius}</span>px
                  </label>
                  <input
                    type="range"
                    aria-label="圆角"
                    min={0}
                    max={100}
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">背景颜色</label>
                  <input
                    type="color"
                    aria-label="背景颜色"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">背景图片</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="action-button secondary" onClick={() => bgFileRef.current?.click()}>
                      上传图片
                    </button>
                    <button className="action-button secondary" onClick={() => setBgImage(null)}>
                      移除图片
                    </button>
                  </div>
                  <input
                    ref={bgFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onBgUpload}
                  />
                </div>
              </div>
            </details>
          </div>

          {/* 高级配置 */}
          <div className="settings-block">
            <details>
              <summary className="panel-section-title cursor-pointer select-none">高级配置</summary>
              <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    启用图片水印
                  </label>
                  <input
                    type="checkbox"
                    aria-label="启用图片水印"
                    checked={watermark.enabled}
                    onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                    style={{ width: 20, height: 20 }}
                  />
                </div>
                <div>
                  <label className="form-label">水印文字</label>
                  <input
                    id="watermark-text"
                    aria-label="水印文字"
                    value={watermark.text}
                    onChange={(e) => updateWatermark({ text: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">
                    字号: <span>{watermark.fontSize}</span>px
                  </label>
                  <input
                    type="range"
                    aria-label="水印字号"
                    min={12}
                    max={100}
                    step={1}
                    value={watermark.fontSize}
                    onChange={(e) => updateWatermark({ fontSize: parseInt(e.target.value, 10) })}
                  />
                </div>
                <div>
                  <label className="form-label">
                    透明度: <span>{watermark.opacity}</span>
                  </label>
                  <input
                    type="range"
                    aria-label="水印透明度"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={watermark.opacity}
                    onChange={(e) => updateWatermark({ opacity: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">
                    旋转角度: <span>{watermark.rotation}</span>°
                  </label>
                  <input
                    type="range"
                    aria-label="水印旋转角度"
                    min={-90}
                    max={90}
                    step={5}
                    value={watermark.rotation}
                    onChange={(e) => updateWatermark({ rotation: parseInt(e.target.value, 10) })}
                  />
                </div>
                <div>
                  <label className="form-label">水印密度</label>
                  <div className="grid grid-cols-3 gap-2" style={{ marginBottom: '0.5rem' }}>
                    {DENSITY_ROW1.map((d) => (
                      <button
                        key={d.key}
                        className={`option-btn${watermark.density === d.key ? ' active' : ''}`}
                        onClick={() => updateWatermark({ density: d.key })}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {DENSITY_POS.map((d) => (
                      <button
                        key={d.key}
                        className={`option-btn${watermark.density === d.key ? ' active' : ''}`}
                        title={d.title}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => updateWatermark({ density: d.key })}
                      >
                        <DensityIcon
                          size={20}
                          pos={d.key as 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* 导出设置 */}
          <div>
            <details open>
              <summary className="panel-section-title cursor-pointer select-none">导出设置</summary>
              <div className="settings-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">图片质量</label>
                  <div id="quality-selector">
                    {QUALITIES.map((q) => (
                      <button
                        key={q.key}
                        className={`option-btn${downloadQuality === q.key ? ' active' : ''}`}
                        onClick={() => setQuality(q.key)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="action-button secondary" onClick={onCopy} disabled={busy}>
                    复制到剪贴板
                  </button>
                  <button className="action-button primary" onClick={onDownload} disabled={busy}>
                    下载图片
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </aside>
  )
}

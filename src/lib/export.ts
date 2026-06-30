import html2canvas from 'html2canvas'
import { useStore, type Quality } from '../store/useStore'
import { svgPathTriangle, svgPathStar, svgPathHeart, pointsToPath } from './shapes'
import { embedSrgbInPng } from './iccProfile'

function getWrapper(): HTMLElement | null {
  return (window as unknown as { __collageWrapper?: HTMLElement | null }).__collageWrapper ?? null
}

/** 根据质量档位计算渲染倍率，并约束最大边长与总像素 */
function computeScale(quality: Quality, w: number, h: number): number {
  const area = Math.max(1, w * h)
  let scale: number
  if (quality === 'high-jpg') {
    scale = Math.min(4, Math.max(2, Math.sqrt(5e7 / area)))
  } else if (quality === 'medium-jpg') {
    scale = Math.min(3, (window.devicePixelRatio || 1) * 1.5)
  } else {
    scale = Math.min(2, window.devicePixelRatio || 1)
  }
  const maxDim = 16000
  scale = Math.min(scale, maxDim / Math.max(w, h))
  if (area * scale * scale > 1e8) {
    scale = Math.sqrt(1e8 / area)
  }
  return Math.max(1, scale)
}

async function renderCanvas(quality: Quality, bgColor: string): Promise<HTMLCanvasElement> {
  const el = getWrapper()
  if (!el) {
    throw new Error('画布未就绪')
  }
  const w = el.offsetWidth
  const h = el.offsetHeight
  const scale = computeScale(quality, w, h)
  const canvas = await html2canvas(el, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: bgColor || '#FFFFFF',
    logging: false,
    imageTimeout: 30000,
    removeContainer: true,
    scale,
    onclone: (_doc, cloned) => {
      // 导出不应包含编辑辅助元素：隐藏空格子的上传图标；
      // 空格子背景透明，露出画布背景色而非灰色占位底（否则导出看起来像背景被污染）
      cloned.querySelectorAll<HTMLElement>('.upload-icon-container').forEach((n) => {
        n.style.display = 'none'
      })
      cloned.querySelectorAll<HTMLElement>('.grid-cell:not(.has-image)').forEach((n) => {
        n.style.backgroundColor = 'transparent'
      })
    },
  })
  // html2canvas 不渲染 inline SVG 标注，这里用 Canvas 2D 手绘标注作为可靠回退
  const ctx = canvas.getContext('2d')
  if (ctx && w > 0 && h > 0) {
    drawAnnotations(ctx, canvas.width / w, canvas.height / h)
  }
  return canvas
}

/** 把画布标注（形状 / 直线箭头 / 画笔 / 文字）手绘到导出 canvas 上 */
function drawAnnotations(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  const s = useStore.getState()
  ctx.save()
  ctx.scale(sx, sy)

  // 形状：矩形 / 椭圆 / 三角 / 五角星 / 心形
  for (const sh of s.shapes) {
    ctx.save()
    const inset = sh.filled ? 0 : sh.strokeWidth / 2
    const iw = Math.max(1, sh.w - inset * 2)
    const ih = Math.max(1, sh.h - inset * 2)
    ctx.translate(sh.x + inset, sh.y + inset)
    ctx.lineWidth = sh.strokeWidth
    ctx.strokeStyle = sh.color
    ctx.fillStyle = sh.color
    ctx.lineJoin = 'round'
    let path: Path2D
    if (sh.kind === 'rect') {
      path = new Path2D()
      path.rect(0, 0, iw, ih)
    } else if (sh.kind === 'ellipse') {
      path = new Path2D()
      path.ellipse(iw / 2, ih / 2, iw / 2, ih / 2, 0, 0, Math.PI * 2)
    } else if (sh.kind === 'triangle') {
      path = new Path2D(svgPathTriangle(iw, ih))
    } else if (sh.kind === 'star') {
      path = new Path2D(svgPathStar(iw, ih))
    } else {
      path = new Path2D(svgPathHeart(iw, ih))
    }
    if (sh.filled) {
      ctx.fill(path)
    } else {
      ctx.stroke(path)
    }
    ctx.restore()
  }

  // 直线 / 箭头
  for (const l of s.linears) {
    ctx.save()
    ctx.strokeStyle = l.color
    ctx.fillStyle = l.color
    ctx.lineWidth = l.strokeWidth
    ctx.lineCap = 'round'
    const angle = Math.atan2(l.y2 - l.y1, l.x2 - l.x1)
    if (l.kind === 'arrow') {
      const headLen = Math.max(14, l.strokeWidth * 3.2)
      const headW = Math.max(10, l.strokeWidth * 2.4)
      const hx = l.x2 - headLen * Math.cos(angle)
      const hy = l.y2 - headLen * Math.sin(angle)
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(l.x2, l.y2)
      ctx.lineTo(hx + headW * Math.cos(angle + Math.PI / 2), hy + headW * Math.sin(angle + Math.PI / 2))
      ctx.lineTo(hx + headW * Math.cos(angle - Math.PI / 2), hy + headW * Math.sin(angle - Math.PI / 2))
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    }
    ctx.restore()
  }

  // 画笔
  for (const b of s.brushes) {
    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.strokeStyle = b.color
    ctx.lineWidth = b.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke(new Path2D(pointsToPath(b.points)))
    ctx.restore()
  }

  // 文字
  for (const t of s.texts) {
    ctx.save()
    ctx.fillStyle = t.color
    ctx.font = `${t.fontSize}px Inter, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lines = t.content.split('\n')
    const lineHeight = t.fontSize * 1.25
    const startY = t.y - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, i) => ctx.fillText(line, t.x, startY + i * lineHeight))
    ctx.restore()
  }

  ctx.restore()
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: Quality): Promise<Blob> {
  const isPng = quality === 'png'
  const type = isPng ? 'image/png' : 'image/jpeg'
  const q = quality === 'high-jpg' ? 0.95 : 0.85
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('生成图片失败'))
          return
        }
        if (isPng) {
          // PNG 嵌入 sRGB 颜色声明，避免广色域查看器把 sRGB 数值当宽色域解释而偏色
          embedSrgbInPng(blob).then(resolve).catch(() => resolve(blob))
        } else {
          resolve(blob)
        }
      },
      type,
      isPng ? undefined : q,
    )
  })
}

function timestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}${p(d.getSeconds())}`
}

export async function downloadCollage(quality: Quality, bgColor: string): Promise<void> {
  const canvas = await renderCanvas(quality, bgColor)
  const blob = await canvasToBlob(canvas, quality)
  const ext = quality === 'png' ? 'png' : 'jpg'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tushengshi-${timestamp()}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 仅用于开发期验证：返回导出图片的 dataURL */
export async function captureDataURL(quality: Quality, bgColor: string): Promise<string> {
  const canvas = await renderCanvas(quality, bgColor)
  return canvas.toDataURL(quality === 'png' ? 'image/png' : 'image/jpeg', 0.95)
}

export async function copyCollageToClipboard(bgColor: string): Promise<void> {
  // 剪贴板仅支持 PNG
  const canvas = await renderCanvas('png', bgColor)
  const blob = await canvasToBlob(canvas, 'png')
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('当前浏览器不支持复制到剪贴板')
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

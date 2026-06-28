import html2canvas from 'html2canvas'
import type { Quality } from '../store/useStore'

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
  return html2canvas(el, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: bgColor || '#FFFFFF',
    logging: false,
    imageTimeout: 30000,
    removeContainer: true,
    scale,
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: Quality): Promise<Blob> {
  const isPng = quality === 'png'
  const type = isPng ? 'image/png' : 'image/jpeg'
  const q = quality === 'high-jpg' ? 0.95 : 0.85
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('生成图片失败'))
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

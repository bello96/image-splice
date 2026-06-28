/** 把拼豆网格渲染到 canvas：支持带孔圆豆 / 实心圆豆 / 方块，含网格线与背景。 */
import type { BeadGrid } from './beadify'

export type BeadStyle = 'hole' | 'round' | 'square'
export type BeadBackground = 'transparent' | 'white' | 'dark'

export interface RenderOptions {
  /** 每颗豆子的像素尺寸 */
  beadPx: number
  style: BeadStyle
  showGrid: boolean
  /** 每隔 N 颗豆画一条粗网格线 */
  gridInterval: number
  background: BeadBackground
}

const BG_FILL: Record<BeadBackground, string | null> = {
  transparent: null,
  white: '#ffffff',
  dark: '#2d3748',
}

export function renderBeads(
  canvas: HTMLCanvasElement,
  grid: BeadGrid,
  opts: RenderOptions,
): void {
  const { cols, rows, cells, palette } = grid
  const S = opts.beadPx
  canvas.width = cols * S
  canvas.height = rows * S
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const bg = BG_FILL[opts.background]
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const gap = Math.max(0.5, S * 0.06)
  const radius = (S - gap) / 2
  const holeR = radius * 0.32

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = cells[y * cols + x]
      if (v < 0) {
        continue
      }
      const hex = palette[v].hex
      const cx = x * S + S / 2
      const cy = y * S + S / 2

      if (opts.style === 'square') {
        ctx.fillStyle = hex
        roundRect(ctx, x * S + gap / 2, y * S + gap / 2, S - gap, S - gap, Math.max(1, S * 0.12))
        ctx.fill()
        // 立体高光 + 描边
        ctx.fillStyle = 'rgba(255,255,255,0.16)'
        roundRect(ctx, x * S + gap / 2, y * S + gap / 2, S - gap, (S - gap) * 0.42, Math.max(1, S * 0.12))
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'
        ctx.lineWidth = Math.max(0.5, S * 0.03)
        roundRect(ctx, x * S + gap / 2, y * S + gap / 2, S - gap, S - gap, Math.max(1, S * 0.12))
        ctx.stroke()
        continue
      }

      // 圆豆主体
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = hex
      ctx.fill()

      // 立体高光（左上）
      if (S >= 6) {
        const grad = ctx.createRadialGradient(
          cx - radius * 0.35,
          cy - radius * 0.35,
          radius * 0.1,
          cx,
          cy,
          radius,
        )
        grad.addColorStop(0, 'rgba(255,255,255,0.38)')
        grad.addColorStop(0.45, 'rgba(255,255,255,0.05)')
        grad.addColorStop(1, 'rgba(0,0,0,0.10)')
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // 边缘描边
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'
      ctx.lineWidth = Math.max(0.5, S * 0.03)
      ctx.stroke()

      // 中心孔
      if (opts.style === 'hole' && S >= 6) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
        if (bg) {
          ctx.fillStyle = bg
          ctx.fill()
        } else {
          // 透明背景：挖真正的孔
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = '#000'
          ctx.fill()
          ctx.globalCompositeOperation = 'source-over'
        }
        // 孔内阴影圈
        ctx.beginPath()
        ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'
        ctx.lineWidth = Math.max(0.5, S * 0.03)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  if (opts.showGrid && opts.gridInterval > 0) {
    drawGrid(ctx, cols, rows, S, opts.gridInterval, opts.background)
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  S: number,
  interval: number,
  background: BeadBackground,
): void {
  ctx.strokeStyle = background === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)'
  ctx.lineWidth = Math.max(1, S * 0.05)
  ctx.beginPath()
  for (let x = 0; x <= cols; x += interval) {
    ctx.moveTo(x * S, 0)
    ctx.lineTo(x * S, rows * S)
  }
  for (let y = 0; y <= rows; y += interval) {
    ctx.moveTo(0, y * S)
    ctx.lineTo(cols * S, y * S)
  }
  ctx.stroke()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

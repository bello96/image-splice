import type { ShapeKind } from '../store/useStore'

/** 等腰三角形（顶点朝上），在 w×h 盒内 */
export function svgPathTriangle(w: number, h: number): string {
  return `M ${w / 2} 0 L 0 ${h} L ${w} ${h} Z`
}

const STAR_INNER = 0.381966
const STAR_TB = 1 + Math.sin((54 * Math.PI) / 180)
const STAR_LR = 2 * Math.cos((18 * Math.PI) / 180)

/** 五角星（顶点朝上），在 w×h 盒内 */
export function svgPathStar(w: number, h: number): string {
  const cx = w / 2
  const ryO = h / STAR_TB
  const cy = ryO
  const rxO = w / STAR_LR
  const rxI = rxO * STAR_INNER
  const ryI = ryO * STAR_INNER
  const parts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const outer = i % 2 === 0
    const px = (cx + (outer ? rxO : rxI) * Math.cos(a)).toFixed(2)
    const py = (cy + (outer ? ryO : ryI) * Math.sin(a)).toFixed(2)
    parts.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`)
  }
  return `${parts.join(' ')} Z`
}

/** 心形，在 w×h 盒内（6 段三次贝塞尔） */
export function svgPathHeart(w: number, h: number): string {
  const cx = w / 2
  return [
    `M ${cx} ${h}`,
    `C ${w * 0.17} ${h * 0.673}, 0 ${h * 0.506}, 0 ${h * 0.3}`,
    `C 0 ${h * 0.132}, ${w * 0.121} 0, ${w * 0.275} 0`,
    `C ${w * 0.362} 0, ${w * 0.446} ${h * 0.044}, ${cx} ${h * 0.114}`,
    `C ${w * 0.554} ${h * 0.044}, ${w * 0.638} 0, ${w * 0.725} 0`,
    `C ${w * 0.879} 0, ${w} ${h * 0.132}, ${w} ${h * 0.3}`,
    `C ${w} ${h * 0.506}, ${w * 0.83} ${h * 0.673}, ${cx} ${h}`,
    'Z',
  ].join(' ')
}

/** path-only 形状（用 viewBox 缩放渲染）；rect/ellipse 用原生 SVG 元素，返回 null */
export function shapeToPath(kind: ShapeKind, w: number, h: number): string | null {
  switch (kind) {
    case 'triangle':
      return svgPathTriangle(w, h)
    case 'star':
      return svgPathStar(w, h)
    case 'heart':
      return svgPathHeart(w, h)
    default:
      return null
  }
}

/** 把采样点数组转为平滑折线 path（二次贝塞尔经过中点平滑） */
export function pointsToPath(points: Array<[number, number]>): string {
  if (points.length === 0) {
    return ''
  }
  if (points.length === 1) {
    const [x, y] = points[0]
    return `M ${x.toFixed(2)} ${y.toFixed(2)} l 0.1 0.1`
  }
  if (points.length === 2) {
    const [[x0, y0], [x1, y1]] = points
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let i = 1; i < points.length - 1; i++) {
    const [cx, cy] = points[i]
    const [nx, ny] = points[i + 1]
    const mx = (cx + nx) / 2
    const my = (cy + ny) / 2
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`
  }
  const last = points[points.length - 1]
  d += ` L ${last[0].toFixed(2)} ${last[1].toFixed(2)}`
  return d
}

/** 计算点集包围盒 */
export function pointsBBox(points: Array<[number, number]>): { x: number; y: number; w: number; h: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) {
      minX = x
    }
    if (y < minY) {
      minY = y
    }
    if (x > maxX) {
      maxX = x
    }
    if (y > maxY) {
      maxY = y
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

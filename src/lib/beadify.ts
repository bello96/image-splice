/**
 * 拼豆量化：把图片像素化成豆子网格，并将每个豆子映射到色卡中最接近的颜色。
 *
 * 流程：缩小到 cols×rows 网格（每格 = 一颗豆） → 构建调色板（自适应中位切分 / 固定色卡）
 *      → 每格映射到最近色（redmean 距离，可选 Floyd–Steinberg 抖动）→ 统计每色用量。
 */
import { BEAD_CARD, type BeadColor } from '../data/beadPalettes'

export type PaletteMode = 'auto' | 'card'

export interface BeadifyOptions {
  /** 横向豆数（网格宽度） */
  beadsAcross: number
  /** 配色方案：auto = 从图片自适应取色；card = 固定通用色卡 */
  paletteMode: PaletteMode
  /** 自适应配色的颜色数量（仅 auto 生效） */
  colorCount: number
  /** Floyd–Steinberg 抖动，渐变更细腻 */
  dither: boolean
  /** 透明阈值，alpha 低于此值的格子不放豆子 */
  alphaThreshold: number
}

export interface PaletteEntry extends BeadColor {
  rgb: [number, number, number]
}

export interface BeadGrid {
  cols: number
  rows: number
  /** 每格的调色板索引，-1 表示透明（空缺，不放豆） */
  cells: Int16Array
  /** 实际使用到的调色板 */
  palette: PaletteEntry[]
  /** 与 palette 对齐的每色用量 */
  counts: number[]
  /** 豆子总数（非透明格） */
  total: number
}

const MAX_BEADS_ACROSS = 160
const MAX_ROWS = 240
/** 构建调色板时的采样上限，避免大图卡顿 */
const PALETTE_SAMPLE_CAP = 16384

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/** redmean 加权距离（感知更准），返回平方距离用于比较，无需开方 */
function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const rmean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db
}

function nearestIndex(r: number, g: number, b: number, pal: PaletteEntry[]): number {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < pal.length; i++) {
    const c = pal[i].rgb
    const d = colorDist(r, g, b, c[0], c[1], c[2])
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/** 中位切分：从样本像素中提取 k 个代表色 */
function medianCut(samples: number[][], k: number): [number, number, number][] {
  if (samples.length === 0) {
    return []
  }
  let buckets: number[][][] = [samples]
  while (buckets.length < k) {
    let bestI = -1
    let bestRange = -1
    let bestCh = 0
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i]
      if (b.length < 2) {
        continue
      }
      let rmin = 255
      let rmax = 0
      let gmin = 255
      let gmax = 0
      let bmin = 255
      let bmax = 0
      for (const p of b) {
        if (p[0] < rmin) {
          rmin = p[0]
        }
        if (p[0] > rmax) {
          rmax = p[0]
        }
        if (p[1] < gmin) {
          gmin = p[1]
        }
        if (p[1] > gmax) {
          gmax = p[1]
        }
        if (p[2] < bmin) {
          bmin = p[2]
        }
        if (p[2] > bmax) {
          bmax = p[2]
        }
      }
      const rr = rmax - rmin
      const gr = gmax - gmin
      const br = bmax - bmin
      const maxr = Math.max(rr, gr, br)
      if (maxr > bestRange) {
        bestRange = maxr
        bestI = i
        bestCh = rr >= gr && rr >= br ? 0 : gr >= br ? 1 : 2
      }
    }
    if (bestI < 0) {
      break
    }
    const b = buckets[bestI]
    b.sort((x, y) => x[bestCh] - y[bestCh])
    const mid = b.length >> 1
    buckets.splice(bestI, 1, b.slice(0, mid), b.slice(mid))
  }
  return buckets.map((b) => {
    let r = 0
    let g = 0
    let bl = 0
    for (const p of b) {
      r += p[0]
      g += p[1]
      bl += p[2]
    }
    const n = b.length || 1
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)]
  })
}

function cardPalette(): PaletteEntry[] {
  return BEAD_CARD.map((c) => ({ ...c, rgb: hexToRgb(c.hex) }))
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

function autoPalette(samples: number[][], k: number): PaletteEntry[] {
  const colors = medianCut(samples, k)
  return colors.map((rgb, i) => ({
    code: `C${String(i + 1).padStart(2, '0')}`,
    name: rgbToHex(rgb[0], rgb[1], rgb[2]),
    hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
    rgb,
  }))
}

export function beadify(img: HTMLImageElement, opts: BeadifyOptions): BeadGrid {
  const cols = Math.max(2, Math.min(MAX_BEADS_ACROSS, Math.round(opts.beadsAcross)))
  const ratio = img.naturalHeight / img.naturalWidth || 1
  const rows = Math.max(1, Math.min(MAX_ROWS, Math.round(cols * ratio)))

  // 缩小到网格大小（平均采样）
  const small = document.createElement('canvas')
  small.width = cols
  small.height = rows
  const sctx = small.getContext('2d', { willReadFrequently: true })!
  sctx.imageSmoothingEnabled = true
  sctx.imageSmoothingQuality = 'high'
  sctx.clearRect(0, 0, cols, rows)
  sctx.drawImage(img, 0, 0, cols, rows)
  const data = sctx.getImageData(0, 0, cols, rows).data

  const n = cols * rows
  const alpha = new Uint8Array(n)
  const fr = new Float32Array(n)
  const fg = new Float32Array(n)
  const fb = new Float32Array(n)
  const samples: number[][] = []
  const sampleStride = Math.max(1, Math.floor(n / PALETTE_SAMPLE_CAP))
  for (let i = 0; i < n; i++) {
    const a = data[i * 4 + 3]
    alpha[i] = a
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    fr[i] = r
    fg[i] = g
    fb[i] = b
    if (a >= opts.alphaThreshold && i % sampleStride === 0) {
      samples.push([r, g, b])
    }
  }

  const palette =
    opts.paletteMode === 'auto'
      ? autoPalette(samples, Math.max(2, Math.min(48, opts.colorCount)))
      : cardPalette()

  const cells = new Int16Array(n).fill(-1)
  const usedCount = new Array(palette.length).fill(0)
  let total = 0

  // Floyd–Steinberg 误差扩散需在浮点缓冲上逐行处理
  const diffuse = (idx: number, er: number, eg: number, eb: number, f: number) => {
    if (idx < 0 || idx >= n || alpha[idx] < opts.alphaThreshold) {
      return
    }
    fr[idx] += (er * f) / 16
    fg[idx] += (eg * f) / 16
    fb[idx] += (eb * f) / 16
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x
      if (alpha[idx] < opts.alphaThreshold) {
        continue
      }
      const r = fr[idx]
      const g = fg[idx]
      const b = fb[idx]
      const pi = nearestIndex(r, g, b, palette)
      cells[idx] = pi
      usedCount[pi]++
      total++
      if (opts.dither) {
        const c = palette[pi].rgb
        const er = r - c[0]
        const eg = g - c[1]
        const eb = b - c[2]
        diffuse(idx + 1, er, eg, eb, 7)
        if (y + 1 < rows) {
          diffuse(idx + cols - 1, er, eg, eb, 3)
          diffuse(idx + cols, er, eg, eb, 5)
          diffuse(idx + cols + 1, er, eg, eb, 1)
        }
      }
    }
  }

  // 仅保留实际用到的颜色，并重映射 cells 索引
  const keep: number[] = []
  const remap = new Array(palette.length).fill(-1)
  for (let i = 0; i < palette.length; i++) {
    if (usedCount[i] > 0) {
      remap[i] = keep.length
      keep.push(i)
    }
  }
  const usedPalette = keep.map((i) => palette[i])
  const counts = keep.map((i) => usedCount[i])
  for (let i = 0; i < n; i++) {
    if (cells[i] >= 0) {
      cells[i] = remap[cells[i]]
    }
  }

  return { cols, rows, cells, palette: usedPalette, counts, total }
}

import { create } from 'zustand'
import { LAYOUTS, type LayoutDef } from '../data/layouts'

/** 单元格图片数据：背景定位（百分比）与缩放 */
export interface CellImage {
  src: string
  /** background-position-x，0-100 */
  posX: number
  /** background-position-y，0-100 */
  posY: number
  /** 缩放系数，1 = cover */
  scale: number
  filename?: string
}

export type Quality = 'high-jpg' | 'medium-jpg' | 'png'

export type Density =
  | 'low'
  | 'medium'
  | 'high'
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right'

export interface TextEl {
  id: string
  /** 相对画布的像素坐标（中心点） */
  x: number
  y: number
  content: string
  color: string
  fontSize: number
}

export interface ArrowEl {
  id: string
  /** 起点像素坐标 */
  x1: number
  y1: number
  /** 终点像素坐标 */
  x2: number
  y2: number
  color: string
  strokeWidth: number
}

export interface ShapeEl {
  id: string
  /** 左上角像素坐标 */
  x: number
  y: number
  w: number
  h: number
  color: string
  strokeWidth: number
}

export interface BorderWidths {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Watermark {
  enabled: boolean
  text: string
  fontSize: number
  opacity: number
  rotation: number
  density: Density
}

export interface ToastState {
  message: string
  type: 'success' | 'info' | 'error' | 'warning'
  visible: boolean
  /** 自增 key，用于重复触发同一条消息时重启动画 */
  key: number
}

const DEFAULT_BORDER: BorderWidths = { top: 10, right: 10, bottom: 10, left: 10 }
const DEFAULT_WATERMARK: Watermark = {
  enabled: false,
  text: 'ops-coffee.com',
  fontSize: 20,
  opacity: 0.25,
  rotation: 45,
  density: 'medium',
}

let _uid = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(_uid++).toString(36)}`

/** 计算某个布局的单元格数量 */
export function cellCountOf(def: LayoutDef): number {
  return def.c ? def.c.length : def.gr[0] * def.gr[1]
}

interface State {
  // 布局
  currentLayoutId: string
  /** 运行时生成的自定义布局 */
  customLayouts: Record<string, LayoutDef>
  aspectRatio: string
  // 单元格图片，按索引存储
  imagesData: Record<number, CellImage>
  activeCellId: number | null
  /** 列宽比例（fr），空数组表示等分 */
  colFractions: number[]
  /** 行高比例（fr），空数组表示等分 */
  rowFractions: number[]

  // 样式
  spacing: number
  radius: number
  border: BorderWidths
  bgColor: string
  bgImage: string | null

  // 标注
  texts: TextEl[]
  arrows: ArrowEl[]
  rectangles: ShapeEl[]
  ellipses: ShapeEl[]
  selectedTextId: string | null
  selectedArrowId: string | null
  selectedRectangleId: string | null
  selectedEllipseId: string | null

  // 水印 / 导出
  watermark: Watermark
  downloadQuality: Quality

  // UI
  leftCollapsed: boolean
  rightCollapsed: boolean
  leftMobileOpen: boolean
  rightMobileOpen: boolean
  toast: ToastState

  // ---- actions ----
  setLayout: (id: string) => void
  /** 应用自定义布局编辑器产出的布局定义 */
  applyEditorLayout: (def: LayoutDef) => void
  setAspectRatio: (r: string) => void

  setCellImage: (index: number, img: CellImage) => void
  addFiles: (files: File[]) => Promise<void>
  replaceCellImage: (index: number, file: File) => Promise<void>
  removeCellImage: (index: number) => void
  swapCells: (a: number, b: number) => void
  panCell: (index: number, dxPct: number, dyPct: number) => void
  zoomCell: (index: number, delta: number) => void
  selectCell: (index: number | null) => void
  shuffle: () => void
  clearCanvas: () => void
  resetSettings: () => void

  setColFractions: (arr: number[]) => void
  setRowFractions: (arr: number[]) => void
  setSpacing: (v: number) => void
  setRadius: (v: number) => void
  setBorder: (side: keyof BorderWidths, v: number) => void
  setBgColor: (c: string) => void
  setBgImage: (src: string | null) => void

  updateWatermark: (partial: Partial<Watermark>) => void
  setQuality: (q: Quality) => void

  // 标注
  addText: () => void
  updateText: (id: string, partial: Partial<TextEl>) => void
  deleteText: (id: string) => void
  selectText: (id: string | null) => void

  addArrow: () => void
  updateArrow: (id: string, partial: Partial<ArrowEl>) => void
  deleteArrow: (id: string) => void
  selectArrow: (id: string | null) => void

  addRectangle: () => void
  updateRectangle: (id: string, partial: Partial<ShapeEl>) => void
  deleteRectangle: (id: string) => void
  selectRectangle: (id: string | null) => void

  addEllipse: () => void
  updateEllipse: (id: string, partial: Partial<ShapeEl>) => void
  deleteEllipse: (id: string) => void
  selectEllipse: (id: string | null) => void

  deselectAll: () => void

  // UI
  toggleLeft: () => void
  toggleRight: () => void
  setLeftMobileOpen: (open: boolean) => void
  setRightMobileOpen: (open: boolean) => void
  showToast: (message: string, type?: ToastState['type']) => void
  hideToast: () => void
}

/** 读取文件为 DataURL */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const newImage = (src: string, filename?: string): CellImage => ({
  src,
  posX: 50,
  posY: 50,
  scale: 1,
  filename,
})

export const useStore = create<State>((set, get) => ({
  currentLayoutId: '1-full',
  customLayouts: {},
  aspectRatio: '1/1',
  imagesData: {},
  activeCellId: null,
  colFractions: [],
  rowFractions: [],

  spacing: 10,
  radius: 8,
  border: { ...DEFAULT_BORDER },
  bgColor: '#FFFFFF',
  bgImage: null,

  texts: [],
  arrows: [],
  rectangles: [],
  ellipses: [],
  selectedTextId: null,
  selectedArrowId: null,
  selectedRectangleId: null,
  selectedEllipseId: null,

  watermark: { ...DEFAULT_WATERMARK },
  downloadQuality: 'high-jpg',

  leftCollapsed: false,
  rightCollapsed: false,
  leftMobileOpen: false,
  rightMobileOpen: false,
  toast: { message: '', type: 'info', visible: false, key: 0 },

  setLayout: (id) => {
    const def = LAYOUTS[id] || get().customLayouts[id]
    if (!def) {
      return
    }
    set({ currentLayoutId: id, activeCellId: null, colFractions: [], rowFractions: [] })
  },

  applyEditorLayout: (def) => {
    const id = uid('custom')
    // 与原站一致：自定义布局为会话级，仅保留当前确认的这一个，刷新后消失
    set({
      customLayouts: { [id]: def },
      currentLayoutId: id,
      imagesData: {},
      activeCellId: null,
      colFractions: [],
      rowFractions: [],
    })
  },

  setAspectRatio: (r) => set({ aspectRatio: r }),

  setCellImage: (index, img) =>
    set((s) => ({ imagesData: { ...s.imagesData, [index]: img } })),

  addFiles: async (files) => {
    if (!files.length) {
      return
    }
    const def = LAYOUTS[get().currentLayoutId]
    const total = cellCountOf(def)
    const data = { ...get().imagesData }
    let cursor = 0
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue
      }
      // 找下一个空单元格
      while (cursor < total && data[cursor]) {
        cursor++
      }
      if (cursor >= total) {
        break
      }
      const src = await readFileAsDataURL(file)
      data[cursor] = newImage(src, file.name)
      cursor++
    }
    set({ imagesData: data })
  },

  replaceCellImage: async (index, file) => {
    if (!file.type.startsWith('image/')) {
      return
    }
    const src = await readFileAsDataURL(file)
    set((s) => ({ imagesData: { ...s.imagesData, [index]: newImage(src, file.name) } }))
  },

  removeCellImage: (index) =>
    set((s) => {
      const data = { ...s.imagesData }
      delete data[index]
      return { imagesData: data, activeCellId: s.activeCellId === index ? null : s.activeCellId }
    }),

  swapCells: (a, b) =>
    set((s) => {
      const data = { ...s.imagesData }
      const tmp = data[a]
      if (data[b]) {
        data[a] = data[b]
      } else {
        delete data[a]
      }
      if (tmp) {
        data[b] = tmp
      } else {
        delete data[b]
      }
      return { imagesData: data }
    }),

  panCell: (index, dxPct, dyPct) =>
    set((s) => {
      const img = s.imagesData[index]
      if (!img) {
        return {}
      }
      const posX = Math.max(0, Math.min(100, img.posX + dxPct))
      const posY = Math.max(0, Math.min(100, img.posY + dyPct))
      return { imagesData: { ...s.imagesData, [index]: { ...img, posX, posY } } }
    }),

  zoomCell: (index, delta) =>
    set((s) => {
      const img = s.imagesData[index]
      if (!img) {
        return {}
      }
      const scale = Math.max(1, Math.min(5, img.scale + delta))
      return { imagesData: { ...s.imagesData, [index]: { ...img, scale } } }
    }),

  selectCell: (index) =>
    set({
      activeCellId: index,
      selectedTextId: null,
      selectedArrowId: null,
      selectedRectangleId: null,
      selectedEllipseId: null,
    }),

  shuffle: () =>
    set((s) => {
      const entries = Object.values(s.imagesData)
      if (entries.length < 2) {
        return {}
      }
      // Fisher-Yates 洗牌
      const arr = [...entries]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      const data: Record<number, CellImage> = {}
      const keys = Object.keys(s.imagesData).map(Number)
      keys.forEach((k, i) => {
        data[k] = arr[i]
      })
      return { imagesData: data }
    }),

  clearCanvas: () =>
    set({
      imagesData: {},
      activeCellId: null,
      texts: [],
      arrows: [],
      rectangles: [],
      ellipses: [],
      selectedTextId: null,
      selectedArrowId: null,
      selectedRectangleId: null,
      selectedEllipseId: null,
    }),

  resetSettings: () =>
    set({
      spacing: 10,
      radius: 8,
      border: { ...DEFAULT_BORDER },
      bgColor: '#FFFFFF',
      bgImage: null,
      aspectRatio: '1/1',
      watermark: { ...DEFAULT_WATERMARK },
      downloadQuality: 'high-jpg',
    }),

  setColFractions: (arr) => set({ colFractions: arr }),
  setRowFractions: (arr) => set({ rowFractions: arr }),
  setSpacing: (v) => set({ spacing: v }),
  setRadius: (v) => set({ radius: v }),
  setBorder: (side, v) => set((s) => ({ border: { ...s.border, [side]: v } })),
  setBgColor: (c) => set({ bgColor: c }),
  setBgImage: (src) => set({ bgImage: src }),

  updateWatermark: (partial) => set((s) => ({ watermark: { ...s.watermark, ...partial } })),
  setQuality: (q) => set({ downloadQuality: q }),

  // ---- 文字 ----
  addText: () =>
    set((s) => {
      const off = (s.texts.length % 6) * 24
      const el: TextEl = {
        id: uid('text'),
        x: 160 + off,
        y: 90 + off,
        content: '双击编辑文字',
        color: '#ffffff',
        fontSize: 28,
      }
      return { texts: [...s.texts, el], selectedTextId: el.id }
    }),
  updateText: (id, partial) =>
    set((s) => ({ texts: s.texts.map((t) => (t.id === id ? { ...t, ...partial } : t)) })),
  deleteText: (id) =>
    set((s) => ({
      texts: s.texts.filter((t) => t.id !== id),
      selectedTextId: s.selectedTextId === id ? null : s.selectedTextId,
    })),
  selectText: (id) =>
    set({
      selectedTextId: id,
      selectedArrowId: null,
      selectedRectangleId: null,
      selectedEllipseId: null,
      activeCellId: null,
    }),

  // ---- 箭头 ----
  addArrow: () =>
    set((s) => {
      const off = (s.arrows.length % 6) * 24
      const el: ArrowEl = {
        id: uid('arrow'),
        x1: 120 + off,
        y1: 200 + off,
        x2: 260 + off,
        y2: 200 + off,
        color: '#ef4444',
        strokeWidth: 6,
      }
      return { arrows: [...s.arrows, el], selectedArrowId: el.id }
    }),
  updateArrow: (id, partial) =>
    set((s) => ({ arrows: s.arrows.map((a) => (a.id === id ? { ...a, ...partial } : a)) })),
  deleteArrow: (id) =>
    set((s) => ({
      arrows: s.arrows.filter((a) => a.id !== id),
      selectedArrowId: s.selectedArrowId === id ? null : s.selectedArrowId,
    })),
  selectArrow: (id) =>
    set({
      selectedArrowId: id,
      selectedTextId: null,
      selectedRectangleId: null,
      selectedEllipseId: null,
      activeCellId: null,
    }),

  // ---- 矩形 ----
  addRectangle: () =>
    set((s) => {
      const off = (s.rectangles.length % 6) * 24
      const el: ShapeEl = {
        id: uid('rect'),
        x: 90 + off,
        y: 120 + off,
        w: 160,
        h: 110,
        color: '#ef4444',
        strokeWidth: 4,
      }
      return { rectangles: [...s.rectangles, el], selectedRectangleId: el.id }
    }),
  updateRectangle: (id, partial) =>
    set((s) => ({
      rectangles: s.rectangles.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    })),
  deleteRectangle: (id) =>
    set((s) => ({
      rectangles: s.rectangles.filter((r) => r.id !== id),
      selectedRectangleId: s.selectedRectangleId === id ? null : s.selectedRectangleId,
    })),
  selectRectangle: (id) =>
    set({
      selectedRectangleId: id,
      selectedTextId: null,
      selectedArrowId: null,
      selectedEllipseId: null,
      activeCellId: null,
    }),

  // ---- 椭圆 ----
  addEllipse: () =>
    set((s) => {
      const off = (s.ellipses.length % 6) * 24
      const el: ShapeEl = {
        id: uid('ellipse'),
        x: 260 + off,
        y: 260 + off,
        w: 160,
        h: 110,
        color: '#ef4444',
        strokeWidth: 4,
      }
      return { ellipses: [...s.ellipses, el], selectedEllipseId: el.id }
    }),
  updateEllipse: (id, partial) =>
    set((s) => ({
      ellipses: s.ellipses.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    })),
  deleteEllipse: (id) =>
    set((s) => ({
      ellipses: s.ellipses.filter((e) => e.id !== id),
      selectedEllipseId: s.selectedEllipseId === id ? null : s.selectedEllipseId,
    })),
  selectEllipse: (id) =>
    set({
      selectedEllipseId: id,
      selectedTextId: null,
      selectedArrowId: null,
      selectedRectangleId: null,
      activeCellId: null,
    }),

  deselectAll: () =>
    set({
      selectedTextId: null,
      selectedArrowId: null,
      selectedRectangleId: null,
      selectedEllipseId: null,
      activeCellId: null,
    }),

  // ---- UI ----
  toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setLeftMobileOpen: (open) => set({ leftMobileOpen: open }),
  setRightMobileOpen: (open) => set({ rightMobileOpen: open }),
  showToast: (message, type = 'info') =>
    set((s) => ({ toast: { message, type, visible: true, key: s.toast.key + 1 } })),
  hideToast: () => set((s) => ({ toast: { ...s.toast, visible: false } })),
}))

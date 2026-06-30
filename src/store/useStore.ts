import { create } from "zustand";
import { LAYOUTS, type LayoutDef } from "../data/layouts";

/** 单元格图片数据：背景定位（百分比）与缩放 */
export interface CellImage {
  src: string;
  /** background-position-x，0-100 */
  posX: number;
  /** background-position-y，0-100 */
  posY: number;
  /** 缩放系数，1 = cover */
  scale: number;
  filename?: string;
}

export type Quality = "high-jpg" | "medium-jpg" | "png";

export type Density =
  | "low"
  | "medium"
  | "high"
  | "top-left"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-right";

/** 画布绘图工具 */
export type ToolType =
  | "select"
  | "brush"
  | "text"
  | "rect"
  | "ellipse"
  | "triangle"
  | "star"
  | "heart"
  | "line"
  | "arrow";

/** 形状种类 */
export type ShapeKind = "rect" | "ellipse" | "triangle" | "star" | "heart";

/** 线性元素种类 */
export type LinearKind = "line" | "arrow";

export interface TextEl {
  id: string;
  /** 相对画布的像素坐标（中心点） */
  x: number;
  y: number;
  content: string;
  color: string;
  fontSize: number;
}

export interface ShapeEl {
  id: string;
  kind: ShapeKind;
  /** 左上角像素坐标 */
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
  /** 是否填充（false = 仅描边） */
  filled: boolean;
}

export interface LinearEl {
  id: string;
  kind: LinearKind;
  /** 起点像素坐标 */
  x1: number;
  y1: number;
  /** 终点像素坐标 */
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface BrushEl {
  id: string;
  /** 包围盒左上角（整体拖动偏移） */
  x: number;
  y: number;
  /** 相对 (x,y) 的采样点 */
  points: Array<[number, number]>;
  color: string;
  strokeWidth: number;
}

/** 标注历史快照（仅画布标注，用于撤销/重做） */
export interface AnnoSnapshot {
  texts: TextEl[];
  shapes: ShapeEl[];
  linears: LinearEl[];
  brushes: BrushEl[];
}

export interface BorderWidths {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Watermark {
  enabled: boolean;
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  density: Density;
  color: string;
}

export interface ToastState {
  message: string;
  type: "success" | "info" | "error" | "warning";
  visible: boolean;
  /** 自增 key，用于重复触发同一条消息时重启动画 */
  key: number;
}

const DEFAULT_BORDER: BorderWidths = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
};
const DEFAULT_WATERMARK: Watermark = {
  enabled: false,
  text: "默认水印",
  fontSize: 20,
  opacity: 0.25,
  rotation: 45,
  density: "medium",
  color: "#000000",
};

let _uid = 0;
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(_uid++).toString(36)}`;

/** 深拷贝四类标注，避免历史栈共享引用 */
function snapshotAnno(s: {
  texts: TextEl[];
  shapes: ShapeEl[];
  linears: LinearEl[];
  brushes: BrushEl[];
}): AnnoSnapshot {
  return {
    texts: s.texts.map((t) => ({ ...t })),
    shapes: s.shapes.map((x) => ({ ...x })),
    linears: s.linears.map((x) => ({ ...x })),
    brushes: s.brushes.map((b) => ({
      ...b,
      points: b.points.map((p) => [p[0], p[1]] as [number, number]),
    })),
  };
}

const EMPTY_SNAPSHOT: AnnoSnapshot = {
  texts: [],
  shapes: [],
  linears: [],
  brushes: [],
};

/** 计算某个布局的单元格数量 */
export function cellCountOf(def: LayoutDef): number {
  return def.c ? def.c.length : def.gr[0] * def.gr[1];
}

interface State {
  // 布局
  currentLayoutId: string;
  /** 运行时生成的自定义布局 */
  customLayouts: Record<string, LayoutDef>;
  aspectRatio: string;
  // 单元格图片，按索引存储
  imagesData: Record<number, CellImage>;
  activeCellId: number | null;
  /** 列宽比例（fr），空数组表示等分 */
  colFractions: number[];
  /** 行高比例（fr），空数组表示等分 */
  rowFractions: number[];

  // 样式
  spacing: number;
  radius: number;
  border: BorderWidths;
  bgColor: string;
  bgImage: string | null;

  // 标注
  texts: TextEl[];
  shapes: ShapeEl[];
  linears: LinearEl[];
  brushes: BrushEl[];
  selectedTextId: string | null;
  selectedShapeId: string | null;
  selectedLinearId: string | null;
  selectedBrushId: string | null;

  // 标注历史（撤销/重做）
  annoHistory: AnnoSnapshot[];
  annoHistoryStep: number;

  // 绘图工具
  activeTool: ToolType;
  drawColor: string;
  drawStrokeWidth: number;
  drawFilled: boolean;

  // 水印 / 导出
  watermark: Watermark;
  downloadQuality: Quality;

  // UI
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  leftMobileOpen: boolean;
  rightMobileOpen: boolean;
  toast: ToastState;

  // ---- actions ----
  setLayout: (id: string) => void;
  /** 应用自定义布局编辑器产出的布局定义 */
  applyEditorLayout: (def: LayoutDef) => void;
  setAspectRatio: (r: string) => void;

  setCellImage: (index: number, img: CellImage) => void;
  addFiles: (files: File[]) => Promise<void>;
  replaceCellImage: (index: number, file: File) => Promise<void>;
  removeCellImage: (index: number) => void;
  swapCells: (a: number, b: number) => void;
  panCell: (index: number, dxPct: number, dyPct: number) => void;
  zoomCell: (index: number, delta: number) => void;
  selectCell: (index: number | null) => void;
  shuffle: () => void;
  clearCanvas: () => void;
  resetSettings: () => void;

  setColFractions: (arr: number[]) => void;
  setRowFractions: (arr: number[]) => void;
  setSpacing: (v: number) => void;
  setRadius: (v: number) => void;
  setBorder: (side: keyof BorderWidths, v: number) => void;
  setBgColor: (c: string) => void;
  setBgImage: (src: string | null) => void;

  updateWatermark: (partial: Partial<Watermark>) => void;
  setQuality: (q: Quality) => void;

  // 绘图工具
  setActiveTool: (t: ToolType) => void;
  setDrawColor: (c: string) => void;
  setDrawStrokeWidth: (n: number) => void;
  setDrawFilled: (b: boolean) => void;

  // 标注
  addText: (pos: { x: number; y: number }) => void;
  updateText: (id: string, partial: Partial<TextEl>) => void;
  deleteText: (id: string) => void;
  selectText: (id: string | null) => void;

  addShape: (
    kind: ShapeKind,
    rect: { x: number; y: number; w: number; h: number },
  ) => void;
  updateShape: (id: string, partial: Partial<ShapeEl>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;

  addLinear: (
    kind: LinearKind,
    pts: { x1: number; y1: number; x2: number; y2: number },
  ) => void;
  updateLinear: (id: string, partial: Partial<LinearEl>) => void;
  deleteLinear: (id: string) => void;
  selectLinear: (id: string | null) => void;

  addBrush: (data: {
    x: number;
    y: number;
    points: Array<[number, number]>;
  }) => void;
  updateBrush: (id: string, partial: Partial<BrushEl>) => void;
  deleteBrush: (id: string) => void;
  selectBrush: (id: string | null) => void;

  deselectAll: () => void;

  commitHistory: () => void;
  undo: () => void;
  redo: () => void;

  // UI
  toggleLeft: () => void;
  toggleRight: () => void;
  setLeftMobileOpen: (open: boolean) => void;
  setRightMobileOpen: (open: boolean) => void;
  showToast: (message: string, type?: ToastState["type"]) => void;
  hideToast: () => void;
}

/** 读取文件为 DataURL */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const newImage = (src: string, filename?: string): CellImage => ({
  src,
  posX: 50,
  posY: 50,
  scale: 1,
  filename,
});

export const useStore = create<State>((set, get) => ({
  currentLayoutId: "1-full",
  customLayouts: {},
  aspectRatio: "1/1",
  imagesData: {},
  activeCellId: null,
  colFractions: [],
  rowFractions: [],

  spacing: 10,
  radius: 8,
  border: { ...DEFAULT_BORDER },
  bgColor: "#FFFFFF",
  bgImage: null,

  texts: [],
  shapes: [],
  linears: [],
  brushes: [],
  selectedTextId: null,
  selectedShapeId: null,
  selectedLinearId: null,
  selectedBrushId: null,

  annoHistory: [EMPTY_SNAPSHOT],
  annoHistoryStep: 0,

  activeTool: "select",
  drawColor: "#ef4444",
  drawStrokeWidth: 4,
  drawFilled: false,

  watermark: { ...DEFAULT_WATERMARK },
  downloadQuality: "high-jpg",

  leftCollapsed: false,
  rightCollapsed: false,
  leftMobileOpen: false,
  rightMobileOpen: false,
  toast: { message: "", type: "info", visible: false, key: 0 },

  setLayout: (id) => {
    const def = LAYOUTS[id] || get().customLayouts[id];
    if (!def) {
      return;
    }
    set({
      currentLayoutId: id,
      activeCellId: null,
      colFractions: [],
      rowFractions: [],
    });
  },

  applyEditorLayout: (def) => {
    const id = uid("custom");
    // 与原站一致：自定义布局为会话级，仅保留当前确认的这一个，刷新后消失
    set({
      customLayouts: { [id]: def },
      currentLayoutId: id,
      imagesData: {},
      activeCellId: null,
      colFractions: [],
      rowFractions: [],
    });
  },

  setAspectRatio: (r) => set({ aspectRatio: r }),

  setCellImage: (index, img) =>
    set((s) => ({ imagesData: { ...s.imagesData, [index]: img } })),

  addFiles: async (files) => {
    if (!files.length) {
      return;
    }
    const def = LAYOUTS[get().currentLayoutId];
    const total = cellCountOf(def);
    const data = { ...get().imagesData };
    let cursor = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      // 找下一个空单元格
      while (cursor < total && data[cursor]) {
        cursor++;
      }
      if (cursor >= total) {
        break;
      }
      const src = await readFileAsDataURL(file);
      data[cursor] = newImage(src, file.name);
      cursor++;
    }
    set({ imagesData: data });
  },

  replaceCellImage: async (index, file) => {
    if (!file.type.startsWith("image/")) {
      return;
    }
    const src = await readFileAsDataURL(file);
    set((s) => ({
      imagesData: { ...s.imagesData, [index]: newImage(src, file.name) },
    }));
  },

  removeCellImage: (index) =>
    set((s) => {
      const data = { ...s.imagesData };
      delete data[index];
      return {
        imagesData: data,
        activeCellId: s.activeCellId === index ? null : s.activeCellId,
      };
    }),

  swapCells: (a, b) =>
    set((s) => {
      const data = { ...s.imagesData };
      const tmp = data[a];
      if (data[b]) {
        data[a] = data[b];
      } else {
        delete data[a];
      }
      if (tmp) {
        data[b] = tmp;
      } else {
        delete data[b];
      }
      return { imagesData: data };
    }),

  panCell: (index, dxPct, dyPct) =>
    set((s) => {
      const img = s.imagesData[index];
      if (!img) {
        return {};
      }
      const posX = Math.max(0, Math.min(100, img.posX + dxPct));
      const posY = Math.max(0, Math.min(100, img.posY + dyPct));
      return {
        imagesData: { ...s.imagesData, [index]: { ...img, posX, posY } },
      };
    }),

  zoomCell: (index, delta) =>
    set((s) => {
      const img = s.imagesData[index];
      if (!img) {
        return {};
      }
      const scale = Math.max(1, Math.min(5, img.scale + delta));
      return { imagesData: { ...s.imagesData, [index]: { ...img, scale } } };
    }),

  selectCell: (index) =>
    set({
      activeCellId: index,
      selectedTextId: null,
      selectedShapeId: null,
      selectedLinearId: null,
      selectedBrushId: null,
    }),

  shuffle: () =>
    set((s) => {
      const entries = Object.values(s.imagesData);
      if (entries.length < 2) {
        return {};
      }
      // Fisher-Yates 洗牌
      const arr = [...entries];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      const data: Record<number, CellImage> = {};
      const keys = Object.keys(s.imagesData).map(Number);
      keys.forEach((k, i) => {
        data[k] = arr[i];
      });
      return { imagesData: data };
    }),

  clearCanvas: () =>
    set({
      imagesData: {},
      activeCellId: null,
      texts: [],
      shapes: [],
      linears: [],
      brushes: [],
      selectedTextId: null,
      selectedShapeId: null,
      selectedLinearId: null,
      selectedBrushId: null,
      activeTool: "select",
      annoHistory: [EMPTY_SNAPSHOT],
      annoHistoryStep: 0,
    }),

  resetSettings: () =>
    set({
      spacing: 10,
      radius: 8,
      border: { ...DEFAULT_BORDER },
      bgColor: "#FFFFFF",
      bgImage: null,
      aspectRatio: "1/1",
      watermark: { ...DEFAULT_WATERMARK },
      downloadQuality: "high-jpg",
    }),

  setColFractions: (arr) => set({ colFractions: arr }),
  setRowFractions: (arr) => set({ rowFractions: arr }),
  setSpacing: (v) => set({ spacing: v }),
  setRadius: (v) => set({ radius: v }),
  setBorder: (side, v) => set((s) => ({ border: { ...s.border, [side]: v } })),
  setBgColor: (c) => set({ bgColor: c }),
  setBgImage: (src) => set({ bgImage: src }),

  updateWatermark: (partial) =>
    set((s) => ({ watermark: { ...s.watermark, ...partial } })),
  setQuality: (q) => set({ downloadQuality: q }),

  // ---- 绘图工具 ----
  setActiveTool: (t) =>
    set(
      t === "select"
        ? { activeTool: t }
        : {
            activeTool: t,
            selectedTextId: null,
            selectedShapeId: null,
            selectedLinearId: null,
            selectedBrushId: null,
            activeCellId: null,
          },
    ),
  setDrawColor: (c) => set({ drawColor: c }),
  setDrawStrokeWidth: (n) => set({ drawStrokeWidth: n }),
  setDrawFilled: (b) => set({ drawFilled: b }),

  // ---- 文字 ----
  addText: (pos) =>
    set((s) => {
      const el: TextEl = {
        id: uid("text"),
        x: pos.x,
        y: pos.y,
        content: "",
        color: s.drawColor,
        fontSize: 28,
      };
      return { texts: [...s.texts, el], selectedTextId: el.id };
    }),
  updateText: (id, partial) =>
    set((s) => ({
      texts: s.texts.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    })),
  deleteText: (id) =>
    set((s) => ({
      texts: s.texts.filter((t) => t.id !== id),
      selectedTextId: s.selectedTextId === id ? null : s.selectedTextId,
    })),
  selectText: (id) =>
    set({
      selectedTextId: id,
      selectedShapeId: null,
      selectedLinearId: null,
      selectedBrushId: null,
      activeCellId: null,
    }),

  // ---- 形状（矩形/椭圆/三角/五角星/心形）----
  addShape: (kind, rect) =>
    set((s) => {
      const el: ShapeEl = {
        id: uid("shape"),
        kind,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        color: s.drawColor,
        strokeWidth: s.drawStrokeWidth,
        filled: s.drawFilled,
      };
      return { shapes: [...s.shapes, el], selectedShapeId: null };
    }),
  updateShape: (id, partial) =>
    set((s) => ({
      shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...partial } : sh)),
    })),
  deleteShape: (id) =>
    set((s) => ({
      shapes: s.shapes.filter((sh) => sh.id !== id),
      selectedShapeId: s.selectedShapeId === id ? null : s.selectedShapeId,
    })),
  selectShape: (id) =>
    set({
      selectedShapeId: id,
      selectedTextId: null,
      selectedLinearId: null,
      selectedBrushId: null,
      activeCellId: null,
    }),

  // ---- 线性（直线/箭头）----
  addLinear: (kind, pts) =>
    set((s) => {
      const el: LinearEl = {
        id: uid("linear"),
        kind,
        x1: pts.x1,
        y1: pts.y1,
        x2: pts.x2,
        y2: pts.y2,
        color: s.drawColor,
        strokeWidth: s.drawStrokeWidth,
      };
      return { linears: [...s.linears, el], selectedLinearId: null };
    }),
  updateLinear: (id, partial) =>
    set((s) => ({
      linears: s.linears.map((l) => (l.id === id ? { ...l, ...partial } : l)),
    })),
  deleteLinear: (id) =>
    set((s) => ({
      linears: s.linears.filter((l) => l.id !== id),
      selectedLinearId: s.selectedLinearId === id ? null : s.selectedLinearId,
    })),
  selectLinear: (id) =>
    set({
      selectedLinearId: id,
      selectedTextId: null,
      selectedShapeId: null,
      selectedBrushId: null,
      activeCellId: null,
    }),

  // ---- 画笔 ----
  addBrush: (data) =>
    set((s) => {
      const el: BrushEl = {
        id: uid("brush"),
        x: data.x,
        y: data.y,
        points: data.points,
        color: s.drawColor,
        strokeWidth: s.drawStrokeWidth,
      };
      return { brushes: [...s.brushes, el], selectedBrushId: null };
    }),
  updateBrush: (id, partial) =>
    set((s) => ({
      brushes: s.brushes.map((b) => (b.id === id ? { ...b, ...partial } : b)),
    })),
  deleteBrush: (id) =>
    set((s) => ({
      brushes: s.brushes.filter((b) => b.id !== id),
      selectedBrushId: s.selectedBrushId === id ? null : s.selectedBrushId,
    })),
  selectBrush: (id) =>
    set({
      selectedBrushId: id,
      selectedTextId: null,
      selectedShapeId: null,
      selectedLinearId: null,
      activeCellId: null,
    }),

  deselectAll: () =>
    set({
      selectedTextId: null,
      selectedShapeId: null,
      selectedLinearId: null,
      selectedBrushId: null,
      activeCellId: null,
    }),

  commitHistory: () =>
    set((s) => {
      const base = s.annoHistory.slice(0, s.annoHistoryStep + 1);
      const next = [...base, snapshotAnno(s)];
      // 限制历史长度，避免无限增长
      const capped = next.length > 100 ? next.slice(next.length - 100) : next;
      return { annoHistory: capped, annoHistoryStep: capped.length - 1 };
    }),

  undo: () =>
    set((s) => {
      if (s.annoHistoryStep <= 0) {
        return {};
      }
      const step = s.annoHistoryStep - 1;
      const snap = s.annoHistory[step];
      return {
        texts: snap.texts.map((t) => ({ ...t })),
        shapes: snap.shapes.map((x) => ({ ...x })),
        linears: snap.linears.map((x) => ({ ...x })),
        brushes: snap.brushes.map((b) => ({
          ...b,
          points: b.points.map((p) => [p[0], p[1]] as [number, number]),
        })),
        annoHistoryStep: step,
        selectedTextId: null,
        selectedShapeId: null,
        selectedLinearId: null,
        selectedBrushId: null,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.annoHistoryStep >= s.annoHistory.length - 1) {
        return {};
      }
      const step = s.annoHistoryStep + 1;
      const snap = s.annoHistory[step];
      return {
        texts: snap.texts.map((t) => ({ ...t })),
        shapes: snap.shapes.map((x) => ({ ...x })),
        linears: snap.linears.map((x) => ({ ...x })),
        brushes: snap.brushes.map((b) => ({
          ...b,
          points: b.points.map((p) => [p[0], p[1]] as [number, number]),
        })),
        annoHistoryStep: step,
        selectedTextId: null,
        selectedShapeId: null,
        selectedLinearId: null,
        selectedBrushId: null,
      };
    }),

  // ---- UI ----
  toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setLeftMobileOpen: (open) => set({ leftMobileOpen: open }),
  setRightMobileOpen: (open) => set({ rightMobileOpen: open }),
  showToast: (message, type = "info") =>
    set((s) => ({
      toast: { message, type, visible: true, key: s.toast.key + 1 },
    })),
  hideToast: () => set((s) => ({ toast: { ...s.toast, visible: false } })),
}));

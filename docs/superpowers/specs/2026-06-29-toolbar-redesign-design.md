# 画布工具栏改造设计文档

- 日期：2026-06-29
- 范围：image-splice 拼图工具的画布标注工具栏（`#canvas-action-toolbar`）重构 + 新增绘图工具
- 参考：`D:\code\demo\my-game\draw-guess` 的工具栏视觉与形状几何算法

## 1. 背景与目标

当前 `CanvasToolbar.tsx` 仅有「文字 / 箭头 / 方框 / 圆圈 + 随机 / 清除」六个朴素按钮，交互为「点一下即在画布中央生成默认图形再拖动」，视觉简陋、工具种类少。

目标：参考 draw-guess 改造成更专业的绘图工具栏，**改为「选中工具 → 在画布上按住拖拽绘制」范式**，工具集为：选择、画笔、文本、矩形、圆形、三角形、五角星、心形、直线、箭头；保留 image-splice 现有的「元素可拖动 / 缩放 / 选中后删除」能力，并保留「随机 / 清除」。

## 2. 现状架构（image-splice）

- 状态：Zustand store（`src/store/useStore.ts`）。标注元素分四个数组：`texts / arrows / rectangles / ellipses`，各有 `selectedXxxId`。
- 元素类型：
  - `TextEl { id, x, y, content, color, fontSize }`
  - `ArrowEl { id, x1, y1, x2, y2, color, strokeWidth }`
  - `ShapeEl { id, x, y, w, h, color, strokeWidth }`（rect / ellipse 共用，靠 `kind` prop 区分）
- 渲染：`Canvas.tsx` 在 `#layout-wrapper` 内遍历渲染各元素组件。坐标为相对 wrapper 的**绝对像素，无 CSS 缩放**（wrapper 尺寸 = 计算出的 size.w × size.h）。
- 单元素组件：`annotations/{TextElement,ArrowElement,ShapeElement}.tsx`，用 Pointer Events 实现拖动 / 缩放端点；选中态用 CSS 类（绿色 `#03de6d`）+ 删除按钮 + 手柄。
- 形状渲染：CSS `border` + `borderRadius`，只能矩形 / 椭圆。
- 导出：`export.ts` 用 **html2canvas** 对 `#layout-wrapper` 整体截图（`window.__collageWrapper`）。导出前 `deselectAll()` 已去除选中态 UI。
- 图标：`lib/icons.tsx`，统一 `Icon` 基组件（SVG，viewBox `0 0 24 24`，props `size`/`strokeWidth`）。

## 3. 已确认的设计决策

1. 创建方式：**全部改成「画布拖拽绘制」**（选中工具 → 画布按住拖拽 → 松手生成元素）。
2. 参数选择器（颜色 / 线宽 / 填充开关）：**常驻工具栏**。
3. 画完一个图形（松手）后：**自动切回「选择」工具**。
4. 生成的元素仍是 DOM 元素，沿用现有拖动 / 缩放 / 删除。

## 4. 总体架构

新增一个**工具激活态** + **画布绘制覆盖层**，把「创建元素」的职责从工具栏按钮转移到画布拖拽：

```
工具栏(CanvasToolbar) --setActiveTool--> store.activeTool
                                              |
画布(Canvas) 内挂 DrawingLayer 覆盖层 <--------+
   activeTool === 'select'  -> 覆盖层 pointer-events:none（穿透，可点选/拖动已有元素）
   activeTool !== 'select'  -> 覆盖层 pointer-events:auto（捕获拖拽，画实时预览）
                              pointerup: 提交元素到 store + setActiveTool('select')
```

### 4.1 store 变更（`useStore.ts`）

新增工具与绘制参数状态：

```ts
export type ToolType =
  | 'select' | 'brush' | 'text'
  | 'rect' | 'ellipse' | 'triangle' | 'star' | 'heart'
  | 'line' | 'arrow'

// state
activeTool: ToolType            // 默认 'select'
drawColor: string               // 默认 '#ef4444'
drawStrokeWidth: number         // 默认 4
drawFilled: boolean             // 默认 false（形状填充 vs 描边）

// actions
setActiveTool(t: ToolType): void
setDrawColor(c: string): void
setDrawStrokeWidth(n: number): void
setDrawFilled(b: boolean): void
```

### 4.2 元素数据结构变更

为了 DRY 并便于扩展，合并同类元素：

```ts
// 形状：合并 rectangles + ellipses，并支持新形状
export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'star' | 'heart'
export interface ShapeEl {
  id: string
  kind: ShapeKind
  x: number; y: number; w: number; h: number
  color: string
  strokeWidth: number
  filled: boolean
}
shapes: ShapeEl[]              // 取代 rectangles / ellipses
selectedShapeId: string | null

// 线性元素：合并 line + arrow（端点拖动逻辑一致）
export type LinearKind = 'line' | 'arrow'
export interface LinearEl {
  id: string
  kind: LinearKind
  x1: number; y1: number; x2: number; y2: number
  color: string
  strokeWidth: number
}
linears: LinearEl[]           // 取代 arrows
selectedLinearId: string | null

// 画笔：自由手绘
export interface BrushEl {
  id: string
  x: number; y: number        // 整体偏移（用于拖动）
  points: Array<[number, number]>  // 相对 (x,y) 的采样点
  color: string
  strokeWidth: number
}
brushes: BrushEl[]
selectedBrushId: string | null

// TextEl 不变
```

迁移说明：现有 `rectangles/ellipses → shapes`、`arrows → linears`、`selectedRectangleId/selectedEllipseId → selectedShapeId`、`selectedArrowId → selectedLinearId`。需同步 `Canvas.tsx`、`deselectAll`、`clearCanvas`、各 `add/update/delete` action。

**store 持久化检查**：实现前确认 store 是否用 persist 中间件落地到 localStorage。若有，需做旧数据兼容或清空（标注数据一般不持久化，预计无需迁移，但需核实）。

### 4.3 新增 store actions

- 形状：`addShape(kind, rect)`、`updateShape(id, partial)`、`deleteShape(id)`、`selectShape(id)`
- 线性：`addLinear(kind, pts)`、`updateLinear`、`deleteLinear`、`selectLinear`
- 画笔：`addBrush(brush)`、`updateBrush`、`deleteBrush`、`selectBrush`
- 创建型 action 接收绘制层算出的几何（拖拽包围盒 / 端点 / 采样点），不再用「中央默认位置」。
- 创建后由绘制层调用 `setActiveTool('select')` 并选中新元素。

### 4.4 画布绘制覆盖层（新增 `components/DrawingLayer.tsx`）

- 挂在 `#layout-wrapper` 内、所有元素之后，`position:absolute; inset:0; z-index` 最高。
- `activeTool === 'select'` 时 `pointer-events:none`；否则 `auto`。
- 坐标换算：`local = (clientX - wrapperRect.left, clientY - wrapperRect.top)`（无缩放，1:1）。
- 交互按工具分类：
  - **形状类**（rect/ellipse/triangle/star/heart）：pointerdown 记起点 → move 用「起点+当前点」算包围盒，实时预览 → up 调 `addShape(kind, {x,y,w,h})`。小于阈值（如 4px）视为误触不创建。
  - **线性类**（line/arrow）：pointerdown 起点 → move 预览线 → up 调 `addLinear(kind, {x1,y1,x2,y2})`。
  - **画笔**：pointerdown 起点 → move 累积采样点（建议按距离/帧节流）实时预览 polyline → up 把点集（转为相对包围盒原点）+ 包围盒原点提交 `addBrush`。
  - **文本**：pointerdown（点击）即在该点 `addText` 并进入可编辑态（不需要拖拽包围盒）。
- 实时预览：覆盖层内用一个临时 `<svg>` 渲染当前正在画的图形，使用当前 `drawColor/drawStrokeWidth/drawFilled`。
- 每次提交后 `setActiveTool('select')`（决策 3）。

### 4.5 形状几何（新增 `lib/shapes.ts`，移植 draw-guess 公式）

形状以 `viewBox="0 0 w h"` 的 SVG path 渲染，便于随包围盒缩放：

```ts
// 等腰三角形（顶点朝上）
export const svgPathTriangle = (w: number, h: number) =>
  `M ${w / 2} 0 L 0 ${h} L ${w} ${h} Z`

// 五角星
const STAR_INNER = 0.381966
const STAR_TB = 1 + Math.sin((54 * Math.PI) / 180)
const STAR_LR = 2 * Math.cos((18 * Math.PI) / 180)
export function svgPathStar(w: number, h: number): string {
  const cx = w / 2, ryO = h / STAR_TB, cy = ryO
  const rxO = w / STAR_LR, rxI = rxO * STAR_INNER, ryI = ryO * STAR_INNER
  const parts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const outer = i % 2 === 0
    const px = (cx + (outer ? rxO : rxI) * Math.cos(a)).toFixed(2)
    const py = (cy + (outer ? ryO : ryI) * Math.sin(a)).toFixed(2)
    parts.push((i === 0 ? 'M' : 'L') + ` ${px} ${py}`)
  }
  return parts.join(' ') + ' Z'
}

// 心形（6 段三次贝塞尔）
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
```

矩形 / 椭圆继续可用 SVG `<rect>` / `<ellipse>`（统一改 SVG 渲染，描边 `stroke`，填充由 `filled` 决定 `fill`）。

### 4.6 元素组件改造

- `ShapeElement.tsx`：改为 **SVG 渲染**，按 `el.kind` 选 `<rect>/<ellipse>/<path d=...>`；`filled ? fill=color : fill=none, stroke=color`；保留现有 8 向缩放手柄、选中态、删除。SVG 用 `width/height=el.w/el.h` 跟随包围盒，path 用 `lib/shapes.ts` 按 `el.w/el.h` 生成。
- `LinearElement.tsx`（新，替代 `ArrowElement.tsx`）：line 画 `<line>`，arrow 额外画箭头头（移植/沿用现有箭头多边形）；两端点拖动手柄 + 整体拖动 + 删除（沿用 ArrowElement 逻辑）。
- `BrushElement.tsx`（新）：渲染 `<svg>` + `<polyline/path>`（点集），整体拖动改 `x,y`；选中框为点集包围盒；支持删除。**不支持缩放**（YAGNI）。
- `TextElement.tsx`：基本不变；改为由绘制层在点击点创建后进入编辑。

### 4.7 工具栏改造（`CanvasToolbar.tsx` 重写 + `app.css`）

视觉参考 draw-guess：白底圆角条、36px 圆形按钮、分组用细竖线分隔、激活态高亮（绿色系，沿用 `--primary-accent`）。布局：

- 组1：选择(光标)、画笔
- 组2：文本
- 组3：矩形、圆形、三角形、五角星、心形、直线、箭头
- 组4：**颜色色板**（若干预设 + 自定义色）、**线宽**（如 2/4/8/12 几档）、**填充开关**（形状类工具时有效）
- 组5：随机、清除（保留现有逻辑与禁用条件）

激活态：`activeTool === 工具` 时按钮高亮。颜色 / 线宽 / 填充绑定 `drawColor/drawStrokeWidth/drawFilled`。

### 4.8 图标（`lib/icons.tsx` 新增）

新增 `SelectIcon`（光标/箭头指针）、`BrushIcon`、`TriangleIcon`、`StarIcon`、`HeartIcon`、`LineIcon`；沿用统一 `Icon` 基组件风格。

### 4.9 导出（`export.ts`）

无需改动：html2canvas 会渲染 wrapper 内的 SVG 元素。**风险点**：html2canvas 对 SVG `<path>`（三角/星/心/画笔）渲染需实测；若有缺失，备选方案在第 7 节。

## 5. 涉及文件清单

| 文件 | 操作 |
|------|------|
| `src/store/useStore.ts` | 改：ToolType/绘制参数 state、合并 shapes/linears、新增 brushes 及相关 actions |
| `src/components/Canvas.tsx` | 改：渲染 shapes/linears/brushes，挂载 DrawingLayer |
| `src/components/DrawingLayer.tsx` | 新增：绘制覆盖层 |
| `src/components/CanvasToolbar.tsx` | 重写：新工具栏 |
| `src/components/annotations/ShapeElement.tsx` | 改：SVG 渲染 + kind + filled |
| `src/components/annotations/LinearElement.tsx` | 新增：line + arrow（替代 ArrowElement） |
| `src/components/annotations/BrushElement.tsx` | 新增：画笔 |
| `src/components/annotations/TextElement.tsx` | 微调 |
| `src/lib/shapes.ts` | 新增：几何公式 |
| `src/lib/icons.tsx` | 改：新增图标 |
| `src/styles/app.css` | 改：工具栏 + 新元素样式 |
| `src/lib/export.ts` | 预计不改（需导出实测确认） |

## 6. 交互流程（验收标准）

1. 默认激活「选择」工具，可点选 / 拖动 / 缩放 / 删除已有元素（与现状一致）。
2. 点任一绘图工具 → 按钮高亮 → 在画布按住拖拽 → 出现实时预览 → 松手生成元素并**自动切回选择**、新元素选中。
3. 画笔：按住自由手绘，松手成一条可拖动 / 删除的笔迹。
4. 文本：点工具后在画布点击放置可编辑文本框。
5. 颜色 / 线宽 / 填充在绘制前于工具栏设置，新元素采用当前参数。
6. 随机 / 清除功能与现状一致。
7. 导出图片（下载 / 复制）正确包含所有新元素，且不含选中框 / 手柄。

## 7. 风险与权衡

- **html2canvas 对 SVG path 支持**：三角/星/心/画笔若导出缺失或失真。备选：a) 这些形状改用 inline SVG 但确保无 foreignObject；b) 必要时在 `export.ts` 增加针对标注的 canvas 手绘回退。**实现中必须导出实测**。
- **数据结构合并的回归**：合并 rectangles/ellipses/arrows 会触及多处，需保证现有文字/箭头/矩形/椭圆功能不退化。
- **画笔坐标与包围盒**：手绘点集转相对坐标 + 拖动平移需仔细处理。
- **绘制层与单元格交互**：绘制态覆盖层盖住图片单元格属预期；选择态必须穿透，保证单元格上传 / 选中正常。

## 8. 非目标（YAGNI）

- 多笔型（喷枪 / 蜡笔 / 水彩）、油漆桶、橡皮擦、框选。
- 撤销 / 重做（当前项目无，本次不引入）。
- 画笔的缩放 / 旋转、形状旋转。

## 9. 测试与验证

- `npx tsc -b` 类型检查通过（项目无 eslint 依赖，lint 跳过）。
- 浏览器（chrome-devtools）逐工具实测第 6 节全部流程，截图确认。
- 导出实测：下载一张含全部新元素类型的图片，核对渲染正确。

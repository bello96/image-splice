import { useRef, useState } from 'react'
import { useStore, type ShapeKind, type ToolType } from '../store/useStore'
import { shapeToPath, pointsToPath } from '../lib/shapes'

interface Pt {
  x: number
  y: number
}

const SHAPE_TOOLS = ['rect', 'ellipse', 'triangle', 'star', 'heart']
const MIN_SIZE = 4

/** 画布绘制覆盖层：非 select 工具时捕获拖拽、绘制实时预览、松手提交元素 */
export default function DrawingLayer() {
  const activeTool = useStore((s) => s.activeTool)
  const drawColor = useStore((s) => s.drawColor)
  const drawStrokeWidth = useStore((s) => s.drawStrokeWidth)
  const drawFilled = useStore((s) => s.drawFilled)
  const addShape = useStore((s) => s.addShape)
  const addLinear = useStore((s) => s.addLinear)
  const addBrush = useStore((s) => s.addBrush)
  const addText = useStore((s) => s.addText)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const commitHistory = useStore((s) => s.commitHistory)

  const ref = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const [start, setStart] = useState<Pt | null>(null)
  const [cur, setCur] = useState<Pt | null>(null)
  const [points, setPoints] = useState<Pt[]>([])

  if (activeTool === 'select') {
    return null
  }

  const toLocal = (clientX: number, clientY: number): Pt => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) {
      return { x: clientX, y: clientY }
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    const p = toLocal(e.clientX, e.clientY)
    if (activeTool === 'text') {
      // 文字是「创建即编辑」的特例：切回 select，让绘制覆盖层消失，
      // 新建文字可立即聚焦输入、点击编辑、拖动（否则会被 .drawing-layer 遮挡）
      addText({ x: p.x, y: p.y })
      setActiveTool('select')
      return
    }
    drawingRef.current = true
    setStart(p)
    setCur(p)
    setPoints(activeTool === 'brush' ? [p] : [])
    try {
      ref.current?.setPointerCapture(e.pointerId)
    } catch {
      // 合成事件或特殊环境下 setPointerCapture 可能失败，忽略不影响绘制
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) {
      return
    }
    const p = toLocal(e.clientX, e.clientY)
    setCur(p)
    if (activeTool === 'brush') {
      setPoints((prev) => {
        const last = prev[prev.length - 1]
        if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2) {
          return prev
        }
        return [...prev, p]
      })
    }
  }

  const finish = () => {
    if (!drawingRef.current) {
      return
    }
    drawingRef.current = false
    if (activeTool === 'brush') {
      if (points.length >= 2) {
        const raw = points.map((p) => [p.x, p.y] as [number, number])
        let minX = Infinity
        let minY = Infinity
        for (const [x, y] of raw) {
          if (x < minX) {
            minX = x
          }
          if (y < minY) {
            minY = y
          }
        }
        const rel = raw.map(([x, y]) => [x - minX, y - minY] as [number, number])
        addBrush({ x: minX, y: minY, points: rel })
        commitHistory()
      }
    } else if (start && cur) {
      if (activeTool === 'line' || activeTool === 'arrow') {
        if (Math.hypot(cur.x - start.x, cur.y - start.y) >= MIN_SIZE) {
          addLinear(activeTool, { x1: start.x, y1: start.y, x2: cur.x, y2: cur.y })
          commitHistory()
        }
      } else if (SHAPE_TOOLS.includes(activeTool)) {
        const x = Math.min(start.x, cur.x)
        const y = Math.min(start.y, cur.y)
        const w = Math.abs(cur.x - start.x)
        const h = Math.abs(cur.y - start.y)
        if (w >= MIN_SIZE && h >= MIN_SIZE) {
          addShape(activeTool as ShapeKind, { x, y, w, h })
          commitHistory()
        }
      }
    }
    setStart(null)
    setCur(null)
    setPoints([])
  }

  return (
    <div
      ref={ref}
      className="drawing-layer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <DrawPreview
        tool={activeTool}
        start={start}
        cur={cur}
        points={points}
        color={drawColor}
        strokeWidth={drawStrokeWidth}
        filled={drawFilled}
      />
    </div>
  )
}

interface PreviewProps {
  tool: ToolType
  start: Pt | null
  cur: Pt | null
  points: Pt[]
  color: string
  strokeWidth: number
  filled: boolean
}

function DrawPreview({ tool, start, cur, points, color, strokeWidth, filled }: PreviewProps) {
  const sw = strokeWidth
  let content: React.ReactNode = null

  if (tool === 'brush' && points.length >= 1) {
    content = (
      <path
        d={pointsToPath(points.map((p) => [p.x, p.y]))}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  } else if (start && cur) {
    if (tool === 'line' || tool === 'arrow') {
      content = <LinePreview start={start} cur={cur} color={color} sw={sw} arrow={tool === 'arrow'} />
    } else {
      const x = Math.min(start.x, cur.x)
      const y = Math.min(start.y, cur.y)
      const w = Math.abs(cur.x - start.x)
      const h = Math.abs(cur.y - start.y)
      const path = shapeToPath(tool as ShapeKind, w, h)
      const fill = filled ? color : 'none'
      const stroke = filled ? 'none' : color
      const strokeW = filled ? 0 : sw
      content = (
        <g transform={`translate(${x}, ${y})`}>
          {tool === 'rect' && <rect width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeW} />}
          {tool === 'ellipse' && (
            <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
          )}
          {path && <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />}
        </g>
      )
    }
  }

  if (!content) {
    return null
  }
  return (
    <svg
      className="drawing-preview"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      {content}
    </svg>
  )
}

function LinePreview({
  start,
  cur,
  color,
  sw,
  arrow,
}: {
  start: Pt
  cur: Pt
  color: string
  sw: number
  arrow: boolean
}) {
  const angle = Math.atan2(cur.y - start.y, cur.x - start.x)
  const headLen = Math.max(14, sw * 3.2)
  const headW = Math.max(10, sw * 2.4)
  const hx = cur.x - headLen * Math.cos(angle)
  const hy = cur.y - headLen * Math.sin(angle)
  const lineEndX = arrow ? hx : cur.x
  const lineEndY = arrow ? hy : cur.y
  const leftX = hx + headW * Math.cos(angle + Math.PI / 2)
  const leftY = hy + headW * Math.sin(angle + Math.PI / 2)
  const rightX = hx + headW * Math.cos(angle - Math.PI / 2)
  const rightY = hy + headW * Math.sin(angle - Math.PI / 2)
  return (
    <>
      <line x1={start.x} y1={start.y} x2={lineEndX} y2={lineEndY} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {arrow && <polygon points={`${cur.x},${cur.y} ${leftX},${leftY} ${rightX},${rightY}`} fill={color} />}
    </>
  )
}

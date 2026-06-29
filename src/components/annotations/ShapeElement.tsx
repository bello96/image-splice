import { type CSSProperties, useRef } from 'react'
import { useStore, type ShapeEl } from '../../store/useStore'
import { shapeToPath } from '../../lib/shapes'

type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const DIRS: Dir[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
const MIN = 20

interface Props {
  el: ShapeEl
}

export default function ShapeElement({ el }: Props) {
  const selected = useStore((s) => s.selectedShapeId === el.id)
  const select = useStore((s) => s.selectShape)
  const update = useStore((s) => s.updateShape)
  const remove = useStore((s) => s.deleteShape)
  const dragging = useRef(false)

  const containerStyle: CSSProperties = {
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
  }

  // 描边居中会溢出包围盒，描边模式下内缩 strokeWidth/2，保证图形落在 w×h 内
  const sw = el.strokeWidth
  const inset = el.filled ? 0 : sw / 2
  const iw = Math.max(1, el.w - inset * 2)
  const ih = Math.max(1, el.h - inset * 2)
  const fill = el.filled ? el.color : 'none'
  const stroke = el.filled ? 'none' : el.color
  const strokeW = el.filled ? 0 : sw
  const path = shapeToPath(el.kind, iw, ih)

  const startMove = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle, .shape-toolbar')) {
      return
    }
    e.stopPropagation()
    select(el.id)
    dragging.current = true
    const sx = e.clientX
    const sy = e.clientY
    const o = { x: el.x, y: el.y }
    const onMove = (ev: PointerEvent) => {
      update(el.id, { x: o.x + (ev.clientX - sx), y: o.y + (ev.clientY - sy) })
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (dir: Dir) => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    select(el.id)
    const sx = e.clientX
    const sy = e.clientY
    const o = { x: el.x, y: el.y, w: el.w, h: el.h }
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      let { x, y, w, h } = o
      if (dir.includes('e')) {
        w = Math.max(MIN, o.w + dx)
      }
      if (dir.includes('s')) {
        h = Math.max(MIN, o.h + dy)
      }
      if (dir.includes('w')) {
        w = Math.max(MIN, o.w - dx)
        x = o.x + (o.w - w)
      }
      if (dir.includes('n')) {
        h = Math.max(MIN, o.h - dy)
        y = o.y + (o.h - h)
      }
      update(el.id, { x, y, w, h })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className={`shape-container${selected ? ' selected' : ''}`}
      style={containerStyle}
      onPointerDown={startMove}
    >
      <svg
        width={el.w}
        height={el.h}
        viewBox={`0 0 ${el.w} ${el.h}`}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <g transform={`translate(${inset}, ${inset})`}>
          {el.kind === 'rect' && (
            <rect x={0} y={0} width={iw} height={ih} fill={fill} stroke={stroke} strokeWidth={strokeW} />
          )}
          {el.kind === 'ellipse' && (
            <ellipse
              cx={iw / 2}
              cy={ih / 2}
              rx={iw / 2}
              ry={ih / 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeW}
            />
          )}
          {path && (
            <path
              d={path}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
          )}
        </g>
      </svg>

      {selected && (
        <>
          <div className="shape-toolbar" onPointerDown={(e) => e.stopPropagation()}>
            <input
              type="number"
              aria-label="边框粗细"
              value={el.strokeWidth}
              min={1}
              max={40}
              onChange={(e) => update(el.id, { strokeWidth: parseInt(e.target.value, 10) || 1 })}
            />
            <input
              type="color"
              aria-label="颜色"
              value={el.color}
              onChange={(e) => update(el.id, { color: e.target.value })}
            />
            <button
              className={`toolbar-fill-btn${el.filled ? ' active' : ''}`}
              title={el.filled ? '当前：填充' : '当前：描边'}
              onClick={() => update(el.id, { filled: !el.filled })}
            >
              {el.filled ? '实心' : '空心'}
            </button>
            <button className="toolbar-delete-btn" onClick={() => remove(el.id)}>
              ×
            </button>
          </div>
          {DIRS.map((d) => (
            <div key={d} className={`resize-handle ${d}`} onPointerDown={startResize(d)} />
          ))}
        </>
      )}
    </div>
  )
}

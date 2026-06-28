import { type CSSProperties, useRef } from 'react'
import { useStore, type ShapeEl } from '../../store/useStore'

type Kind = 'rect' | 'ellipse'
type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const DIRS: Dir[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
const MIN = 20

interface Props {
  el: ShapeEl
  kind: Kind
}

export default function ShapeElement({ el, kind }: Props) {
  const idKey = kind === 'rect' ? 'selectedRectangleId' : 'selectedEllipseId'
  const selected = useStore((s) => s[idKey] === el.id)
  const select = useStore((s) => (kind === 'rect' ? s.selectRectangle : s.selectEllipse))
  const update = useStore((s) => (kind === 'rect' ? s.updateRectangle : s.updateEllipse))
  const remove = useStore((s) => (kind === 'rect' ? s.deleteRectangle : s.deleteEllipse))
  const dragging = useRef(false)

  const containerStyle: CSSProperties = {
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
  }

  const shapeStyle: CSSProperties = {
    border: `${el.strokeWidth}px solid ${el.color}`,
    borderRadius: kind === 'ellipse' ? '50%' : 0,
    boxSizing: 'border-box',
    background: 'transparent',
  }

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
      <div className="shape-element" style={shapeStyle} />

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
              aria-label="边框颜色"
              value={el.color}
              onChange={(e) => update(el.id, { color: e.target.value })}
            />
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

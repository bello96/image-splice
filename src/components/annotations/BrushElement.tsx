import { type CSSProperties } from 'react'
import { useStore, type BrushEl } from '../../store/useStore'
import { pointsToPath, pointsBBox } from '../../lib/shapes'

interface Props {
  el: BrushEl
}

export default function BrushElement({ el }: Props) {
  const selected = useStore((s) => s.selectedBrushId === el.id)
  const selectBrush = useStore((s) => s.selectBrush)
  const updateBrush = useStore((s) => s.updateBrush)
  const deleteBrush = useStore((s) => s.deleteBrush)

  const bbox = pointsBBox(el.points)
  const sw = el.strokeWidth
  const pad = sw + 4
  const w = bbox.w + pad * 2
  const h = bbox.h + pad * 2
  const d = pointsToPath(el.points)

  const containerStyle: CSSProperties = {
    left: el.x - pad,
    top: el.y - pad,
    width: w,
    height: h,
  }

  const startMove = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.delete-text-button')) {
      return
    }
    e.stopPropagation()
    selectBrush(el.id)
    const sx = e.clientX
    const sy = e.clientY
    const o = { x: el.x, y: el.y }
    const onMove = (ev: PointerEvent) => {
      updateBrush(el.id, { x: o.x + (ev.clientX - sx), y: o.y + (ev.clientY - sy) })
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
      className={`brush-container${selected ? ' selected' : ''}`}
      style={containerStyle}
      onPointerDown={startMove}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <g transform={`translate(${pad - bbox.x}, ${pad - bbox.y})`}>
          <path
            d={d}
            fill="none"
            stroke={el.color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {selected && (
        <button
          className="delete-text-button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => deleteBrush(el.id)}
        >
          ×
        </button>
      )}
    </div>
  )
}

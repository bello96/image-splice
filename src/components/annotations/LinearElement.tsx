import { type CSSProperties, useRef } from 'react'
import { useStore, type LinearEl } from '../../store/useStore'

interface Props {
  el: LinearEl
}

export default function LinearElement({ el }: Props) {
  const selected = useStore((s) => s.selectedLinearId === el.id)
  const selectLinear = useStore((s) => s.selectLinear)
  const updateLinear = useStore((s) => s.updateLinear)
  const deleteLinear = useStore((s) => s.deleteLinear)
  const draggingRef = useRef(false)

  const pad = Math.max(20, el.strokeWidth * 3 + 14)
  const minX = Math.min(el.x1, el.x2) - pad
  const minY = Math.min(el.y1, el.y2) - pad
  const w = Math.abs(el.x2 - el.x1) + pad * 2
  const h = Math.abs(el.y2 - el.y1) + pad * 2

  // 局部坐标
  const lx1 = el.x1 - minX
  const ly1 = el.y1 - minY
  const lx2 = el.x2 - minX
  const ly2 = el.y2 - minY

  const isArrow = el.kind === 'arrow'
  const angle = Math.atan2(ly2 - ly1, lx2 - lx1)
  const headLen = Math.max(14, el.strokeWidth * 3.2)
  const headW = Math.max(10, el.strokeWidth * 2.4)
  const hx = lx2 - headLen * Math.cos(angle)
  const hy = ly2 - headLen * Math.sin(angle)
  const leftX = hx + headW * Math.cos(angle + Math.PI / 2)
  const leftY = hy + headW * Math.sin(angle + Math.PI / 2)
  const rightX = hx + headW * Math.cos(angle - Math.PI / 2)
  const rightY = hy + headW * Math.sin(angle - Math.PI / 2)
  // 箭头时线画到箭头根部，直线时画到端点
  const lineEndX = isArrow ? hx : lx2
  const lineEndY = isArrow ? hy : ly2

  const containerStyle: CSSProperties = {
    left: minX,
    top: minY,
    width: w,
    height: h,
  }

  const moveWhole = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.arrow-handle, .text-toolbar')) {
      return
    }
    e.stopPropagation()
    selectLinear(el.id)
    draggingRef.current = true
    const sx = e.clientX
    const sy = e.clientY
    const o = { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      updateLinear(el.id, { x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy })
    }
    const onUp = () => {
      draggingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const moveEndpoint = (which: 1 | 2) => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    selectLinear(el.id)
    const sx = e.clientX
    const sy = e.clientY
    const ox = which === 1 ? el.x1 : el.x2
    const oy = which === 1 ? el.y1 : el.y2
    const onMove = (ev: PointerEvent) => {
      const nx = ox + (ev.clientX - sx)
      const ny = oy + (ev.clientY - sy)
      updateLinear(el.id, which === 1 ? { x1: nx, y1: ny } : { x2: nx, y2: ny })
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
      className={`arrow-container${selected ? ' selected' : ''}`}
      style={containerStyle}
      onPointerDown={moveWhole}
    >
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <line
          x1={lx1}
          y1={ly1}
          x2={lineEndX}
          y2={lineEndY}
          stroke={el.color}
          strokeWidth={el.strokeWidth}
          strokeLinecap="round"
        />
        {isArrow && (
          <polygon points={`${lx2},${ly2} ${leftX},${leftY} ${rightX},${rightY}`} fill={el.color} />
        )}
      </svg>

      {selected && (
        <>
          <div
            className="text-toolbar"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              type="number"
              aria-label="线条粗细"
              value={el.strokeWidth}
              min={1}
              max={40}
              onChange={(e) => updateLinear(el.id, { strokeWidth: parseInt(e.target.value, 10) || 1 })}
            />
            <input
              type="color"
              aria-label="线条颜色"
              value={el.color}
              onChange={(e) => updateLinear(el.id, { color: e.target.value })}
            />
            <button className="toolbar-delete-btn" onClick={() => deleteLinear(el.id)}>
              ×
            </button>
          </div>
          <div
            className="arrow-handle"
            style={{ left: lx1, top: ly1 }}
            onPointerDown={moveEndpoint(1)}
          />
          <div
            className="arrow-handle"
            style={{ left: lx2, top: ly2 }}
            onPointerDown={moveEndpoint(2)}
          />
        </>
      )}
    </div>
  )
}

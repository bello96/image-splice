import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

interface Props {
  cols: number
  rows: number
}

const MIN_FRACTION = 0.15

/** 计算相邻轨道边界的像素中心位置 */
function boundaries(fractions: number[], total: number, gap: number): number[] {
  const sum = fractions.reduce((a, b) => a + b, 0) || 1
  const content = total - (fractions.length - 1) * gap
  const result: number[] = []
  let cum = 0
  for (let i = 0; i < fractions.length - 1; i++) {
    cum += (fractions[i] / sum) * content
    result.push(cum + i * gap + gap / 2)
  }
  return result
}

export default function Gutters({ cols, rows }: Props) {
  const spacing = useStore((s) => s.spacing)
  const colFractions = useStore((s) => s.colFractions)
  const rowFractions = useStore((s) => s.rowFractions)
  const setColFractions = useStore((s) => s.setColFractions)
  const setRowFractions = useStore((s) => s.setRowFractions)

  const layerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = layerRef.current
    if (!el) {
      return
    }
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const effCols = colFractions.length === cols ? colFractions : Array(cols).fill(1)
  const effRows = rowFractions.length === rows ? rowFractions : Array(rows).fill(1)

  const colBounds = boundaries(effCols, size.w, spacing)
  const rowBounds = boundaries(effRows, size.h, spacing)

  const dragTrack = (
    axis: 'col' | 'row',
    index: number,
    e: React.PointerEvent,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const isCol = axis === 'col'
    const start = isCol ? [...effCols] : [...effRows]
    const sum = start.reduce((a, b) => a + b, 0) || 1
    const total = isCol ? size.w : size.h
    const content = total - (start.length - 1) * spacing
    const startPos = isCol ? e.clientX : e.clientY

    const onMove = (ev: PointerEvent) => {
      const delta = (isCol ? ev.clientX : ev.clientY) - startPos
      const dFrac = (delta / Math.max(1, content)) * sum
      const a = start[index] + dFrac
      const b = start[index + 1] - dFrac
      if (a < MIN_FRACTION || b < MIN_FRACTION) {
        return
      }
      const next = [...start]
      next[index] = a
      next[index + 1] = b
      if (isCol) {
        setColFractions(next)
      } else {
        setRowFractions(next)
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const layerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 20,
  }

  return (
    <div ref={layerRef} style={layerStyle}>
      {colBounds.map((x, i) => (
        <div
          key={`c${i}`}
          className="gutter gutter-v"
          style={{ position: 'absolute', top: 0, bottom: 0, left: x, pointerEvents: 'auto' }}
          onPointerDown={(e) => dragTrack('col', i, e)}
        />
      ))}
      {rowBounds.map((y, i) => (
        <div
          key={`r${i}`}
          className="gutter gutter-h"
          style={{ position: 'absolute', left: 0, right: 0, top: y, pointerEvents: 'auto' }}
          onPointerDown={(e) => dragTrack('row', i, e)}
        />
      ))}
    </div>
  )
}

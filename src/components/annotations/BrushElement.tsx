import { type CSSProperties } from 'react'
import { type BrushEl } from '../../store/useStore'
import { pointsToPath, pointsBBox } from '../../lib/shapes'

interface Props {
  el: BrushEl
}

/** 画笔：画完即固定，纯渲染、不参与交互（只能通过撤销删除） */
export default function BrushElement({ el }: Props) {
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
    pointerEvents: 'none',
  }

  return (
    <div className="brush-container" style={containerStyle}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible' }}
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
    </div>
  )
}

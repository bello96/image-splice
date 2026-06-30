import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useStore, type Density } from '../store/useStore'

const TILE_GAP: Record<string, number> = {
  low: 90,
  medium: 50,
  high: 22,
}

const CORNER_POS: Record<string, CSSProperties> = {
  'top-left': { top: '8%', left: '8%' },
  'top-right': { top: '8%', right: '8%' },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'bottom-left': { bottom: '8%', left: '8%' },
  'bottom-right': { bottom: '8%', right: '8%' },
}

function isTiled(d: Density): boolean {
  return d === 'low' || d === 'medium' || d === 'high'
}

export default function WatermarkLayer() {
  const wm = useStore((s) => s.watermark)
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

  if (!wm.enabled || !wm.text) {
    return <div className="watermark-layer" ref={layerRef} />
  }

  const textColor = wm.color

  // 角落/居中：单条水印
  if (!isTiled(wm.density)) {
    const pos = CORNER_POS[wm.density] || CORNER_POS.center
    const baseTransform = pos.transform ? `${pos.transform} ` : ''
    return (
      <div className="watermark-layer" ref={layerRef}>
        <span
          style={{
            position: 'absolute',
            ...pos,
            transform: `${baseTransform}rotate(${wm.rotation}deg)`,
            transformOrigin: 'center',
            fontSize: wm.fontSize,
            color: textColor,
            opacity: wm.opacity,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {wm.text}
        </span>
      </div>
    )
  }

  // 平铺水印
  const gap = TILE_GAP[wm.density] ?? 50
  const diagonal = Math.ceil(Math.hypot(size.w, size.h)) || 600
  const itemW = wm.text.length * wm.fontSize * 0.62 + gap
  const itemH = wm.fontSize * 1.5 + gap
  const cols = Math.max(1, Math.ceil(diagonal / itemW) + 1)
  const rows = Math.max(1, Math.ceil(diagonal / itemH) + 1)
  const count = Math.min(rows * cols, 800)

  return (
    <div className="watermark-layer" ref={layerRef}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: diagonal,
          height: diagonal,
          transform: `translate(-50%, -50%) rotate(${wm.rotation}deg)`,
          transformOrigin: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'center',
          justifyContent: 'center',
          gap: `${gap}px`,
          opacity: wm.opacity,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: wm.fontSize,
              color: textColor,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {wm.text}
          </span>
        ))}
      </div>
    </div>
  )
}

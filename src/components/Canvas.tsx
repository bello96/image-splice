import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore, cellCountOf } from '../store/useStore'
import { LAYOUTS, type LayoutCell, type LayoutDef } from '../data/layouts'
import CollageCell from './CollageCell'
import Gutters from './Gutters'
import CanvasToolbar from './CanvasToolbar'
import CanvasHint from './CanvasHint'
import WatermarkLayer from './WatermarkLayer'
import TextElement from './annotations/TextElement'
import ShapeElement from './annotations/ShapeElement'
import LinearElement from './annotations/LinearElement'
import BrushElement from './annotations/BrushElement'
import DrawingLayer from './DrawingLayer'

/** 留白系数：让画布不贴满视口边缘，贴近原站观感 */
const FIT_MARGIN = 0.97

function parseRatio(r: string): number {
  const [a, b] = r.split('/').map(Number)
  if (!a || !b) {
    return 1
  }
  return a / b
}

function cellsOf(def: LayoutDef): LayoutCell[] {
  if (def.c) {
    return def.c
  }
  const n = def.gr[0] * def.gr[1]
  return Array.from({ length: n }, () => ({ r: 1, c: 1 }))
}

export default function Canvas() {
  const currentLayoutId = useStore((s) => s.currentLayoutId)
  const customLayouts = useStore((s) => s.customLayouts)
  const aspectRatio = useStore((s) => s.aspectRatio)
  const spacing = useStore((s) => s.spacing)
  const border = useStore((s) => s.border)
  const bgColor = useStore((s) => s.bgColor)
  const bgImage = useStore((s) => s.bgImage)
  const imagesData = useStore((s) => s.imagesData)
  const colFractions = useStore((s) => s.colFractions)
  const rowFractions = useStore((s) => s.rowFractions)
  const texts = useStore((s) => s.texts)
  const shapes = useStore((s) => s.shapes)
  const linears = useStore((s) => s.linears)
  const brushes = useStore((s) => s.brushes)
  const deselectAll = useStore((s) => s.deselectAll)

  const def = customLayouts[currentLayoutId] || LAYOUTS[currentLayoutId] || LAYOUTS['1-full']
  const cells = cellsOf(def)
  const cellCount = cellCountOf(def)

  const viewportRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // 根据视口与宽高比计算画布像素尺寸
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) {
      return
    }
    const ratio = parseRatio(aspectRatio)
    const recompute = () => {
      const availW = vp.clientWidth
      const availH = vp.clientHeight
      if (availW <= 0 || availH <= 0) {
        return
      }
      let w = availW
      let h = w / ratio
      if (h > availH) {
        h = availH
        w = h * ratio
      }
      setSize({ w: w * FIT_MARGIN, h: h * FIT_MARGIN })
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(vp)
    return () => ro.disconnect()
  }, [aspectRatio])

  // 暴露画布元素引用给导出模块
  useEffect(() => {
    ;(window as unknown as { __collageWrapper?: HTMLElement | null }).__collageWrapper =
      wrapperRef.current
  }, [])

  const wrapperStyle: CSSProperties = {
    width: size.w || undefined,
    height: size.h || undefined,
    padding: `${border.top}px ${border.right}px ${border.bottom}px ${border.left}px`,
    backgroundColor: bgColor,
  }
  if (bgImage) {
    wrapperStyle.backgroundImage = `url(${bgImage})`
    wrapperStyle.backgroundSize = 'cover'
    wrapperStyle.backgroundPosition = 'center'
  }

  const cols = def.gr[1]
  const rows = def.gr[0]
  const colTemplate =
    colFractions.length === cols
      ? colFractions.map((f) => `${f}fr`).join(' ')
      : `repeat(${cols}, 1fr)`
  const rowTemplate =
    rowFractions.length === rows
      ? rowFractions.map((f) => `${f}fr`).join(' ')
      : `repeat(${rows}, 1fr)`
  const gridStyle: CSSProperties = {
    gap: spacing,
    gridTemplateColumns: colTemplate,
    gridTemplateRows: rowTemplate,
  }

  return (
    <main id="center-content">
      <CanvasToolbar />
      <div
        id="canvas-viewport"
        ref={viewportRef}
        onClick={(e) => {
          // 点击画布空白处取消选中
          if (e.target === e.currentTarget) {
            deselectAll()
          }
        }}
      >
        <div id="layout-wrapper" className="collage-wrapper" ref={wrapperRef} style={wrapperStyle}>
          <div id="layout-grid" className="collage-grid" style={gridStyle}>
            {cells.map((cell, i) => {
              const style: CSSProperties = {
                gridRowEnd: `span ${cell.r}`,
                gridColumnEnd: `span ${cell.c}`,
              }
              if (cell.s) {
                style.gridRowStart = cell.s[0]
                style.gridColumnStart = cell.s[1]
              }
              return <CollageCell key={i} index={i} style={style} image={imagesData[i]} />
            })}
            <Gutters cols={cols} rows={rows} />
          </div>

          <WatermarkLayer />

          {shapes.map((sh) => (
            <ShapeElement key={sh.id} el={sh} />
          ))}
          {linears.map((l) => (
            <LinearElement key={l.id} el={l} />
          ))}
          {brushes.map((b) => (
            <BrushElement key={b.id} el={b} />
          ))}
          {texts.map((t) => (
            <TextElement key={t.id} el={t} />
          ))}

          <DrawingLayer />
        </div>
      </div>
      <CanvasHint hasImages={Object.keys(imagesData).length > 0 && cellCount > 0} />
    </main>
  )
}

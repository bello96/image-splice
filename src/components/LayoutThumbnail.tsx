import { type CSSProperties } from 'react'
import { type LayoutDef, type LayoutCell } from '../data/layouts'

interface Props {
  def: LayoutDef
  active: boolean
  onClick: () => void
}

/** 计算单元格列表：有 c 用 c，否则等分网格 */
function cellsOf(def: LayoutDef): LayoutCell[] {
  if (def.c) {
    return def.c
  }
  const n = def.gr[0] * def.gr[1]
  return Array.from({ length: n }, () => ({ r: 1, c: 1 }))
}

export default function LayoutThumbnail({ def, active, onClick }: Props) {
  const gridStyle: CSSProperties = {
    gridTemplateRows: `repeat(${def.gr[0]}, 1fr)`,
    gridTemplateColumns: `repeat(${def.gr[1]}, 1fr)`,
  }
  return (
    <button
      type="button"
      className={`layout-thumbnail${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={`选择布局 ${def.g} 张图片`}
    >
      <div className="thumbnail-grid" style={gridStyle}>
        {cellsOf(def).map((cell, i) => {
          const style: CSSProperties = {
            gridRowEnd: `span ${cell.r}`,
            gridColumnEnd: `span ${cell.c}`,
          }
          if (cell.s) {
            style.gridRowStart = cell.s[0]
            style.gridColumnStart = cell.s[1]
          }
          return <div key={i} className="thumbnail-cell" style={style} />
        })}
      </div>
    </button>
  )
}

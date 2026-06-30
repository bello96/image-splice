import type { CSSProperties } from 'react'
import { useStore } from '../store/useStore'
import ColorPalette from './ColorPalette'

const WIDTHS = [2, 4, 8, 12]
const SHAPE_TOOLS = ['rect', 'ellipse', 'triangle', 'star', 'heart']
const DRAW_TOOLS = ['brush', 'text', 'rect', 'ellipse', 'triangle', 'star', 'heart', 'line', 'arrow']

const PANEL_STYLE: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 8,
  width: 'max-content',
  maxWidth: '90vw',
  padding: '7px 10px',
  background: '#fff',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  boxShadow: '0 6px 20px rgba(9, 30, 66, 0.18)',
}
const ARROW_STYLE: CSSProperties = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderBottom: '6px solid #fff',
}
const DIVIDER_STYLE: CSSProperties = {
  width: 1,
  height: 24,
  background: 'var(--border-color)',
  flex: 'none',
}
const GROUP_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }
const fillBtnStyle = (active: boolean): CSSProperties => ({
  height: 26,
  padding: '0 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  flex: 'none',
  border: `1px solid ${active ? 'var(--primary-accent)' : 'var(--border-color)'}`,
  background: active ? '#e3fbef' : '#fff',
  color: active ? 'var(--accent-on-light)' : 'var(--text-secondary)',
})

/** 工具按钮下方浮出的 popover 气泡（draw-guess 风格，样式内联以规避 CSS 热载问题） */
export default function ToolPanel() {
  const activeTool = useStore((s) => s.activeTool)
  const selectedShapeId = useStore((s) => s.selectedShapeId)
  const selectedLinearId = useStore((s) => s.selectedLinearId)
  const selectedTextId = useStore((s) => s.selectedTextId)
  const shapes = useStore((s) => s.shapes)
  const linears = useStore((s) => s.linears)
  const texts = useStore((s) => s.texts)

  const drawColor = useStore((s) => s.drawColor)
  const drawStrokeWidth = useStore((s) => s.drawStrokeWidth)
  const drawFilled = useStore((s) => s.drawFilled)
  const setDrawColor = useStore((s) => s.setDrawColor)
  const setDrawStrokeWidth = useStore((s) => s.setDrawStrokeWidth)
  const setDrawFilled = useStore((s) => s.setDrawFilled)

  const updateShape = useStore((s) => s.updateShape)
  const updateLinear = useStore((s) => s.updateLinear)
  const updateText = useStore((s) => s.updateText)
  const deleteShape = useStore((s) => s.deleteShape)
  const deleteLinear = useStore((s) => s.deleteLinear)
  const deleteText = useStore((s) => s.deleteText)
  const commitHistory = useStore((s) => s.commitHistory)

  const selShape = selectedShapeId ? shapes.find((x) => x.id === selectedShapeId) ?? null : null
  const selLinear = selectedLinearId ? linears.find((x) => x.id === selectedLinearId) ?? null : null
  const selText = selectedTextId ? texts.find((x) => x.id === selectedTextId) ?? null : null

  const editingSelected = Boolean(selShape || selLinear || selText)
  const showForTool = !editingSelected && DRAW_TOOLS.includes(activeTool)
  if (!editingSelected && !showForTool) {
    return null
  }

  const color = selShape?.color ?? selLinear?.color ?? selText?.color ?? drawColor
  const strokeWidth = selShape?.strokeWidth ?? selLinear?.strokeWidth ?? drawStrokeWidth
  const filled = selShape?.filled ?? drawFilled

  const isShapeCtx = Boolean(selShape) || (showForTool && SHAPE_TOOLS.includes(activeTool))
  const isLinearCtx =
    Boolean(selLinear) || (showForTool && (activeTool === 'line' || activeTool === 'arrow'))
  const isBrushCtx = showForTool && activeTool === 'brush'
  const showWidth = isShapeCtx || isLinearCtx || isBrushCtx
  const showFill = isShapeCtx

  const onColor = (c: string) => {
    if (selShape) {
      updateShape(selShape.id, { color: c })
      commitHistory()
    } else if (selLinear) {
      updateLinear(selLinear.id, { color: c })
      commitHistory()
    } else if (selText) {
      updateText(selText.id, { color: c })
      commitHistory()
    } else {
      setDrawColor(c)
    }
  }

  const onWidth = (w: number) => {
    if (selShape) {
      updateShape(selShape.id, { strokeWidth: w })
      commitHistory()
    } else if (selLinear) {
      updateLinear(selLinear.id, { strokeWidth: w })
      commitHistory()
    } else {
      setDrawStrokeWidth(w)
    }
  }

  const onFill = (f: boolean) => {
    if (selShape) {
      updateShape(selShape.id, { filled: f })
      commitHistory()
    } else {
      setDrawFilled(f)
    }
  }

  const onDelete = () => {
    if (selShape) {
      deleteShape(selShape.id)
      commitHistory()
    } else if (selLinear) {
      deleteLinear(selLinear.id)
      commitHistory()
    } else if (selText) {
      deleteText(selText.id)
      commitHistory()
    }
  }

  return (
    <div className="tool-panel" style={PANEL_STYLE} onPointerDown={(e) => e.stopPropagation()}>
      <span style={ARROW_STYLE} />

      {showWidth && (
        <>
          <div style={GROUP_STYLE}>
            {WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                className={`tb-width-btn${strokeWidth === w ? ' active' : ''}`}
                title={`线宽 ${w}px`}
                aria-label={`线宽 ${w}px`}
                onClick={() => onWidth(w)}
                style={{ flex: 'none' }}
              >
                <span className="tb-width-dot" style={{ width: w + 2, height: w + 2 }} />
              </button>
            ))}
          </div>
          <span style={DIVIDER_STYLE} />
        </>
      )}

      {showFill && (
        <>
          <div style={GROUP_STYLE}>
            <button type="button" style={fillBtnStyle(!filled)} onClick={() => onFill(false)}>
              线框
            </button>
            <button type="button" style={fillBtnStyle(filled)} onClick={() => onFill(true)}>
              填充
            </button>
          </div>
          <span style={DIVIDER_STYLE} />
        </>
      )}

      <ColorPalette value={color} onChange={onColor} />

      {editingSelected && (
        <>
          <span style={DIVIDER_STYLE} />
          <button
            type="button"
            className="tool-btn danger"
            title="删除"
            aria-label="删除"
            onClick={onDelete}
            style={{ flex: 'none' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

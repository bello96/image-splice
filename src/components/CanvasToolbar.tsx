import type { ComponentType, SVGProps } from 'react'
import { useStore, type ToolType } from '../store/useStore'
import {
  SelectIcon,
  BrushIcon,
  TextIcon,
  RectIcon,
  EllipseIcon,
  TriangleIcon,
  StarIcon,
  HeartIcon,
  LineIcon,
  ArrowIcon,
  ShuffleIcon,
  TrashIcon,
} from '../lib/icons'

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
interface ToolDef {
  tool: ToolType
  Icon: IconCmp
  label: string
}

const GROUP_SELECT: ToolDef[] = [
  { tool: 'select', Icon: SelectIcon, label: '选择 / 移动' },
  { tool: 'brush', Icon: BrushIcon, label: '画笔' },
]
const GROUP_TEXT: ToolDef[] = [{ tool: 'text', Icon: TextIcon, label: '文字' }]
const GROUP_SHAPES: ToolDef[] = [
  { tool: 'rect', Icon: RectIcon, label: '矩形' },
  { tool: 'ellipse', Icon: EllipseIcon, label: '圆形' },
  { tool: 'triangle', Icon: TriangleIcon, label: '三角形' },
  { tool: 'star', Icon: StarIcon, label: '五角星' },
  { tool: 'heart', Icon: HeartIcon, label: '心形' },
  { tool: 'line', Icon: LineIcon, label: '直线' },
  { tool: 'arrow', Icon: ArrowIcon, label: '箭头' },
]

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff']
const WIDTHS = [2, 4, 8, 12]

export default function CanvasToolbar() {
  const activeTool = useStore((s) => s.activeTool)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const drawColor = useStore((s) => s.drawColor)
  const setDrawColor = useStore((s) => s.setDrawColor)
  const drawStrokeWidth = useStore((s) => s.drawStrokeWidth)
  const setDrawStrokeWidth = useStore((s) => s.setDrawStrokeWidth)
  const drawFilled = useStore((s) => s.drawFilled)
  const setDrawFilled = useStore((s) => s.setDrawFilled)
  const shuffle = useStore((s) => s.shuffle)
  const clearCanvas = useStore((s) => s.clearCanvas)
  const showToast = useStore((s) => s.showToast)
  const imageCount = useStore((s) => Object.keys(s.imagesData).length)

  const onShuffle = () => {
    if (imageCount < 2) {
      showToast('至少需要两张图片才能随机打乱', 'warning')
      return
    }
    shuffle()
    showToast('已随机打乱图片顺序', 'success')
  }

  const onClear = () => {
    clearCanvas()
    showToast('画布已清除', 'info')
  }

  const renderTool = ({ tool, Icon, label }: ToolDef) => (
    <button
      key={tool}
      className={`tool-btn${activeTool === tool ? ' active' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={activeTool === tool}
      onClick={() => setActiveTool(tool)}
    >
      <Icon size={18} />
    </button>
  )

  return (
    <div id="canvas-action-toolbar">
      <div className="tb-group">{GROUP_SELECT.map(renderTool)}</div>
      <div className="tb-divider" />
      <div className="tb-group">{GROUP_TEXT.map(renderTool)}</div>
      <div className="tb-divider" />
      <div className="tb-group">{GROUP_SHAPES.map(renderTool)}</div>
      <div className="tb-divider" />

      <div className="tb-group tb-colors">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`tb-color-btn${drawColor.toLowerCase() === c ? ' active' : ''}`}
            style={{ background: c }}
            title={c}
            aria-label={`颜色 ${c}`}
            onClick={() => setDrawColor(c)}
          />
        ))}
        <input
          type="color"
          className="tb-color-custom"
          value={drawColor}
          title="自定义颜色"
          aria-label="自定义颜色"
          onChange={(e) => setDrawColor(e.target.value)}
        />
      </div>
      <div className="tb-divider" />

      <div className="tb-group">
        {WIDTHS.map((w) => (
          <button
            key={w}
            className={`tb-width-btn${drawStrokeWidth === w ? ' active' : ''}`}
            title={`线宽 ${w}px`}
            aria-label={`线宽 ${w}px`}
            onClick={() => setDrawStrokeWidth(w)}
          >
            <span className="tb-width-dot" style={{ width: w + 2, height: w + 2 }} />
          </button>
        ))}
      </div>
      <div className="tb-divider" />

      <div className="tb-group">
        <button
          className={`tool-btn${drawFilled ? ' active' : ''}`}
          title={drawFilled ? '填充模式（点击切换为描边）' : '描边模式（点击切换为填充）'}
          aria-label="填充/描边切换"
          aria-pressed={drawFilled}
          onClick={() => setDrawFilled(!drawFilled)}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <rect
              x={4}
              y={4}
              width={16}
              height={16}
              rx={2}
              fill={drawFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
            />
          </svg>
        </button>
      </div>
      <div className="tb-divider" />

      <div className="tb-group">
        <button
          className="tool-btn"
          title="随机打乱图片"
          aria-label="随机打乱图片"
          onClick={onShuffle}
          disabled={imageCount < 2}
        >
          <ShuffleIcon size={18} />
        </button>
        <button className="tool-btn danger" title="清除画布" aria-label="清除画布" onClick={onClear}>
          <TrashIcon size={18} />
        </button>
      </div>
    </div>
  )
}

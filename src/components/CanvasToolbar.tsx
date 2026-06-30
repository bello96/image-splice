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
import ToolPanel from './ToolPanel'

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

const DRAW_TOOLS = ['brush', 'text', 'rect', 'ellipse', 'triangle', 'star', 'heart', 'line', 'arrow']

export default function CanvasToolbar() {
  const activeTool = useStore((s) => s.activeTool)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const shuffle = useStore((s) => s.shuffle)
  const clearCanvas = useStore((s) => s.clearCanvas)
  const showToast = useStore((s) => s.showToast)
  const imageCount = useStore((s) => Object.keys(s.imagesData).length)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.annoHistoryStep > 0)
  const canRedo = useStore((s) => s.annoHistoryStep < s.annoHistory.length - 1)
  const hasSelection = useStore(
    (s) => Boolean(s.selectedShapeId || s.selectedLinearId || s.selectedTextId),
  )

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

  const renderTool = ({ tool, Icon, label }: ToolDef) => {
    // 有选中元素时只在当前高亮工具按钮下弹一个气泡（编辑选中元素）；
    // 无选中时才在激活的绘制工具按钮下弹气泡（设置接下来要画的样式）。
    const showPanel = hasSelection
      ? tool === activeTool
      : activeTool === tool && DRAW_TOOLS.includes(tool)
    return (
      <div className="tool-btn-wrap" key={tool} style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          className={`tool-btn${activeTool === tool ? ' active' : ''}`}
          title={label}
          aria-label={label}
          aria-pressed={activeTool === tool}
          onClick={() => setActiveTool(tool)}
        >
          <Icon size={18} />
        </button>
        {showPanel && <ToolPanel />}
      </div>
    )
  }

  return (
    <div id="canvas-action-toolbar" style={{ overflow: 'visible' }}>
      <div className="tb-group">{GROUP_SELECT.map(renderTool)}</div>
      <div className="tb-divider" />
      <div className="tb-group">{GROUP_TEXT.map(renderTool)}</div>
      <div className="tb-divider" />
      <div className="tb-group">{GROUP_SHAPES.map(renderTool)}</div>
      <div className="tb-divider" />
      <div className="tb-group">
        <button className="tool-btn" title="撤销" aria-label="撤销" onClick={undo} disabled={!canUndo}>
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 5 5 5 5 0 0 1-5 5H9" />
          </svg>
        </button>
        <button className="tool-btn" title="重做" aria-label="重做" onClick={redo} disabled={!canRedo}>
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0-5 5 5 5 0 0 0 5 5h6" />
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

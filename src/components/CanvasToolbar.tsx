import { useStore } from '../store/useStore'
import { TextIcon, ArrowIcon, RectIcon, EllipseIcon, ShuffleIcon, TrashIcon } from '../lib/icons'

export default function CanvasToolbar() {
  const addText = useStore((s) => s.addText)
  const addArrow = useStore((s) => s.addArrow)
  const addRectangle = useStore((s) => s.addRectangle)
  const addEllipse = useStore((s) => s.addEllipse)
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

  return (
    <div id="canvas-action-toolbar">
      <div className="toolbar-group-left">
        <button className="action-button" onClick={addText}>
          <TextIcon size={18} strokeWidth={2.5} />
          <span>文字</span>
        </button>
        <button className="action-button" onClick={addArrow}>
          <ArrowIcon size={18} strokeWidth={2.5} />
          <span>箭头</span>
        </button>
        <button className="action-button" onClick={addRectangle}>
          <RectIcon size={18} strokeWidth={2.5} />
          <span>方框</span>
        </button>
        <button className="action-button" onClick={addEllipse}>
          <EllipseIcon size={18} strokeWidth={2.5} />
          <span>圆圈</span>
        </button>
      </div>
      <div className="toolbar-group-right">
        <button
          id="shuffle-btn"
          className="action-button"
          onClick={onShuffle}
          disabled={imageCount < 2}
        >
          <ShuffleIcon size={18} strokeWidth={2.5} />
          <span>随机</span>
        </button>
        <button className="action-button danger" onClick={onClear}>
          <TrashIcon size={18} strokeWidth={2.5} />
          <span>清除</span>
        </button>
      </div>
    </div>
  )
}

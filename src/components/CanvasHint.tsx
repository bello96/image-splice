interface Props {
  hasImages: boolean
}

export default function CanvasHint({ hasImages }: Props) {
  return (
    <div id="canvas-hint" className={hasImages ? 'is-visible' : ''}>
      <strong>提示:</strong> 直接拖拽可替换图片，按住 <strong>Alt (Option ⌥)</strong> 再拖拽可平移图片，点击图片选中后，按键盘上的 <code>↑</code> <code>↓</code> <code>←</code> <code>→</code> 方向键也可以平移图片。
    </div>
  )
}

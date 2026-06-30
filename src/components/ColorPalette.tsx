import type { CSSProperties } from 'react'

interface Props {
  value: string
  onChange: (color: string) => void
}

export const PALETTE_COLORS = [
  '#000000',
  '#10aeff',
  '#91d300',
  '#ffc300',
  '#fa5151',
  '#8b5cf6',
]

const ROOT_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: 'none',
}
const CUSTOM_STYLE: CSSProperties = {
  width: 24,
  height: 24,
  display: 'inline-flex',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  overflow: 'hidden',
  cursor: 'pointer',
  flex: 'none',
}

/** 预设色块 + 自定义取色的受控颜色选择器（draw-guess 风格，样式内联以避免 CSS 热载问题） */
export default function ColorPalette({ value, onChange }: Props) {
  const lower = value.toLowerCase()
  return (
    <div style={ROOT_STYLE}>
      {PALETTE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          aria-label={`颜色 ${c}`}
          aria-pressed={lower === c}
          onClick={() => onChange(c)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            padding: 0,
            cursor: 'pointer',
            flex: 'none',
            background: c,
            border: lower === c ? '2px solid var(--primary-accent)' : '1px solid rgba(9, 30, 66, 0.25)',
            boxShadow: lower === c ? '0 0 0 2px rgba(3, 222, 109, 0.35)' : 'none',
          }}
        />
      ))}
      <label style={CUSTOM_STYLE} title="自定义颜色">
        <input
          type="color"
          value={value}
          aria-label="自定义颜色"
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        />
      </label>
    </div>
  )
}

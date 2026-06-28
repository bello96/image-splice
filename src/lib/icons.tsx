import type { SVGProps } from 'react'

/** 通用 lucide 风格描边图标基底 */
function Icon({ children, size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const GridIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </Icon>
)

export const CustomLayoutIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </Icon>
)

export const SlidersIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </Icon>
)

export const TextIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
  </Icon>
)

export const ArrowIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
)

export const RectIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </Icon>
)

export const EllipseIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <ellipse cx="12" cy="12" rx="10" ry="7" />
  </Icon>
)

export const ShuffleIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Icon>
)

export const TrashIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </Icon>
)

export const UploadIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Icon>
)

/** 替换（旋转刷新） */
export const ReplaceIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Icon>
)

export const ZoomInIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </Icon>
)

export const ZoomOutIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </Icon>
)

export const ResetIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </Icon>
)

export const CopyIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
)

export const ChevronLeftIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="15 18 9 12 15 6" />
  </Icon>
)

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
)

/* 工具箱菜单图标 */
export const StitchIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M16 4h2a2 2 0 0 1 2 2v4" />
    <path d="M8 4H6a2 2 0 0 0-2 2v4" />
    <path d="M16 20h2a2 2 0 0 0 2-2v-4" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-4" />
    <path d="M8 12h8" />
  </Icon>
)

export const SplitIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M3 9h18" />
    <path d="M9 22V12" />
    <path d="M15 9V2" />
    <path d="M9 3h6" />
  </Icon>
)

export const CompressIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M12 2v6" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l3.54 3.54" />
    <path d="M15.53 15.53l3.54 3.54" />
    <path d="M2 12h6" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l3.54-3.54" />
    <path d="M15.53 8.47l3.54-3.54" />
  </Icon>
)

export const CropIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M6 3v15a3 3 0 0 0 3 3h12" />
    <path d="M19 19V6a3 3 0 0 0-3-3H3" />
  </Icon>
)

export const RoundIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12h6" />
  </Icon>
)

export const ResizeIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <polyline points="15 12 18 15 21 12" />
    <path d="M19 12V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
    <path d="M10 12h2a2 2 0 0 1 0 4h-2a2 2 0 0 1 0-4z" />
  </Icon>
)

export const WatermarkRemoveIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M16 4.17l-1.3-1.3a2 2 0 0 0-2.82 0L3 13.05V17h3.95L17.8 6.99a2 2 0 0 0 0-2.82z" />
    <path d="M13 5L19 11" />
  </Icon>
)

/* 水印密度位置图标（5 个角/中心方向） */
export const DensityIcon = ({
  pos,
  ...p
}: SVGProps<SVGSVGElement> & { size?: number; pos: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right' }) => {
  const dot: Record<string, [number, number]> = {
    'top-left': [7, 7],
    'top-right': [17, 7],
    center: [12, 12],
    'bottom-left': [7, 17],
    'bottom-right': [17, 17],
  }
  const [cx, cy] = dot[pos]
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx={cx} cy={cy} r="2.5" fill="currentColor" stroke="none" />
    </Icon>
  )
}

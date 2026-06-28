import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  GridIcon,
  SlidersIcon,
  CompressIcon,
  CropIcon,
  RoundIcon,
  ResizeIcon,
  SplitIcon,
  StitchIcon,
  WatermarkRemoveIcon,
  BeadsIcon,
} from '../lib/icons'

interface ToolItem {
  label: string
  to: string
  icon: React.ReactNode
}

const TOOLS: ToolItem[] = [
  { label: '布局拼图', to: '/', icon: <GridIcon size={24} /> },
  { label: '长图拼接', to: '/tools/stitching', icon: <StitchIcon size={24} /> },
  { label: '图片分割', to: '/tools/split', icon: <SplitIcon size={24} /> },
  { label: '图片压缩', to: '/tools/compress', icon: <CompressIcon size={24} /> },
  { label: '图片裁剪', to: '/tools/crop', icon: <CropIcon size={24} /> },
  { label: '图片圆角', to: '/tools/corner', icon: <RoundIcon size={24} /> },
  { label: '调整大小', to: '/tools/resize', icon: <ResizeIcon size={24} /> },
  { label: '去除水印', to: '/tools/watermark', icon: <WatermarkRemoveIcon size={24} /> },
  { label: '拼豆图', to: '/tools/beads', icon: <BeadsIcon size={24} /> },
]

export default function Nav() {
  const setLeftMobileOpen = useStore((s) => s.setLeftMobileOpen)
  const setRightMobileOpen = useStore((s) => s.setRightMobileOpen)
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isCollage = location.pathname === '/'

  useEffect(() => {
    if (!menuOpen) {
      return
    }
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [menuOpen])

  // 路由切换时关闭下拉菜单
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <nav id="app-nav">
      {isCollage ? (
        <button
          className="mobile-nav-btn"
          aria-label="打开布局和模板选项"
          onClick={() => setLeftMobileOpen(true)}
        >
          <GridIcon size={24} />
        </button>
      ) : (
        <span className="mobile-nav-spacer" />
      )}

      <div className="nav-title">
        <Link to="/">
          <GridIcon className="nav-icon" style={{ color: 'var(--primary-accent)' }} />
          <span>图省事 - 在线图片工具箱</span>
        </Link>
      </div>

      {isCollage ? (
        <button
          className="mobile-nav-btn"
          aria-label="打开样式和操作选项"
          onClick={() => setRightMobileOpen(true)}
        >
          <SlidersIcon size={24} />
        </button>
      ) : (
        <span className="mobile-nav-spacer" />
      )}

      <div className="nav-links">
        <div id="tools-dropdown-container" ref={containerRef}>
          <button
            className="tools-link-btn"
            title="查看所有图片工具"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <GridIcon size={18} strokeWidth={2.5} />
            <span>工具箱</span>
          </button>
          <div className={`dropdown-menu${menuOpen ? ' visible' : ''}`}>
            <h4 className="menu-title">图片处理工具</h4>
            <div className="tool-items-grid">
              {TOOLS.map((t) => {
                const active = location.pathname === t.to
                return (
                  <button
                    key={t.label}
                    type="button"
                    className={`tool-item${active ? ' current-tool' : ''}`}
                    onClick={() => {
                      setMenuOpen(false)
                      navigate(t.to)
                    }}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

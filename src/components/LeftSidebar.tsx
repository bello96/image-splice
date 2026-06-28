import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { LAYOUTS, type LayoutDef } from '../data/layouts'
import LayoutThumbnail from './LayoutThumbnail'

interface GroupItem {
  id: string
  def: LayoutDef
  custom: boolean
}

interface Group {
  g: number
  items: GroupItem[]
}

/** 合并预设布局与自定义布局，按图片数量分组（自定义排在该组预设之后） */
function buildGroups(customLayouts: Record<string, LayoutDef>): Group[] {
  const map = new Map<number, Group>()
  const ensure = (g: number): Group => {
    let group = map.get(g)
    if (!group) {
      group = { g, items: [] }
      map.set(g, group)
    }
    return group
  }
  for (const id of Object.keys(LAYOUTS)) {
    ensure(LAYOUTS[id].g).items.push({ id, def: LAYOUTS[id], custom: false })
  }
  for (const id of Object.keys(customLayouts)) {
    ensure(customLayouts[id].g).items.push({ id, def: customLayouts[id], custom: true })
  }
  return [...map.values()].sort((a, b) => a.g - b.g)
}

export default function LeftSidebar() {
  const navigate = useNavigate()
  const customLayouts = useStore((s) => s.customLayouts)
  const currentLayoutId = useStore((s) => s.currentLayoutId)
  const setLayout = useStore((s) => s.setLayout)
  const setLeftMobileOpen = useStore((s) => s.setLeftMobileOpen)
  const leftMobileOpen = useStore((s) => s.leftMobileOpen)
  const groups = useMemo(() => buildGroups(customLayouts), [customLayouts])

  // 选中自定义布局后（如确认布局跳回），滚动到该缩略图可见
  useEffect(() => {
    if (currentLayoutId.startsWith('custom')) {
      const el = document.querySelector('#layout-container .layout-thumbnail.active')
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [currentLayoutId])

  const pick = (id: string) => {
    setLayout(id)
    setLeftMobileOpen(false)
  }

  return (
    <aside id="left-sidebar" className={leftMobileOpen ? 'is-open' : ''}>
      <div className="sidebar-content-wrapper">
        <div id="layout-controls">
          <h3 className="panel-section-title">布局选择</h3>
          <div id="layout-container">
            {groups.map((group) => (
              <div key={group.g}>
                <h4 className="layout-group-title">{group.g} 张图片</h4>
                <div className="layout-thumbnail-grid">
                  {group.items.map((item) => (
                    <LayoutThumbnail
                      key={item.id}
                      def={item.def}
                      active={item.id === currentLayoutId}
                      onClick={() => pick(item.id)}
                    />
                  ))}
                  <button
                    type="button"
                    className="layout-thumbnail custom-layout-trigger"
                    onClick={() => {
                      setLeftMobileOpen(false)
                      navigate(`/custom-layout?group=${group.g}`)
                    }}
                    aria-label={`为 ${group.g} 张图片创建自定义布局`}
                  >
                    <div className="thumbnail-grid custom-inner">
                      <span className="plus">+</span>
                      <span className="custom-text">自定义</span>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { LayoutDef } from '../data/layouts'

/** 每个网格单位的像素尺寸（与原站一致） */
const UNIT = 60
const MIN_GRID = 1
const MAX_GRID = 12

/** 编辑器内部方块模型：r/c 为 0 基行列位置，width=列跨度，height=行跨度 */
interface Block {
  r: number
  c: number
  width: number
  height: number
}

const clampGrid = (n: number): number => Math.max(MIN_GRID, Math.min(MAX_GRID, n))

const makeOcc = (rows: number, cols: number): boolean[][] =>
  Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))

/** 是否「无法」在 (row,col) 放置 w×h 的方块（越界或与占位冲突），对应原站 E0 */
function blocked(
  occ: boolean[][],
  row: number,
  col: number,
  w: number,
  h: number,
  rows: number,
  cols: number,
): boolean {
  if (row + h > rows || col + w > cols) {
    return true
  }
  for (let i = row; i < row + h; i++) {
    for (let j = col; j < col + w; j++) {
      if (occ[i][j]) {
        return true
      }
    }
  }
  return false
}

/** 标记占位，对应原站 t0 */
function mark(occ: boolean[][], row: number, col: number, w: number, h: number): void {
  for (let i = row; i < row + h; i++) {
    for (let j = col; j < col + w; j++) {
      occ[i][j] = true
    }
  }
}

/** 按首次适配重新排布所有方块，对应原站 o0 */
function reflow(blocks: Block[], rows: number, cols: number): Block[] {
  const occ = makeOcc(rows, cols)
  return blocks.map((b) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!blocked(occ, i, j, b.width, b.height, rows, cols)) {
          mark(occ, i, j, b.width, b.height)
          return { ...b, r: i, c: j }
        }
      }
    }
    mark(occ, 0, 0, b.width, b.height)
    return { ...b, r: 0, c: 0 }
  })
}

/** 排除自身后是否与其它方块重叠，对应原站 V */
function overlaps(
  blocks: Block[],
  selfIdx: number,
  row: number,
  col: number,
  w: number,
  h: number,
): boolean {
  for (let i = 0; i < blocks.length; i++) {
    if (i === selfIdx) {
      continue
    }
    const o = blocks[i]
    if (col + w > o.c && col < o.c + o.width && row + h > o.r && row < o.r + o.height) {
      return true
    }
  }
  return false
}

/** 按位置排序（自上而下、自左而右） */
function sortByPos(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => (a.r === b.r ? a.c - b.c : a.r - b.r))
}

/** 序列化为原站 JSON 格式：cell = { r: 行跨度, c: 列跨度 } */
function serialize(blocks: Block[], rows: number, cols: number) {
  const sorted = sortByPos(blocks)
  return {
    g: sorted.length,
    gr: [rows, cols],
    c: sorted.map((b) => ({ r: b.height, c: b.width })),
  }
}

export default function CustomLayoutTool() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromGroup = searchParams.get('group')
  const applyEditorLayout = useStore((s) => s.applyEditorLayout)
  const showToast = useStore((s) => s.showToast)

  // 已提交的网格尺寸（点击「初始化网格」后生效）
  const [rows, setRows] = useState(6)
  const [cols, setCols] = useState(6)
  // 输入框待提交值
  const [rowInput, setRowInput] = useState('6')
  const [colInput, setColInput] = useState('6')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [importText, setImportText] = useState('')
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  // 拖拽期间避免选中态/页面滚动
  const draggingRef = useRef(false)

  // 进入编辑器时锁定 body 滚动
  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => document.body.classList.remove('overflow-hidden')
  }, [])

  const jsonStr = useMemo(
    () => JSON.stringify(serialize(blocks, rows, cols), null, 2),
    [blocks, rows, cols],
  )

  /** 初始化 / 重置网格：读取输入尺寸并清空方块 */
  const initGrid = () => {
    if (blocks.length > 0 && !window.confirm('画布中已有布局，确定要重置吗？')) {
      return
    }
    const r = clampGrid(parseInt(rowInput, 10) || 1)
    const c = clampGrid(parseInt(colInput, 10) || 1)
    setRows(r)
    setCols(c)
    setRowInput(String(r))
    setColInput(String(c))
    setBlocks([])
    setSelected(null)
  }

  /** 点击空单元格添加 1×1 方块 */
  const addBlockAt = (row: number, col: number) => {
    if (draggingRef.current) {
      return
    }
    setBlocks((prev) => {
      if (overlaps(prev, -1, row, col, 1, 1)) {
        return prev
      }
      return [...prev, { r: row, c: col, width: 1, height: 1 }]
    })
  }

  /** 添加单元格：填入首个空位的 1×1 方块 */
  const addCell = () => {
    setBlocks((prev) => {
      const occ = makeOcc(rows, cols)
      prev.forEach((b) => mark(occ, b.r, b.c, b.width, b.height))
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (!occ[i][j]) {
            return [...prev, { r: i, c: j, width: 1, height: 1 }]
          }
        }
      }
      showToast('没有空位可添加方块！', 'warning')
      return prev
    })
  }

  /** 删除选中的方块 */
  const deleteCell = () => {
    if (selected === null) {
      showToast('请先选择要删除的方块！', 'error')
      return
    }
    setBlocks((prev) => prev.filter((_, i) => i !== selected))
    setSelected(null)
  }

  /** 自动填充空单元格：先重排，再用 1×1 填满所有空位 */
  const autoFill = () => {
    setBlocks((prev) => {
      const reflowed = reflow(prev, rows, cols)
      const occ = makeOcc(rows, cols)
      reflowed.forEach((b) => mark(occ, b.r, b.c, b.width, b.height))
      const filled = [...reflowed]
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (!occ[i][j]) {
            filled.push({ r: i, c: j, width: 1, height: 1 })
          }
        }
      }
      return sortByPos(filled)
    })
    setSelected(null)
  }

  /** 使用此布局拼图：校验填满后应用到拼图画布 */
  const useThisLayout = () => {
    const area = blocks.reduce((sum, b) => sum + b.width * b.height, 0)
    if (area !== rows * cols) {
      showToast('当前布局不完整，请先填满所有格子', 'error')
      return
    }
    const sorted = sortByPos(blocks)
    const def: LayoutDef = {
      g: sorted.length,
      gr: [rows, cols],
      // 附带显式坐标 s=[行起点,列起点]（1 基），保证画布渲染与编辑器所见一致
      c: sorted.map((b) => ({ r: b.height, c: b.width, s: [b.r + 1, b.c + 1] })),
    }
    applyEditorLayout(def)
    showToast('已应用自定义布局', 'success')
    navigate('/')
  }

  /** 导入布局 JSON */
  const importLayout = () => {
    try {
      const data = JSON.parse(importText) as { gr?: [number, number]; c?: { r: number; c: number }[] }
      if (!data.gr || !data.c || !Array.isArray(data.c)) {
        showToast('无效布局 JSON', 'error')
        return
      }
      const r = clampGrid(data.gr[0])
      const c = clampGrid(data.gr[1])
      // 反序列化：cell.c=列跨度→width，cell.r=行跨度→height，再首次适配排布
      const imported = data.c.map((cell) => ({ r: 0, c: 0, width: cell.c, height: cell.r }))
      setRows(r)
      setCols(c)
      setRowInput(String(r))
      setColInput(String(c))
      setBlocks(reflow(imported, r, c))
      setSelected(null)
      showToast('布局已导入', 'success')
    } catch (err) {
      showToast(`JSON 解析失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error')
    }
  }

  /** 拖拽移动方块 */
  const startMove = (e: React.PointerEvent, idx: number) => {
    if ((e.target as HTMLElement).classList.contains('cl-resizer')) {
      return
    }
    e.stopPropagation()
    const snapshot = blocks
    const b0 = snapshot[idx]
    const startX = e.clientX
    const startY = e.clientY
    const startRow = b0.r
    const startCol = b0.c
    setSelected(idx)
    draggingRef.current = true
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let newCol = Math.round((startCol * UNIT + dx) / UNIT)
      let newRow = Math.round((startRow * UNIT + dy) / UNIT)
      newCol = Math.max(0, Math.min(cols - b0.width, newCol))
      newRow = Math.max(0, Math.min(rows - b0.height, newRow))
      if (!overlaps(snapshot, idx, newRow, newCol, b0.width, b0.height)) {
        setBlocks(snapshot.map((b, i) => (i === idx ? { ...b, r: newRow, c: newCol } : b)))
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      // 延迟解除拖拽标记，避免 pointerup 后的 click 误触发加格
      setTimeout(() => {
        draggingRef.current = false
      }, 0)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  /** 拖拽右下角缩放方块 */
  const startResize = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation()
    const snapshot = blocks
    const b0 = snapshot[idx]
    const startX = e.clientX
    const startY = e.clientY
    const startW = b0.width
    const startH = b0.height
    setSelected(idx)
    draggingRef.current = true
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let newW = Math.round((startW * UNIT + dx) / UNIT)
      let newH = Math.round((startH * UNIT + dy) / UNIT)
      newW = Math.max(1, Math.min(cols - b0.c, newW))
      newH = Math.max(1, Math.min(rows - b0.r, newH))
      if (!overlaps(snapshot, idx, b0.r, b0.c, newW, newH)) {
        setBlocks(snapshot.map((b, i) => (i === idx ? { ...b, width: newW, height: newH } : b)))
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setTimeout(() => {
        draggingRef.current = false
      }, 0)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const gridCells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      gridCells.push(
        <div
          key={`${r}-${c}`}
          className="cl-cell"
          style={{ top: r * UNIT, left: c * UNIT }}
          onClick={() => addBlockAt(r, c)}
        />,
      )
    }
  }

  return (
    <div className="cl-page">
      {/* 左侧：布局设置 */}
      <aside className="cl-sidebar cl-left" hidden={leftCollapsed}>
        <div className="cl-sidebar-inner">
          <h3 className="panel-section-title">布局设置</h3>
          {fromGroup ? <p className="cl-context">来自「{fromGroup} 张图片」分组</p> : null}
          <div className="cl-field">
            <label htmlFor="cl-rows">行数：</label>
            <input
              id="cl-rows"
              type="number"
              min={MIN_GRID}
              max={MAX_GRID}
              value={rowInput}
              onChange={(e) => setRowInput(e.target.value)}
            />
          </div>
          <div className="cl-field">
            <label htmlFor="cl-cols">列数：</label>
            <input
              id="cl-cols"
              type="number"
              min={MIN_GRID}
              max={MAX_GRID}
              value={colInput}
              onChange={(e) => setColInput(e.target.value)}
            />
          </div>
          <button type="button" className="action-button secondary cl-block-btn" onClick={initGrid}>
            初始化网格
          </button>

          <details className="cl-import">
            <summary>导入布局 JSON</summary>
            <textarea
              className="cl-import-input"
              rows={5}
              placeholder="在此粘贴布局 JSON"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button type="button" className="action-button secondary cl-block-btn" onClick={importLayout}>
              导入
            </button>
          </details>
        </div>
      </aside>

      <button
        type="button"
        className="cl-toggle"
        aria-label={leftCollapsed ? '展开左侧栏' : '折叠左侧栏'}
        onClick={() => setLeftCollapsed((v) => !v)}
      >
        {leftCollapsed ? '›' : '‹'}
      </button>

      {/* 中间：工具栏 + 画布 */}
      <main className="cl-center">
        <div className="cl-toolbar">
          <button type="button" className="action-button primary" onClick={addCell}>
            添加单元格
          </button>
          <button type="button" className="action-button secondary" onClick={deleteCell}>
            删除单元格
          </button>
          <button type="button" className="action-button secondary" onClick={autoFill}>
            自动填充空单元格
          </button>
          <button type="button" className="action-button danger" onClick={initGrid}>
            重置布局
          </button>
        </div>

        <div
          className="cl-canvas-viewport"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null)
            }
          }}
        >
          <div className="cl-grid" style={{ width: cols * UNIT, height: rows * UNIT }}>
            {gridCells}
            {blocks.map((b, i) => (
              <div
                key={i}
                className={`cl-block${i === selected ? ' selected' : ''}`}
                style={{
                  top: b.r * UNIT,
                  left: b.c * UNIT,
                  width: b.width * UNIT,
                  height: b.height * UNIT,
                }}
                onPointerDown={(e) => startMove(e, i)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(i)
                }}
              >
                {i + 1}
                <div className="cl-resizer" onPointerDown={(e) => startResize(e, i)} />
              </div>
            ))}
          </div>
        </div>

        <p className="cl-hint">提示：点击空单元格添加块。拖动右下角调整大小。</p>
      </main>

      <button
        type="button"
        className="cl-toggle"
        aria-label={rightCollapsed ? '展开右侧栏' : '折叠右侧栏'}
        onClick={() => setRightCollapsed((v) => !v)}
      >
        {rightCollapsed ? '‹' : '›'}
      </button>

      {/* 右侧：JSON 与操作 */}
      <aside className="cl-sidebar cl-right" hidden={rightCollapsed}>
        <div className="cl-sidebar-inner">
          <h3 className="panel-section-title">当前布局 JSON</h3>
          <textarea className="cl-json" readOnly rows={14} value={jsonStr} />
          <button type="button" className="action-button primary cl-block-btn" onClick={useThisLayout}>
            使用此布局拼图
          </button>
        </div>
      </aside>
    </div>
  )
}

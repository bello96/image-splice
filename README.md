# 图省事 · 在线图片工具箱

> 纯前端拼图与图片处理工具，基于 **React + Vite + TailwindCSS** 复刻 [img.ops-coffee.com/photo](https://img.ops-coffee.com/photo/)。
> 所有处理均在浏览器本地完成 —— **不上传、无水印、无需登录**。

![tech](https://img.shields.io/badge/React-18-61dafb) ![tech](https://img.shields.io/badge/Vite-6-646cff) ![tech](https://img.shields.io/badge/TailwindCSS-4-38bdf8) ![tech](https://img.shields.io/badge/TypeScript-5-3178c6) ![theme](https://img.shields.io/badge/theme-%2303de6d-03de6d)

---

## ✨ 功能

### 🧩 布局拼图
- **135 种预设布局**，按图片数量（1–16 张）分组
- 拖拽换位、单元格内平移 / 缩放图片、间隔条拖拽调比例
- 标注：文字 / 箭头 / 方框 / 圆圈，支持拖拽与编辑
- 样式：间距、圆角、边框、背景色 / 背景图、画布比例（1:1、16:9、9:16…）
- 水印、随机打乱、一键导出（高清 JPG / 标准 JPG / 无损 PNG）、复制到剪贴板

### 🛠️ 工具箱（8 个独立工具）
| 工具 | 说明 |
|---|---|
| 长图拼接 | 多图横 / 竖拼接，可调间距与背景 |
| 图片分割 | 按 N×M 网格切片，打包成 ZIP 下载 |
| 图片压缩 | JPG / WebP 质量压缩，实时显示体积 |
| 图片裁剪 | 拖拽选框 + 四角缩放 |
| 图片圆角 | 圆角滑块，导出透明 PNG |
| 调整大小 | 像素宽高 + 锁定比例 + 快捷缩放 |
| 去除水印 | 框选区域，马赛克 / 模糊 / 纯色遮挡 |
| 拼豆图 | 图片转拼豆（perler / hama）效果，配色清单 + 图纸导出 |

### 🟢 拼豆图（像素豆图纸）
- 像素化到「横向豆数」网格，每格对应一颗豆子
- 两种配色：**自适应取色**（中位切分，颜色数可调）/ **通用色卡**（固定色号映射）
- 豆子样式：带孔圆豆 / 实心圆豆 / 方块；可选 **Floyd–Steinberg 抖动**
- 网格线（每 N 颗一格）、白 / 深 / 透明背景
- 输出**配色清单**（色号 + 用量，便于按号备料）与高清 PNG 图纸

### 📐 自定义布局编辑器
- 自定义网格行列（1–12），点击空格增加单元格
- 拖拽移动、右下角拖拽缩放，自动**碰撞检测**与边界吸附
- 添加单元格 / 删除 / 自动填充空位 / 重置
- 实时生成布局 JSON，支持导入 / 导出（提交给作者）
- 确认后按**实际张数回显**到对应布局分组（会话级）

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 本地预览生产构建
npm run preview
```

---

## 🗺️ 路由（HashRouter）

| 路径 | 页面 |
|---|---|
| `#/` | 布局拼图 |
| `#/custom-layout` | 自定义布局编辑器（入口在左侧栏「+ 自定义」） |
| `#/tools/stitching` | 长图拼接 |
| `#/tools/split` | 图片分割 |
| `#/tools/compress` | 图片压缩 |
| `#/tools/crop` | 图片裁剪 |
| `#/tools/corner` | 图片圆角 |
| `#/tools/resize` | 调整大小 |
| `#/tools/watermark` | 去除水印 |
| `#/tools/beads` | 拼豆图 |

---

## 🧱 技术栈

- **React 18** + **TypeScript 5**
- **Vite 6** 构建，**TailwindCSS 4**（`@tailwindcss/vite` 插件）
- **Zustand** 全局状态管理
- **react-router-dom 7**（HashRouter）多工具路由
- **html2canvas** 画布导出图片
- **JSZip** 图片分割打包
- 全部图片处理基于浏览器 **Canvas API**，纯客户端

---

## 📁 项目结构

```
src/
├── App.tsx                    # 路由壳
├── main.tsx
├── components/
│   ├── CollageTool.tsx        # 拼图主界面
│   ├── Canvas.tsx             # 拼图画布（CSS Grid 渲染布局）
│   ├── LeftSidebar.tsx        # 布局选择（含自定义入口）
│   ├── RightSidebar.tsx       # 样式 / 导出设置
│   ├── CustomLayoutTool.tsx   # 自定义布局编辑器
│   ├── annotations/           # 文字 / 箭头 / 形状标注
│   └── tools/                 # 8 个工具组件（含 BeadsTool 拼豆图）+ ToolShell
├── store/useStore.ts          # Zustand 状态（布局 / 图片 / 标注 / 样式 / UI）
├── data/
│   ├── layouts.ts             # 135 种布局定义
│   └── beadPalettes.ts        # 拼豆通用色卡（48 色，带色号）
├── lib/                       # 导出、图标、图片工具、拼豆量化(beadify)/渲染(beadRender)
└── styles/app.css             # 设计令牌 + 组件样式（主题色 #03de6d）
```

---

## 🧩 布局数据格式

每个布局用紧凑 JSON 描述，自定义编辑器可直接导入 / 导出：

```jsonc
{
  "g": 5,            // 单元格（图片）数量
  "gr": [3, 2],      // [行数, 列数]
  "c": [             // 各单元格跨度，按位置排序后流式填充
    { "r": 2, "c": 1 },   // r = 行跨度(rowspan)，c = 列跨度(colspan)
    { "r": 1, "c": 1 },
    { "r": 1, "c": 1 },
    { "r": 1, "c": 1 },
    { "r": 1, "c": 1 }
  ]
}
```

> 缺省 `c` 时为 `gr[0] × gr[1]` 的等分网格。

---

## 🔒 隐私

所有图片在**本地浏览器内处理**，不会上传到任何服务器，导出图片无水印。

---

## 📄 说明

本项目为学习用途的功能复刻，原站为 [img.ops-coffee.com/photo](https://img.ops-coffee.com/photo/)，布局数据与交互逻辑经分析后用原创代码重写实现。

合作：Claude Code Opus

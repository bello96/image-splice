import { HashRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Toast from './components/Toast'
import CollageTool from './components/CollageTool'
import StitchingTool from './components/tools/StitchingTool'
import SplitTool from './components/tools/SplitTool'
import CompressTool from './components/tools/CompressTool'
import CropTool from './components/tools/CropTool'
import CornerTool from './components/tools/CornerTool'
import ResizeTool from './components/tools/ResizeTool'
import WatermarkTool from './components/tools/WatermarkTool'
import BeadsTool from './components/tools/BeadsTool'
import CustomLayoutTool from './components/CustomLayoutTool'

export default function App() {
  return (
    <HashRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<CollageTool />} />
        <Route path="/custom-layout" element={<CustomLayoutTool />} />
        <Route path="/tools/stitching" element={<StitchingTool />} />
        <Route path="/tools/split" element={<SplitTool />} />
        <Route path="/tools/compress" element={<CompressTool />} />
        <Route path="/tools/crop" element={<CropTool />} />
        <Route path="/tools/corner" element={<CornerTool />} />
        <Route path="/tools/resize" element={<ResizeTool />} />
        <Route path="/tools/watermark" element={<WatermarkTool />} />
        <Route path="/tools/beads" element={<BeadsTool />} />
      </Routes>
      <Toast />
    </HashRouter>
  )
}

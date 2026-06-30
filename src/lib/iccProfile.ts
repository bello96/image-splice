/**
 * 给 canvas 导出的 PNG 嵌入 sRGB 颜色声明（sRGB + gAMA + cHRM chunks）。
 *
 * 原因：canvas.toBlob 生成的 PNG 默认不带颜色配置。在广色域屏幕（P3）+ 带色彩
 * 管理的查看器上，标准 sRGB 数值会被当成显示器原生色域来解释，导致整体偏色
 * （发暗、偏黄绿）。插入 PNG 规范的标准 sRGB 声明后，查看器会明确按 sRGB 显示。
 *
 * 这里用 sRGB/gAMA/cHRM 三个 chunk（全是规范常量）声明 sRGB，无需内嵌 ICC profile
 * 二进制，简单可靠。
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/** 组装一个完整 PNG chunk：长度(4) + 类型(4) + 数据 + CRC(4) */
function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) {
    out[4 + i] = type.charCodeAt(i)
  }
  out.set(data, 8)
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10]

/** 扫描已有 chunk：若已含 sRGB/iCCP 颜色声明则无需再插入；遇到 IDAT 即停止 */
function alreadyHasColorChunk(buf: Uint8Array): boolean {
  let off = 8
  while (off + 8 <= buf.length) {
    const len = new DataView(buf.buffer, buf.byteOffset + off, 4).getUint32(0)
    const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7])
    if (type === 'sRGB' || type === 'iCCP') {
      return true
    }
    if (type === 'IDAT') {
      return false
    }
    off += 12 + len
  }
  return false
}

/** sRGB 标准白点与三原色色度坐标（×100000），用于 cHRM chunk */
const SRGB_CHRM = [31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000]
/** sRGB 标准 gamma：1/2.2 ≈ 0.45455，编码为 ×100000 */
const SRGB_GAMA = 45455

/** 给 PNG blob 插入 sRGB 颜色声明；非 PNG 或已声明则原样返回 */
export async function embedSrgbInPng(blob: Blob): Promise<Blob> {
  const buf = new Uint8Array(await blob.arrayBuffer())
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== PNG_SIG[i]) {
      return blob
    }
  }
  if (alreadyHasColorChunk(buf)) {
    return blob
  }
  // IHDR 紧跟 8 字节签名，数据固定 13 字节，整块 = 4+4+13+4 = 25，结束于偏移 33
  const insertAt = 33
  const srgb = makeChunk('sRGB', new Uint8Array([0])) // 0 = perceptual rendering intent
  const gamaData = new Uint8Array(4)
  new DataView(gamaData.buffer).setUint32(0, SRGB_GAMA)
  const gama = makeChunk('gAMA', gamaData)
  const chrmData = new Uint8Array(32)
  const cdv = new DataView(chrmData.buffer)
  SRGB_CHRM.forEach((v, i) => cdv.setUint32(i * 4, v))
  const chrm = makeChunk('cHRM', chrmData)

  const out = new Uint8Array(buf.length + srgb.length + gama.length + chrm.length)
  out.set(buf.subarray(0, insertAt), 0)
  let off = insertAt
  for (const chunk of [srgb, gama, chrm]) {
    out.set(chunk, off)
    off += chunk.length
  }
  out.set(buf.subarray(insertAt), off)
  return new Blob([out], { type: 'image/png' })
}

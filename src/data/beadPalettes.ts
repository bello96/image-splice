/**
 * 拼豆色卡（通用 48 色）
 *
 * 真实拼豆（perler / hama / artkal 等）由固定色号的豆子拼成，购买时按色号配齐。
 * 这里提供一套覆盖全色域的通用色卡，每个颜色带色号 / 中文名 / hex，
 * 量化时将图片每个像素映射到最接近的色卡颜色，并统计每色用量，便于按号备料。
 */

export interface BeadColor {
  /** 色号，如 B07 */
  code: string
  /** 中文名 */
  name: string
  /** 十六进制颜色 */
  hex: string
}

/** 通用拼豆色卡 —— 中性色 + 红粉 + 橙棕肤 + 黄 + 绿 + 青 + 蓝 + 紫 */
export const BEAD_CARD: BeadColor[] = [
  // 中性
  { code: 'B01', name: '白色', hex: '#FFFFFF' },
  { code: 'B02', name: '乳白', hex: '#F4F0E6' },
  { code: 'B03', name: '浅灰', hex: '#C9CDD2' },
  { code: 'B04', name: '中灰', hex: '#8A9099' },
  { code: 'B05', name: '深灰', hex: '#4B5158' },
  { code: 'B06', name: '黑色', hex: '#1A1A1A' },
  // 红 / 粉
  { code: 'B07', name: '大红', hex: '#E23B2E' },
  { code: 'B08', name: '西瓜红', hex: '#F04E5A' },
  { code: 'B09', name: '樱花粉', hex: '#F7AEC0' },
  { code: 'B10', name: '浅粉', hex: '#FBD3DC' },
  { code: 'B11', name: '玫红', hex: '#D81E78' },
  { code: 'B12', name: '酒红', hex: '#8E1F3D' },
  // 橙 / 棕 / 肤
  { code: 'B13', name: '橙色', hex: '#F5821F' },
  { code: 'B14', name: '橘黄', hex: '#FBA740' },
  { code: 'B15', name: '肤色', hex: '#FBD8B5' },
  { code: 'B16', name: '浅肤', hex: '#F7C9A3' },
  { code: 'B17', name: '驼色', hex: '#C98F5A' },
  { code: 'B18', name: '棕色', hex: '#8B5A2B' },
  { code: 'B19', name: '深棕', hex: '#5A3A22' },
  { code: 'B20', name: '咖啡', hex: '#3E2B22' },
  // 黄
  { code: 'B21', name: '柠檬黄', hex: '#FBE400' },
  { code: 'B22', name: '明黄', hex: '#FDD000' },
  { code: 'B23', name: '鹅黄', hex: '#FAEFA0' },
  { code: 'B24', name: '金黄', hex: '#E0A800' },
  // 绿
  { code: 'B25', name: '嫩绿', hex: '#B6E36A' },
  { code: 'B26', name: '草绿', hex: '#6FBE44' },
  { code: 'B27', name: '翠绿', hex: '#1FA84F' },
  { code: 'B28', name: '墨绿', hex: '#1C6B3C' },
  { code: 'B29', name: '深绿', hex: '#14532D' },
  { code: 'B30', name: '薄荷', hex: '#9FE3C4' },
  // 青 / 湖
  { code: 'B31', name: '青色', hex: '#19B5B0' },
  { code: 'B32', name: '湖蓝', hex: '#1C9DC4' },
  { code: 'B33', name: '天蓝', hex: '#5BC2E7' },
  { code: 'B34', name: '浅蓝', hex: '#ABD9EE' },
  // 蓝
  { code: 'B35', name: '蓝色', hex: '#2156C8' },
  { code: 'B36', name: '宝蓝', hex: '#1B3A8B' },
  { code: 'B37', name: '藏青', hex: '#16265A' },
  { code: 'B38', name: '雾蓝', hex: '#8FA6CC' },
  // 紫 / 品红
  { code: 'B39', name: '紫色', hex: '#6E3FA3' },
  { code: 'B40', name: '浅紫', hex: '#B79BD6' },
  { code: 'B41', name: '薰衣草', hex: '#D9CBEC' },
  { code: 'B42', name: '品红', hex: '#C0278E' },
  { code: 'B43', name: '紫红', hex: '#8E2C6E' },
  // 补充
  { code: 'B44', name: '米色', hex: '#E8DCC0' },
  { code: 'B45', name: '砖红', hex: '#B8442E' },
  { code: 'B46', name: '橄榄', hex: '#7A7B2E' },
  { code: 'B47', name: '钢蓝', hex: '#4A6A8A' },
  { code: 'B48', name: '银灰', hex: '#DDE1E5' },
]

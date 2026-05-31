const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function readOcrText(result = {}) {
  const items = result.items || result.Items || result.textDetections || result.TextDetections || []
  if (Array.isArray(items) && items.length) {
    return items
      .map(item => item.text || item.Text || item.DetectedText || item.words || '')
      .filter(Boolean)
      .join('\n')
  }
  return result.text || result.Text || ''
}

function includesAny(text, words) {
  return words.some(word => text.includes(word))
}

function parseDistanceKm(text) {
  const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|KM|公里)/)
  if (kmMatch) return Number(kmMatch[1])
  const meterMatch = text.match(/(\d{3,5})\s*(?:m|米)/)
  if (meterMatch) return Number((Number(meterMatch[1]) / 1000).toFixed(1))
  return 3
}

function estimateTakeout(text) {
  const normalized = String(text || '').replace(/\s+/g, '')
  let foodCarbon = 1.2
  const reasons = []

  if (includesAny(normalized, ['牛肉', '羊肉', '烤肉', '汉堡', '炸鸡', '鸡排', '猪肉', '排骨'])) {
    foodCarbon = 3.2
    reasons.push('识别到高肉类/油炸餐品')
  } else if (includesAny(normalized, ['鸡肉', '鱼', '虾', '鸭', '肉丝', '肉片', '盖饭'])) {
    foodCarbon = 2.1
    reasons.push('识别到普通肉类餐品')
  } else if (includesAny(normalized, ['沙拉', '素', '蔬菜', '水果', '轻食', '豆腐'])) {
    foodCarbon = 0.9
    reasons.push('识别到低碳或素食餐品')
  } else {
    reasons.push('未识别到明确餐品类型，按普通外卖估算')
  }

  let packageCarbon = 0.35
  if (includesAny(normalized, ['无需餐具', '不要餐具', '不需要餐具', '0套餐具'])) {
    packageCarbon = 0.2
    reasons.push('识别到减少一次性餐具')
  } else if (includesAny(normalized, ['餐具', '筷子', '勺', '打包盒', '包装费'])) {
    packageCarbon = 0.45
    reasons.push('识别到餐具/包装信息')
  }

  const distanceKm = parseDistanceKm(normalized)
  const deliveryCarbon = Number((distanceKm * 0.08).toFixed(2))
  reasons.push(`按配送距离约 ${distanceKm}km 估算`)

  const carbon = Number((foodCarbon + packageCarbon + deliveryCarbon).toFixed(2))
  return {
    carbon,
    distanceKm,
    foodCarbon,
    packageCarbon,
    deliveryCarbon,
    reasons,
    remark: `截图识别外卖，约${distanceKm}km配送`
  }
}

exports.main = async (event) => {
  const fileID = event.fileID
  if (!fileID) return { success: false, msg: '缺少截图 fileID' }

  const urlRes = await cloud.getTempFileURL({ fileList: [fileID] })
  const tempFileURL = urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL
  if (!tempFileURL) return { success: false, msg: '获取截图临时链接失败' }

  try {
    const ocrRes = await cloud.openapi.ocr.printedText({ imgUrl: tempFileURL })
    const text = readOcrText(ocrRes)
    const estimate = estimateTakeout(text)
    return {
      success: true,
      text,
      estimate
    }
  } catch (err) {
    console.error('OCR识别失败：', err)
    return {
      success: false,
      msg: 'OCR识别失败，请确认云函数权限或手动输入估算值',
      error: err.message || err.errMsg || err
    }
  }
}

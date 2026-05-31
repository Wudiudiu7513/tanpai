const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function formatDate(timestampSeconds) {
  const date = new Date(timestampSeconds * 1000)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function stepsToDistanceKm(steps) {
  return Number((Number(steps || 0) * 0.0007).toFixed(2))
}

function stepsToSavedCarbon(steps) {
  return Number((stepsToDistanceKm(steps) * 0.18).toFixed(2))
}

async function ensureCollection(name) {
  if (typeof db.createCollection !== 'function') return
  try {
    await db.createCollection(name)
  } catch (err) {
    const message = err && (err.errMsg || err.message || '')
    if (!message.includes('already exists') && !message.includes('collection exists')) {
      console.warn(`ensure collection ${name} failed:`, err)
    }
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const weRunData = event.weRunData || {}
  const stepInfoList = weRunData.stepInfoList || []

  if (!OPENID) return { success: false, msg: '未获取到 openid' }
  await ensureCollection('weRunSyncLog')

  const records = stepInfoList
    .filter(item => Number(item.step || 0) > 0)
    .slice(-30)
    .map(item => {
      const date = formatDate(item.timestamp)
      const steps = Number(item.step || 0)
      const distanceKm = stepsToDistanceKm(steps)
      const savedCarbon = stepsToSavedCarbon(steps)
      return {
        id: `werun_${date}`,
        category: 'lowcarbon',
        subCategory: 'wechat_steps',
        title: '微信运动步数',
        carbon: 0,
        savedCarbon,
        steps,
        distanceKm,
        date,
        timestamp: item.timestamp * 1000,
        source: 'werun',
        openid: OPENID
      }
    })

  await db.collection('weRunSyncLog').add({
    data: {
      openid: OPENID,
      count: records.length,
      updateTime: db.serverDate()
    }
  })

  return {
    success: true,
    records,
    msg: `已同步 ${records.length} 天微信运动数据`
  }
}

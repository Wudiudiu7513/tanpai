const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function normalizeUserInfo(userInfo = {}) {
  return {
    nickName: userInfo.nickName || userInfo.name || '微信用户',
    avatarUrl: userInfo.avatarUrl || userInfo.avatar || '/images/mine.png'
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const carbonData = Number(event.carbonData || 0)
  const userInfo = normalizeUserInfo(event.userInfo)
  const now = db.serverDate()

  if (!OPENID) {
    return { success: false, msg: '未获取到 openid' }
  }

  const userDoc = {
    openid: OPENID,
    nickName: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl,
    carbonData,
    lastLoginTime: now,
    updateTime: now
  }

  try {
    await db.collection('userData').doc(OPENID).set({
      data: {
        ...userDoc,
        createTime: now
      }
    })
  } catch (err) {
    await db.collection('userData').doc(OPENID).update({
      data: userDoc
    })
  }

  await db.collection('rankList').doc(OPENID).set({
    data: {
      openid: OPENID,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      carbonData,
      updateTime: now
    }
  })

  return { success: true, msg: '排行榜已更新' }
}

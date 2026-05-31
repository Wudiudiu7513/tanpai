const app = getApp()
const { getNetCarbon } = require('../../utils/carbon')

Page({
  data: {
    myName: '我',
    myAvatar: '/images/mine.png',
    myCarbon: '0.00',
    myRank: '-',
    rankList: []
  },

  onShow() {
    this.loadUserInfo()
    this.loadRankData()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('user_info') || {}
    this.setData({
      myName: userInfo.name || userInfo.nickName || '我',
      myAvatar: userInfo.avatar || userInfo.avatarUrl || '/images/mine.png'
    })
  },

  loadRankData() {
    const records = wx.getStorageSync('carbon_records') || []
    const myTotal = getNetCarbon(records)
    this.setData({ myCarbon: myTotal.toFixed(2) })

    app.syncUserData({ carbonData: myTotal })
    if (!app.globalData.cloudReady) {
      this.loadLocalRank(myTotal)
      return
    }

    wx.showLoading({ title: '加载排行...' })
    const db = wx.cloud.database()
    db.collection('rankList')
      .orderBy('carbonData', 'asc')
      .limit(100)
      .get()
      .then((res) => {
        wx.hideLoading()
        const openid = app.globalData.openid || wx.getStorageSync('openid')
        const list = res.data.map((item, index) => ({
          id: item._id,
          rank: index + 1,
          name: item.nickName || '微信用户',
          avatar: item.avatarUrl || '/images/mine.png',
          carbon: Number(item.carbonData || 0).toFixed(2),
          isMe: item._id === openid
        }))
        const mine = list.find(item => item.isMe)
        this.setData({
          rankList: list,
          myRank: mine ? mine.rank : '-'
        })
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('加载排行榜失败：', err)
        this.loadLocalRank(myTotal)
        wx.showToast({ title: '已显示本地排行', icon: 'none' })
      })
  },

  loadLocalRank(myTotal) {
    this.setData({
      myRank: 1,
      rankList: [{
        id: 'me',
        rank: 1,
        name: this.data.myName,
        avatar: this.data.myAvatar,
        carbon: myTotal.toFixed(2),
        isMe: true
      }]
    })
  }
})

const { cloudEnvId } = require('./config')

App({
  globalData: {
    userInfo: null,
    openid: '',
    cloudReady: false
  },

  onLaunch() {
    this.initCloud()
    this.loginSilently()
  },

  initCloud() {
    if (!wx.cloud) {
      wx.showModal({
        title: '基础库版本过低',
        content: '请使用微信基础库 2.2.3 或以上版本以启用云开发。',
        showCancel: false
      })
      return
    }

    const initOptions = { traceUser: true }
    if (cloudEnvId) initOptions.env = cloudEnvId
    wx.cloud.init(initOptions)
    this.globalData.cloudReady = true
  },

  loginSilently() {
    if (!this.globalData.cloudReady) return Promise.reject(new Error('cloud-not-ready'))
    if (this.loginPromise) return this.loginPromise

    this.loginPromise = wx.cloud.callFunction({ name: 'login' })
      .then(({ result }) => {
        const openid = result && result.openid
        if (!openid) throw new Error('missing-openid')
        this.globalData.openid = openid
        wx.setStorageSync('openid', openid)
        return openid
      })
      .catch((err) => {
        console.error('静默登录失败：', err)
        wx.showToast({ title: '登录失败，请检查云环境', icon: 'none' })
        throw err
      })

    return this.loginPromise
  },

  saveUserProfile(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('user_info', {
      name: userInfo.nickName,
      avatar: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl
    })
    return this.syncUserData({ userInfo })
  },

  syncUserData({ userInfo, carbonData } = {}) {
    if (!this.globalData.cloudReady) return Promise.resolve()
    return this.loginSilently()
      .then(() => wx.cloud.callFunction({
        name: 'updateRank',
        data: {
          userInfo: userInfo || this.globalData.userInfo || wx.getStorageSync('user_info') || null,
          carbonData: typeof carbonData === 'number' ? carbonData : this.getLocalCarbonTotal()
        }
      }))
      .catch((err) => {
        console.error('同步用户数据失败：', err)
      })
  },

  getLocalCarbonTotal() {
    const records = wx.getStorageSync('carbon_records') || []
    return records.reduce((sum, item) => sum + Number(item.carbon || 0), 0)
  }
})

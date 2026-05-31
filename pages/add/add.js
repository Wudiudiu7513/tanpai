const app = getApp()

Page({
  data: {
    cate: '',
    carbon: '',
    canSave: false
  },

  setCate(e) {
    this.setData({ cate: e.currentTarget.dataset.cate })
    this.checkCanSave()
  },

  setCarbon(e) {
    this.setData({ carbon: e.detail.value })
    this.checkCanSave()
  },

  quick(e) {
    this.setData({ carbon: e.currentTarget.dataset.val })
    this.checkCanSave()
  },

  checkCanSave() {
    const { cate, carbon } = this.data
    this.setData({ canSave: Boolean(cate && carbon && !isNaN(carbon) && Number(carbon) > 0) })
  },

  saveRecord() {
    const { cate, carbon } = this.data
    const now = new Date()
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const record = {
      category: cate,
      carbon: Number(carbon),
      timestamp: now.getTime(),
      date
    }

    const records = wx.getStorageSync('carbon_records') || []
    records.unshift(record)
    wx.setStorageSync('carbon_records', records)

    const total = records.reduce((sum, item) => sum + Number(item.carbon || 0), 0)
    app.syncUserData({ carbonData: total })

    wx.showToast({ title: '保存成功' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/stats/stats' })
    }, 800)
  }
})

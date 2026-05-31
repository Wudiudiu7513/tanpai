const app = getApp()
const { CATEGORIES, QUICK_ITEMS, getCategory, formatDate, getNetCarbon } = require('../../utils/carbon')

Page({
  data: {
    categories: CATEGORIES,
    quickItems: QUICK_ITEMS,
    cate: 'transport',
    carbon: '',
    savedCarbon: '',
    remark: '',
    canSave: false,
    currentCategory: getCategory('transport')
  },

  setCate(e) {
    const cate = e.currentTarget.dataset.cate
    this.setData({
      cate,
      carbon: '',
      savedCarbon: '',
      currentCategory: getCategory(cate)
    })
    this.checkCanSave()
  },

  setCarbon(e) {
    this.setData({ carbon: e.detail.value })
    this.checkCanSave()
  },

  setSavedCarbon(e) {
    this.setData({ savedCarbon: e.detail.value })
    this.checkCanSave()
  },

  setRemark(e) {
    this.setData({ remark: e.detail.value })
  },

  quick(e) {
    const item = this.data.quickItems[e.currentTarget.dataset.index]
    this.setData({
      cate: item.category,
      carbon: item.carbon ? String(item.carbon) : '',
      savedCarbon: item.savedCarbon ? String(item.savedCarbon) : '',
      remark: item.label,
      currentCategory: getCategory(item.category)
    })
    this.checkCanSave()
  },

  checkCanSave() {
    const { currentCategory, carbon, savedCarbon } = this.data
    const value = currentCategory.kind === 'saving' ? savedCarbon : carbon
    this.setData({ canSave: Boolean(value && !isNaN(value) && Number(value) > 0) })
  },

  saveRecord() {
    const { cate, carbon, savedCarbon, remark, currentCategory } = this.data
    const now = new Date()
    const record = {
      id: `manual_${now.getTime()}`,
      category: cate,
      title: remark || currentCategory.name,
      carbon: currentCategory.kind === 'saving' ? 0 : Number(carbon),
      savedCarbon: currentCategory.kind === 'saving' ? Number(savedCarbon) : 0,
      timestamp: now.getTime(),
      date: formatDate(now),
      source: 'manual'
    }

    const records = wx.getStorageSync('carbon_records') || []
    records.unshift(record)
    wx.setStorageSync('carbon_records', records)

    app.syncUserData({ carbonData: getNetCarbon(records) })
    wx.showToast({ title: '保存成功' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/stats/stats' })
    }, 800)
  }
})

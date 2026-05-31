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
    ocrLoading: false,
    ocrText: '',
    ocrReasons: [],
    canSave: false,
    currentCategory: getCategory('transport')
  },

  setCate(e) {
    const cate = e.currentTarget.dataset.cate
    this.setData({
      cate,
      carbon: '',
      savedCarbon: '',
      ocrText: '',
      ocrReasons: [],
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

  recognizeTakeoutScreenshot() {
    if (this.data.cate !== 'takeout') {
      this.setData({
        cate: 'takeout',
        currentCategory: getCategory('takeout'),
        carbon: '',
        savedCarbon: ''
      })
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        const extMatch = filePath.match(/\.[a-zA-Z0-9]+$/)
        const ext = extMatch ? extMatch[0] : '.jpg'
        const cloudPath = `takeout-ocr/${Date.now()}${ext}`
        this.setData({ ocrLoading: true, ocrText: '', ocrReasons: [] })

        wx.cloud.uploadFile({
          cloudPath,
          filePath
        }).then((uploadRes) => wx.cloud.callFunction({
          name: 'ocrTakeout',
          data: { fileID: uploadRes.fileID }
        })).then(({ result }) => {
          if (!result || !result.success) {
            throw new Error(result && result.msg ? result.msg : 'ocr-failed')
          }
          const estimate = result.estimate || {}
          this.setData({
            cate: 'takeout',
            currentCategory: getCategory('takeout'),
            carbon: String(estimate.carbon || ''),
            remark: estimate.remark || '截图识别外卖',
            ocrText: result.text || '',
            ocrReasons: estimate.reasons || [],
            ocrLoading: false
          })
          this.checkCanSave()
          wx.showToast({ title: '识别完成' })
        }).catch((err) => {
          console.error('外卖截图识别失败：', err)
          this.setData({ ocrLoading: false })
          wx.showToast({ title: '识别失败，请手动输入', icon: 'none' })
        })
      }
    })
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

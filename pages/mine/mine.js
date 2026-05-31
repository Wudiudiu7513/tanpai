const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userName: '',
    avatar: '/images/mine.png',
    levelTitle: '低碳小白',
    levelProgress: 0,
    nextLevelNeed: 50,
    totalRecords: 0,
    totalDays: 0,
    totalCarbon: '0.00',
    streakDays: 0,
    treeEmoji: '🌱',
    treeStatus: '种子刚发芽',
    treeLevel: 'Lv.1',
    savedCarbon: '0.00',
    dailyGoal: 8,
    badges: [],
    calendarYear: 2026,
    calendarMonth: 4,
    calendarDays: []
  },

  onLoad() {
    this.initBadges()
    const now = new Date()
    this.setData({
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1
    })
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
    this.generateCalendar()
    this.checkBadges()
  },

  loadUserInfo() {
    const info = wx.getStorageSync('user_info') || {}
    const goal = wx.getStorageSync('daily_goal') || 8
    this.setData({
      isLoggedIn: Boolean(info.nickName || info.name),
      userName: info.name || info.nickName || '',
      avatar: info.avatar || info.avatarUrl || '/images/mine.png',
      dailyGoal: goal
    })
  },

  loginWithWechat() {
    wx.showLoading({ title: '登录中...' })
    app.loginSilently()
      .then(() => {
        const info = wx.getStorageSync('user_info') || {}
        const nextInfo = {
          name: info.name || info.nickName || '微信用户',
          avatar: info.avatar || info.avatarUrl || '/images/mine.png',
          nickName: info.nickName || info.name || '微信用户',
          avatarUrl: info.avatarUrl || info.avatar || '/images/mine.png'
        }
        wx.setStorageSync('user_info', nextInfo)
        return app.syncUserData({ userInfo: nextInfo })
      })
      .then(() => {
        wx.hideLoading()
        this.loadUserInfo()
        wx.showToast({ title: '登录成功' })
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('登录失败：', err)
        wx.showToast({ title: '登录失败，请检查云函数', icon: 'none' })
      })
  },

  onNameInput(e) {
    this.setData({ userName: e.detail.value })
  },

  saveName() {
    const info = wx.getStorageSync('user_info') || {}
    const nextInfo = { ...info, name: this.data.userName, nickName: this.data.userName }
    wx.setStorageSync('user_info', nextInfo)
    app.syncUserData({ userInfo: nextInfo })
  },

  onChooseAvatar(e) {
    const path = e.detail.avatarUrl
    const info = wx.getStorageSync('user_info') || {}
    const nextInfo = { ...info, avatar: path, avatarUrl: path }
    wx.setStorageSync('user_info', nextInfo)
    this.setData({ avatar: path })
    app.syncUserData({ userInfo: nextInfo })
  },

  loadStats() {
    const records = wx.getStorageSync('carbon_records') || []
    const daySet = new Set(records.map(item => item.date))
    const totalCarbon = records.reduce((sum, item) => sum + Number(item.carbon || 0), 0)
    const streakDays = this.calcStreak(daySet)
    const levelInfo = this.calcLevel(totalCarbon)
    const treeInfo = this.calcTree(totalCarbon)
    const avgDaily = 7.5
    const saved = Math.max(0, avgDaily * daySet.size - totalCarbon)
    this.setData({
      totalRecords: records.length,
      totalDays: daySet.size,
      totalCarbon: totalCarbon.toFixed(2),
      streakDays,
      savedCarbon: saved.toFixed(2),
      ...levelInfo,
      ...treeInfo
    })
  },

  calcStreak(daySet) {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (!daySet.has(key)) break
      streak++
    }
    return streak
  },

  calcLevel(totalCarbon) {
    const levels = [
      { title: '低碳小白', min: 0, max: 50 },
      { title: '低碳新手', min: 50, max: 150 },
      { title: '减碳达人', min: 150, max: 300 },
      { title: '环保先锋', min: 300, max: 500 },
      { title: '低碳大师', min: 500, max: 999999 }
    ]
    const current = levels.slice().reverse().find(item => totalCarbon >= item.min) || levels[0]
    return {
      levelTitle: current.title,
      levelProgress: Math.min(100, Math.round((totalCarbon - current.min) / (current.max - current.min) * 100)),
      nextLevelNeed: Math.max(0, current.max - totalCarbon).toFixed(1)
    }
  },

  calcTree(totalCarbon) {
    if (totalCarbon >= 500) return { treeEmoji: '🌳', treeStatus: '低碳大树枝繁叶茂', treeLevel: 'Lv.5' }
    if (totalCarbon >= 300) return { treeEmoji: '🌲', treeStatus: '小树正在茁壮成长', treeLevel: 'Lv.4' }
    if (totalCarbon >= 150) return { treeEmoji: '🌿', treeStatus: '树苗长大了', treeLevel: 'Lv.3' }
    if (totalCarbon >= 50) return { treeEmoji: '🌾', treeStatus: '嫩芽正在生长', treeLevel: 'Lv.2' }
    return { treeEmoji: '🌱', treeStatus: '种子刚发芽', treeLevel: 'Lv.1' }
  },

  initBadges() {
    this.setData({
      badges: [
        { id: 'first', icon: '🎉', name: '初次记录', desc: '完成第一条记录', unlocked: false },
        { id: 'week', icon: '📅', name: '坚持一周', desc: '连续打卡 7 天', unlocked: false },
        { id: 'month', icon: '🗓️', name: '月度达人', desc: '连续打卡 30 天', unlocked: false },
        { id: 'save100', icon: '🏅', name: '百碳勇士', desc: '累计节碳 100kg', unlocked: false },
        { id: 'lowday', icon: '⭐', name: '低碳日', desc: '单日碳排低于 3kg', unlocked: false },
        { id: 'tree3', icon: '🌿', name: '种树达人', desc: '低碳树达到 Lv.3', unlocked: false },
        { id: 'master', icon: '👑', name: '低碳大师', desc: '达到最高等级', unlocked: false }
      ]
    })
  },

  checkBadges() {
    const records = wx.getStorageSync('carbon_records') || []
    const badges = this.data.badges.map(item => ({ ...item, unlocked: false }))
    const unlock = id => {
      const item = badges.find(badge => badge.id === id)
      if (item) item.unlocked = true
    }
    if (records.length > 0) unlock('first')
    if (this.data.streakDays >= 7) unlock('week')
    if (this.data.streakDays >= 30) unlock('month')
    if (Number(this.data.savedCarbon) >= 100) unlock('save100')
    if (records.some(item => Number(item.carbon) < 3)) unlock('lowday')
    if (Number(this.data.treeLevel.replace('Lv.', '')) >= 3) unlock('tree3')
    if (this.data.levelTitle === '低碳大师') unlock('master')
    this.setData({ badges })
  },

  generateCalendar() {
    const { calendarYear, calendarMonth } = this.data
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay()
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const records = wx.getStorageSync('carbon_records') || []
    const checkSet = new Set(records.map(item => item.date))
    const list = []
    for (let i = 0; i < firstDay; i++) list.push({ empty: true })
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${calendarYear}-${calendarMonth}-${day}`
      list.push({ day, checked: checkSet.has(key), isToday: key === todayStr, empty: false })
    }
    this.setData({ calendarDays: list })
  },

  prevMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth -= 1
    if (calendarMonth < 1) {
      calendarMonth = 12
      calendarYear -= 1
    }
    this.setData({ calendarYear, calendarMonth })
    this.generateCalendar()
  },

  nextMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth += 1
    if (calendarMonth > 12) {
      calendarMonth = 1
      calendarYear += 1
    }
    this.setData({ calendarYear, calendarMonth })
    this.generateCalendar()
  },

  onGoalChange(e) {
    this.setData({ dailyGoal: e.detail.value })
    wx.setStorageSync('daily_goal', e.detail.value)
  },

  exportData() {
    wx.setClipboardData({
      data: JSON.stringify(wx.getStorageSync('carbon_records') || [], null, 2)
    })
  },

  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '将删除本地所有碳排记录，不可恢复。',
      success: (res) => {
        if (!res.confirm) return
        wx.setStorageSync('carbon_records', [])
        app.syncUserData({ carbonData: 0 })
        this.onShow()
        wx.showToast({ title: '已清除' })
      }
    })
  },

  showAbout() {
    wx.showModal({
      title: '轻碳生活',
      content: '一个用于记录、统计和分享低碳行动的小程序。',
      showCancel: false
    })
  },

  feedback() {
    wx.showToast({ title: '感谢反馈' })
  }
})

Page({
  data: {
    timeRange: 'week',
    totalCarbon: '0.00',
    avgCarbon: '0.00',
    recordDays: 0,
    treeAbsorb: 0,
    lightHours: 0,
    drivingKm: 0,
    transportPercent: 0,
    foodPercent: 0,
    electricPercent: 0,
    chartData: [],
    adviceList: []
  },

  onShow() {
    this.loadData()
  },

  switchTime(e) {
    this.setData({ timeRange: e.currentTarget.dataset.range })
    this.loadData()
  },

  loadData() {
    const records = wx.getStorageSync('carbon_records') || []
    const now = new Date()
    const startDate = new Date()
    if (this.data.timeRange === 'week') startDate.setDate(now.getDate() - 7)
    if (this.data.timeRange === 'month') startDate.setMonth(now.getMonth() - 1)
    if (this.data.timeRange === 'quarter') startDate.setMonth(now.getMonth() - 3)

    const filtered = records.filter(item => new Date(item.timestamp) >= startDate)
    const totals = { transport: 0, food: 0, electric: 0 }
    filtered.forEach(item => {
      if (totals[item.category] !== undefined) totals[item.category] += Number(item.carbon || 0)
    })

    const total = totals.transport + totals.food + totals.electric
    const daySet = new Set(filtered.map(item => item.date))
    const recordDays = daySet.size
    const daysForAverage = recordDays || 1
    const transportPercent = total ? Math.round(totals.transport / total * 100) : 0
    const foodPercent = total ? Math.round(totals.food / total * 100) : 0
    const electricPercent = total ? 100 - transportPercent - foodPercent : 0

    this.setData({
      totalCarbon: total.toFixed(2),
      avgCarbon: (total / daysForAverage).toFixed(2),
      recordDays,
      treeAbsorb: Math.ceil(total / 0.06),
      lightHours: Math.round(total / 0.05),
      drivingKm: Math.round(total / 0.21),
      transportPercent,
      foodPercent,
      electricPercent,
      chartData: this.generateChartData(filtered),
      adviceList: this.generateAdvice(totals, total, daysForAverage)
    })
  },

  generateChartData(records) {
    const now = new Date()
    const dayMap = {}
    const labels = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      dayMap[key] = 0
      labels.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}` })
    }

    records.forEach(item => {
      if (dayMap[item.date] !== undefined) dayMap[item.date] += Number(item.carbon || 0)
    })

    const maxVal = Math.max(1, ...Object.keys(dayMap).map(key => dayMap[key]))
    return labels.map(item => {
      const value = dayMap[item.key]
      let color = '#2ecc71'
      if (value > 5) color = '#f39c12'
      if (value > 10) color = '#e74c3c'
      return {
        date: item.key,
        label: item.label,
        value: value.toFixed(1),
        height: Math.max(4, Math.round(value / maxVal * 200)),
        color
      }
    })
  },

  generateAdvice(totals, total, daysForAverage) {
    if (total === 0) return ['还没有记录数据，去记录一次碳足迹吧。']

    const advice = []
    const maxCategory = Object.keys(totals).sort((a, b) => totals[b] - totals[a])[0]
    if (maxCategory === 'transport') advice.push('交通碳排占比较高，可优先选择公共交通、骑行或步行。')
    if (maxCategory === 'food') advice.push('饮食碳排占比较高，可增加本地食材和低碳餐食比例。')
    if (maxCategory === 'electric') advice.push('用电碳排占比较高，记得关闭待机电器并合理设置空调温度。')

    const avg = total / daysForAverage
    advice.push(avg > 8 ? '日均碳排偏高，可以先从一次短途出行或一餐低碳饮食开始调整。' : '碳排控制不错，继续保持稳定记录。')
    advice.push('每少排放 1kg CO₂，都是一次看得见的低碳行动。')
    return advice
  }
})

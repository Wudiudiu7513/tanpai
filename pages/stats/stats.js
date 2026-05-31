const { CATEGORIES, sumRecords, getCategory } = require('../../utils/carbon')

Page({
  data: {
    timeRange: 'week',
    totalCarbon: '0.00',
    savedCarbon: '0.00',
    netCarbon: '0.00',
    avgCarbon: '0.00',
    recordDays: 0,
    treeAbsorb: 0,
    lightHours: 0,
    drivingKm: 0,
    chartData: [],
    categoryStats: [],
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
    const totals = sumRecords(filtered)
    const netCarbon = Math.max(0, totals.emission - totals.saving)
    const daySet = new Set(filtered.map(item => item.date))
    const recordDays = daySet.size
    const daysForAverage = recordDays || 1

    this.setData({
      totalCarbon: totals.emission.toFixed(2),
      savedCarbon: totals.saving.toFixed(2),
      netCarbon: netCarbon.toFixed(2),
      avgCarbon: (netCarbon / daysForAverage).toFixed(2),
      recordDays,
      treeAbsorb: Math.ceil(netCarbon / 0.06),
      lightHours: Math.round(netCarbon / 0.05),
      drivingKm: Math.round(netCarbon / 0.21),
      chartData: this.generateChartData(filtered),
      categoryStats: this.generateCategoryStats(filtered, totals.emission),
      adviceList: this.generateAdvice(filtered, totals, daysForAverage)
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
      if (dayMap[item.date] !== undefined) {
        dayMap[item.date] += Math.max(0, Number(item.carbon || 0) - Number(item.savedCarbon || 0))
      }
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

  generateCategoryStats(records, totalEmission) {
    return CATEGORIES.map(category => {
      const emission = records
        .filter(item => item.category === category.id)
        .reduce((sum, item) => sum + Number(item.carbon || 0), 0)
      const saving = records
        .filter(item => item.category === category.id)
        .reduce((sum, item) => sum + Number(item.savedCarbon || 0), 0)
      const value = category.kind === 'saving' ? saving : emission
      const percent = totalEmission && category.kind !== 'saving' ? Math.round(emission / totalEmission * 100) : 0
      return {
        ...category,
        value: value.toFixed(2),
        percent,
        barWidth: category.kind === 'saving' ? Math.min(100, Math.round(saving * 20)) : percent
      }
    }).filter(item => Number(item.value) > 0 || item.kind !== 'saving')
  },

  generateAdvice(records, totals, daysForAverage) {
    if (records.length === 0) return ['还没有记录数据，可以先同步微信运动或记录一次外卖/通勤。']

    const advice = []
    const emissionRecords = records.filter(item => Number(item.carbon || 0) > 0)
    const maxItem = emissionRecords.sort((a, b) => Number(b.carbon || 0) - Number(a.carbon || 0))[0]
    if (maxItem) {
      const category = getCategory(maxItem.category)
      advice.push(`${category.name}是近期较高的排放来源，可以优先从这里优化。`)
    }

    if (records.some(item => item.category === 'takeout')) {
      advice.push('外卖记录已纳入统计，后续可通过少用一次性餐具、到店自取降低包装和配送排放。')
    }
    if (totals.saving > 0) {
      advice.push(`低碳行为已累计减排 ${totals.saving.toFixed(2)}kg CO₂，继续同步步数会让排行更真实。`)
    }

    const avg = Math.max(0, totals.emission - totals.saving) / daysForAverage
    advice.push(avg > 8 ? '净日均碳排偏高，建议先减少一次自驾、外卖或高碳购物。' : '净碳排控制不错，继续保持稳定记录。')
    return advice
  }
})

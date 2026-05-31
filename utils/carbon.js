const CATEGORIES = [
  { id: 'transport', name: '交通', icon: '🚗', color: '#3498db', kind: 'emission' },
  { id: 'food', name: '饮食', icon: '🍽️', color: '#e67e22', kind: 'emission' },
  { id: 'takeout', name: '外卖', icon: '🥡', color: '#ff8a65', kind: 'emission' },
  { id: 'electric', name: '用电', icon: '💡', color: '#f1c40f', kind: 'emission' },
  { id: 'shopping', name: '购物', icon: '🛍️', color: '#9b59b6', kind: 'emission' },
  { id: 'home', name: '居家', icon: '🏠', color: '#16a085', kind: 'emission' },
  { id: 'lowcarbon', name: '低碳行为', icon: '🌿', color: '#2ecc71', kind: 'saving' }
]

const QUICK_ITEMS = [
  { category: 'transport', label: '自驾 10km', carbon: 2.1 },
  { category: 'transport', label: '网约车 10km', carbon: 1.9 },
  { category: 'food', label: '普通一餐', carbon: 1.6 },
  { category: 'food', label: '高肉类一餐', carbon: 3.0 },
  { category: 'takeout', label: '外卖含配送包装', carbon: 1.2 },
  { category: 'takeout', label: '少餐具外卖', carbon: 0.8 },
  { category: 'electric', label: '用电 5 小时', carbon: 1.0 },
  { category: 'shopping', label: '快递包裹 1 件', carbon: 0.6 },
  { category: 'shopping', label: '衣物消费 1 件', carbon: 6.0 },
  { category: 'home', label: '燃气热水 20 分钟', carbon: 0.7 },
  { category: 'lowcarbon', label: '自带杯/少用一次性用品', savedCarbon: 0.2 },
  { category: 'lowcarbon', label: '旧物回收一次', savedCarbon: 1.0 }
]

function getCategory(id) {
  return CATEGORIES.find(item => item.id === id) || CATEGORIES[0]
}

function formatDate(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function sumRecords(records = []) {
  return records.reduce((result, item) => {
    result.emission += Number(item.carbon || 0)
    result.saving += Number(item.savedCarbon || 0)
    return result
  }, { emission: 0, saving: 0 })
}

function getNetCarbon(records = []) {
  const totals = sumRecords(records)
  return Math.max(0, totals.emission - totals.saving)
}

function stepsToDistanceKm(steps) {
  return Number((Number(steps || 0) * 0.0007).toFixed(2))
}

function stepsToSavedCarbon(steps) {
  const distanceKm = stepsToDistanceKm(steps)
  return Number((distanceKm * 0.18).toFixed(2))
}

module.exports = {
  CATEGORIES,
  QUICK_ITEMS,
  getCategory,
  formatDate,
  sumRecords,
  getNetCarbon,
  stepsToDistanceKm,
  stepsToSavedCarbon
}

// 快捷入口数据管理工具

const QA_ENABLED_KEY = 'nav-quickaccess-enabled'
const QA_SECTIONS_KEY = 'nav-quickaccess-sections'
const QA_CLICKS_KEY = 'nav-quickaccess-clicks'
const QA_PINNED_KEY = 'nav-quickaccess-pinned'

// 默认子分类配置（id, 名称, 是否可见, 排序）
const DEFAULT_SECTIONS = [
  { id: 'recent', name: '最近使用', visible: true, order: 0 },
  { id: 'most', name: '最多使用', visible: true, order: 1 },
  { id: 'new', name: '最近上新', visible: true, order: 2 },
  { id: 'pinned', name: '置顶', visible: true, order: 3 },
]

// 获取快捷入口总开关
export function getQuickAccessEnabled() {
  return localStorage.getItem(QA_ENABLED_KEY) !== 'false'
}

// 保存快捷入口总开关
export function saveQuickAccessEnabled(enabled) {
  localStorage.setItem(QA_ENABLED_KEY, enabled.toString())
}

// 获取子分类配置
export function getQuickAccessSections() {
  const saved = localStorage.getItem(QA_SECTIONS_KEY)
  if (!saved) return [...DEFAULT_SECTIONS]
  try {
    const parsed = JSON.parse(saved)
    // 确保所有默认子分类都存在（防止版本升级后缺失）
    const merged = DEFAULT_SECTIONS.map(def => {
      const found = parsed.find(p => p.id === def.id)
      return found ? { ...def, ...found } : def
    })
    return merged.sort((a, b) => a.order - b.order)
  } catch {
    return [...DEFAULT_SECTIONS]
  }
}

// 保存子分类配置
export function saveQuickAccessSections(sections) {
  localStorage.setItem(QA_SECTIONS_KEY, JSON.stringify(sections))
}

// 重置子分类配置
export function resetQuickAccessSections() {
  localStorage.removeItem(QA_SECTIONS_KEY)
}

// ========== 点击记录 ==========

// 记录一次网站点击
export function recordSiteClick(site) {
  const clicks = getClickRecords()
  const key = site.url
  const now = Date.now()

  if (!clicks[key]) {
    clicks[key] = { site, count: 0, firstClick: now, lastClick: now }
  }
  clicks[key].count += 1
  clicks[key].lastClick = now
  // 更新 site 信息（以防名称等变更）
  clicks[key].site = site

  localStorage.setItem(QA_CLICKS_KEY, JSON.stringify(clicks))
}

// 获取点击记录
export function getClickRecords() {
  const saved = localStorage.getItem(QA_CLICKS_KEY)
  if (!saved) return {}
  try { return JSON.parse(saved) } catch { return {} }
}

// 获取最近使用的网站（按最后点击时间倒序）
export function getRecentSites(limit = 8) {
  const clicks = getClickRecords()
  return Object.values(clicks)
    .sort((a, b) => b.lastClick - a.lastClick)
    .slice(0, limit)
    .map(item => item.site)
}

// 获取最多使用的网站（按点击次数倒序）
export function getMostUsedSites(limit = 8) {
  const clicks = getClickRecords()
  return Object.values(clicks)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => item.site)
}

// ========== 最近上新 ==========

// 获取最近上新的网站（所有分类中按添加时间倒序）
// 由于现有数据结构没有 createdAt，我们用 id（时间戳）近似
export function getNewestSites(allCategories, limit = 8) {
  const allSites = []
  allCategories.forEach(cat => {
    cat.sites.forEach(site => {
      allSites.push({
        ...site,
        _createdAt: parseInt(site.id) || 0,
        _categoryName: cat.name
      })
    })
  })
  return allSites
    .sort((a, b) => b._createdAt - a._createdAt)
    .slice(0, limit)
}

// ========== 置顶管理 ==========

// 获取置顶列表
export function getPinnedSites() {
  const saved = localStorage.getItem(QA_PINNED_KEY)
  if (!saved) return []
  try { return JSON.parse(saved) } catch { return [] }
}

// 添加置顶
export function addPinnedSite(site) {
  const pinned = getPinnedSites()
  // 去重：按 URL
  const exists = pinned.find(p => p.url === site.url)
  if (exists) return false // 已存在
  pinned.push(site)
  localStorage.setItem(QA_PINNED_KEY, JSON.stringify(pinned))
  return true
}

// 移除置顶
export function removePinnedSite(siteUrl) {
  const pinned = getPinnedSites().filter(p => p.url !== siteUrl)
  localStorage.setItem(QA_PINNED_KEY, JSON.stringify(pinned))
}

// 检查是否已置顶
export function isPinned(siteUrl) {
  return getPinnedSites().some(p => p.url === siteUrl)
}

// 置顶排序
export function reorderPinnedSites(sites) {
  localStorage.setItem(QA_PINNED_KEY, JSON.stringify(sites))
}

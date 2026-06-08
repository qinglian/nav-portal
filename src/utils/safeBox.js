// 保险箱数据管理工具

const SAFE_BOX_ENABLED_KEY = 'nav-safebox-enabled'
const SAFE_BOX_PASSWORD_KEY = 'nav-safebox-password'
const SAFE_BOX_SITES_KEY = 'nav-safebox-sites'

// 获取保险箱开关状态
export function getSafeBoxEnabled() {
  return localStorage.getItem(SAFE_BOX_ENABLED_KEY) === 'true'
}

// 保存保险箱开关状态
export function saveSafeBoxEnabled(enabled) {
  localStorage.setItem(SAFE_BOX_ENABLED_KEY, enabled.toString())
}

// 获取保险箱密码
export function getSafeBoxPassword() {
  return localStorage.getItem(SAFE_BOX_PASSWORD_KEY) || ''
}

// 保存保险箱密码
export function saveSafeBoxPassword(password) {
  localStorage.setItem(SAFE_BOX_PASSWORD_KEY, password)
}

// 清除保险箱密码
export function clearSafeBoxPassword() {
  localStorage.removeItem(SAFE_BOX_PASSWORD_KEY)
}

// 验证密码是否正确
export function verifySafeBoxPassword(input) {
  return input === getSafeBoxPassword()
}

// 获取保险箱网站列表
export function getSafeBoxSites() {
  const saved = localStorage.getItem(SAFE_BOX_SITES_KEY)
  if (!saved) return []
  try { return JSON.parse(saved) } catch { return [] }
}

// 保存保险箱网站列表
export function saveSafeBoxSites(sites) {
  localStorage.setItem(SAFE_BOX_SITES_KEY, JSON.stringify(sites))
}

// 添加网站到保险箱
export function addSafeBoxSite(site) {
  const sites = getSafeBoxSites()
  // 去重：按 URL
  if (sites.find(s => s.url === site.url)) return false
  sites.push({ ...site, id: site.id || 'safe_' + Date.now() })
  saveSafeBoxSites(sites)
  return true
}

// 从保险箱移除网站
export function removeSafeBoxSite(siteId) {
  const sites = getSafeBoxSites().filter(s => s.id !== siteId)
  saveSafeBoxSites(sites)
}

// 重置保险箱（清除所有数据）
export function resetSafeBox() {
  localStorage.removeItem(SAFE_BOX_ENABLED_KEY)
  localStorage.removeItem(SAFE_BOX_PASSWORD_KEY)
  localStorage.removeItem(SAFE_BOX_SITES_KEY)
}

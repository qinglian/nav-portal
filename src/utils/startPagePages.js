// 起始页多页数据管理

const PAGES_KEY = 'nav-startpage-pages'
const CURRENT_PAGE_KEY = 'nav-startpage-current-page'

export const DEFAULT_PAGES = [
  {
    id: 'default',
    name: '首页',
    icon: 'Home',
    order: 0,
  }
]

export function getPages() {
  const saved = localStorage.getItem(PAGES_KEY)
  if (!saved) return [...DEFAULT_PAGES]
  try { return JSON.parse(saved) } catch { return [...DEFAULT_PAGES] }
}

export function savePages(pages) {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages))
}

export function getCurrentPageId() {
  return localStorage.getItem(CURRENT_PAGE_KEY) || 'default'
}

export function setCurrentPageId(id) {
  localStorage.setItem(CURRENT_PAGE_KEY, id)
}

export function addPage(name, icon = 'Home') {
  const pages = getPages()
  const newPage = {
    id: 'page_' + Date.now(),
    name,
    icon,
    order: pages.length,
  }
  pages.push(newPage)
  savePages(pages)
  return newPage
}

export function updatePage(id, updates) {
  const pages = getPages()
  const idx = pages.findIndex(p => p.id === id)
  if (idx !== -1) {
    pages[idx] = { ...pages[idx], ...updates }
    savePages(pages)
  }
}

export function deletePage(id) {
  const pages = getPages()
  const filtered = pages.filter(p => p.id !== id)
  // 重新排序
  filtered.forEach((p, i) => { p.order = i })
  savePages(filtered)
}

export function reorderPages(pages) {
  pages.forEach((p, i) => { p.order = i })
  savePages(pages)
}

// 获取页面专属数据key
export function getPageDataKey(pageId, dataType) {
  return `nav-startpage-${dataType}-${pageId}`
}

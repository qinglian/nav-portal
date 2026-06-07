// 网站状态检测工具

const STATUS_CACHE_KEY = 'nav-site-status-cache'
const STATUS_CACHE_DURATION = 1000 * 60 * 30 // 30分钟缓存

// 读取缓存
function getCache() {
  try {
    const cached = localStorage.getItem(STATUS_CACHE_KEY)
    if (!cached) return {}
    const data = JSON.parse(cached)
    const now = Date.now()
    const valid = {}
    for (const [url, item] of Object.entries(data)) {
      if (now - item.timestamp < STATUS_CACHE_DURATION) {
        valid[url] = item
      }
    }
    return valid
  } catch {
    return {}
  }
}

// 保存缓存
function saveCache(cache) {
  localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(cache))
}

// 检测单个网站状态
export async function checkSiteStatus(url) {
  const cache = getCache()

  if (cache[url]) {
    return cache[url].status
  }

  const results = await Promise.allSettled([
    checkByImage(url),
    checkByFetch(url)
  ])

  const isOnline = results.some(r => r.status === 'fulfilled' && r.value === true)

  // 如果检测失败，标记为 unknown（可能是VPN/墙）
  const hasError = results.every(r => r.status === 'fulfilled' && r.value === false)
  const isUnknown = hasError && isVpnOrBlockedSite(url)

  const status = {
    online: isOnline,
    unknown: isUnknown, // 无法确定（可能是VPN/墙）
    checkedAt: new Date().toISOString()
  }

  cache[url] = { status, timestamp: Date.now() }
  saveCache(cache)

  return status
}

// 判断是否为可能需要VPN的网站
function isVpnOrBlockedSite(url) {
  const vpnPatterns = [
    /github\.com/i,
    /youtube\.com/i,
    /google\.com/i,
    /twitter\.com/i,
    /x\.com/i,
    /facebook\.com/i,
    /instagram\.com/i,
    /reddit\.com/i,
    /discord\.com/i,
    /telegram\.org/i,
    /netflix\.com/i,
    /spotify\.com/i,
    /chatgpt\.com/i,
    /openai\.com/i,
    /claude\.ai/i,
    /anthropic\.com/i,
    /midjourney\.com/i,
    /vercel\.com/i,
    /stackoverflow\.com/i,
    /npmjs\.com/i,
    /dribbble\.com/i,
    /behance\.net/i,
    /unsplash\.com/i,
    /pexels\.com/i,
    /soundcloud\.com/i,
    /twitch\.tv/i,
    /medium\.com/i,
    /notion\.so/i,
    /figma\.com/i,
    /canva\.com/i,
    /dropbox\.com/i,
  ]
  return vpnPatterns.some(p => p.test(url))
}

// 方法1：通过加载网站 favicon 检测
function checkByImage(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url)
      const img = new Image()
      const timeout = setTimeout(() => resolve(false), 8000)

      img.onload = () => { clearTimeout(timeout); resolve(true) }
      img.onerror = () => { clearTimeout(timeout); resolve(false) }
      img.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16&_t=${Date.now()}`
    } catch {
      resolve(false)
    }
  })
}

// 方法2：通过 fetch 检测
function checkByFetch(url) {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => { controller.abort(); resolve(false) }, 8000)

    fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    })
      .then(() => { clearTimeout(timeout); resolve(true) })
      .catch(() => { clearTimeout(timeout); resolve(false) })
  })
}

// 批量检测
export async function checkAllSites(sites) {
  const cache = getCache()
  const now = Date.now()

  const needCheck = sites.filter(site => {
    const cached = cache[site.url]
    return !cached || (now - cached.timestamp >= STATUS_CACHE_DURATION)
  })

  const batchSize = 5
  const results = {}

  for (let i = 0; i < needCheck.length; i += batchSize) {
    const batch = needCheck.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (site) => {
        const status = await checkSiteStatus(site.url)
        return { url: site.url, status }
      })
    )
    batchResults.forEach(r => { results[r.url] = r.status })
  }

  for (const site of sites) {
    if (!results[site.url] && cache[site.url]) {
      results[site.url] = cache[site.url].status
    }
  }

  return results
}

export function clearStatusCache() {
  localStorage.removeItem(STATUS_CACHE_KEY)
}

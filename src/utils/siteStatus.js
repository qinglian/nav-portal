// 网站状态检测工具

const STATUS_CACHE_KEY = 'nav-site-status-cache'
const STATUS_CACHE_DURATION = 1000 * 60 * 30 // 30分钟缓存

// 读取缓存
function getCache() {
  try {
    const cached = localStorage.getItem(STATUS_CACHE_KEY)
    if (!cached) return {}
    const data = JSON.parse(cached)
    // 清理过期缓存
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
  
  // 检查缓存
  if (cache[url]) {
    return cache[url].status
  }

  // 使用多种方法检测
  const results = await Promise.allSettled([
    checkByImage(url),
    checkByFetch(url)
  ])

  // 任一方法成功即认为在线
  const isOnline = results.some(r => r.status === 'fulfilled' && r.value === true)
  
  const status = {
    online: isOnline,
    checkedAt: new Date().toISOString()
  }

  // 更新缓存
  cache[url] = {
    status,
    timestamp: Date.now()
  }
  saveCache(cache)

  return status
}

// 方法1：通过加载网站 favicon 检测
function checkByImage(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url)
      // 尝试加载网站的 favicon
      const img = new Image()
      const timeout = setTimeout(() => {
        resolve(false)
      }, 8000)

      img.onload = () => {
        clearTimeout(timeout)
        resolve(true)
      }
      img.onerror = () => {
        clearTimeout(timeout)
        resolve(false)
      }
      // 使用 Google 的 favicon 服务作为代理检测
      img.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16&_t=${Date.now()}`
    } catch {
      resolve(false)
    }
  })
}

// 方法2：通过 fetch 检测（使用 no-cors 模式）
function checkByFetch(url) {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      resolve(false)
    }, 8000)

    fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    })
      .then(() => {
        clearTimeout(timeout)
        resolve(true)
      })
      .catch(() => {
        clearTimeout(timeout)
        resolve(false)
      })
  })
}

// 批量检测所有网站
export async function checkAllSites(sites) {
  const cache = getCache()
  const now = Date.now()
  
  // 筛选需要检测的网站（缓存过期或未缓存）
  const needCheck = sites.filter(site => {
    const cached = cache[site.url]
    return !cached || (now - cached.timestamp >= STATUS_CACHE_DURATION)
  })

  // 并发检测，限制并发数
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
    batchResults.forEach(r => {
      results[r.url] = r.status
    })
  }

  // 合并缓存结果
  for (const site of sites) {
    if (!results[site.url] && cache[site.url]) {
      results[site.url] = cache[site.url].status
    }
  }

  return results
}

// 清除缓存
export function clearStatusCache() {
  localStorage.removeItem(STATUS_CACHE_KEY)
}

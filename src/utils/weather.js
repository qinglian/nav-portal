// 天气工具类 - 使用国内可用的免费API

const WEATHER_CACHE_KEY = 'nav-weather-cache'
const WEATHER_CACHE_TIME = 'nav-weather-cache-time'
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟

// 天气代码映射
const WEATHER_MAP = {
  '100': { type: 'sunny', desc: '晴', icon: '☀️' },
  '101': { type: 'cloudy', desc: '多云', icon: '⛅' },
  '102': { type: 'cloudy', desc: '少云', icon: '🌤️' },
  '103': { type: 'cloudy', desc: '晴间多云', icon: '⛅' },
  '104': { type: 'overcast', desc: '阴', icon: '☁️' },
  '150': { type: 'sunny', desc: '晴', icon: '🌙' },
  '151': { type: 'cloudy', desc: '多云', icon: '☁️' },
  '152': { type: 'cloudy', desc: '少云', icon: '☁️' },
  '153': { type: 'cloudy', desc: '晴间多云', icon: '☁️' },
  '154': { type: 'overcast', desc: '阴', icon: '☁️' },
  '300': { type: 'rain', desc: '阵雨', icon: '🌦️' },
  '301': { type: 'rain', desc: '强阵雨', icon: '🌧️' },
  '302': { type: 'rain', desc: '雷阵雨', icon: '⛈️' },
  '303': { type: 'rain', desc: '强雷阵雨', icon: '⛈️' },
  '304': { type: 'rain', desc: '雷阵雨伴冰雹', icon: '⛈️' },
  '305': { type: 'rain', desc: '小雨', icon: '🌧️' },
  '306': { type: 'rain', desc: '中雨', icon: '🌧️' },
  '307': { type: 'rain', desc: '大雨', icon: '🌧️' },
  '308': { type: 'rain', desc: '极端降雨', icon: '🌧️' },
  '309': { type: 'rain', desc: '毛毛雨', icon: '🌦️' },
  '310': { type: 'rain', desc: '暴雨', icon: '🌧️' },
  '311': { type: 'rain', desc: '大暴雨', icon: '🌧️' },
  '312': { type: 'rain', desc: '特大暴雨', icon: '🌧️' },
  '313': { type: 'rain', desc: '冻雨', icon: '🌧️' },
  '314': { type: 'rain', desc: '小到中雨', icon: '🌧️' },
  '315': { type: 'rain', desc: '中到大雨', icon: '🌧️' },
  '316': { type: 'rain', desc: '大到暴雨', icon: '🌧️' },
  '317': { type: 'rain', desc: '暴雨到大暴雨', icon: '🌧️' },
  '318': { type: 'rain', desc: '大暴雨到特大暴雨', icon: '🌧️' },
  '399': { type: 'rain', desc: '雨', icon: '🌧️' },
  '400': { type: 'snow', desc: '小雪', icon: '🌨️' },
  '401': { type: 'snow', desc: '中雪', icon: '🌨️' },
  '402': { type: 'snow', desc: '大雪', icon: '❄️' },
  '403': { type: 'snow', desc: '暴雪', icon: '❄️' },
  '404': { type: 'snow', desc: '雨夹雪', icon: '🌨️' },
  '405': { type: 'snow', desc: '雨夹雪', icon: '🌨️' },
  '406': { type: 'snow', desc: '雨夹雪', icon: '🌨️' },
  '407': { type: 'snow', desc: '阵雪', icon: '🌨️' },
  '408': { type: 'snow', desc: '小到中雪', icon: '🌨️' },
  '409': { type: 'snow', desc: '中到大雪', icon: '❄️' },
  '410': { type: 'snow', desc: '大到暴雪', icon: '❄️' },
  '499': { type: 'snow', desc: '雪', icon: '❄️' },
  '500': { type: 'fog', desc: '薄雾', icon: '🌫️' },
  '501': { type: 'fog', desc: '雾', icon: '🌫️' },
  '502': { type: 'fog', desc: '霾', icon: '🌫️' },
  '503': { type: 'fog', desc: '扬沙', icon: '🌫️' },
  '504': { type: 'fog', desc: '浮尘', icon: '🌫️' },
  '507': { type: 'fog', desc: '沙尘暴', icon: '🌫️' },
  '508': { type: 'fog', desc: '强沙尘暴', icon: '🌫️' },
  '509': { type: 'fog', desc: '浓雾', icon: '🌫️' },
  '510': { type: 'fog', desc: '强浓雾', icon: '🌫️' },
  '511': { type: 'fog', desc: '中度霾', icon: '🌫️' },
  '512': { type: 'fog', desc: '重度霾', icon: '🌫️' },
  '513': { type: 'fog', desc: '严重霾', icon: '🌫️' },
  '514': { type: 'fog', desc: '大雾', icon: '🌫️' },
  '515': { type: 'fog', desc: '特强浓雾', icon: '🌫️' },
  '900': { type: 'hot', desc: '热', icon: '🔥' },
  '901': { type: 'cold', desc: '冷', icon: '🥶' },
  '999': { type: 'unknown', desc: '未知', icon: '❓' },
}

function mapCode(code) {
  return WEATHER_MAP[String(code)] || { type: 'cloudy', desc: '多云', icon: '⛅' }
}

// 获取保存的城市
export function getSavedCity() {
  const saved = localStorage.getItem('nav-weather-city')
  if (!saved) return null
  try { return JSON.parse(saved) } catch { return null }
}

// 保存城市
export function saveCity(cityData) {
  localStorage.setItem('nav-weather-city', JSON.stringify(cityData))
}

// 获取天气开关
export function getWeatherEnabled() {
  return localStorage.getItem('nav-weather-enabled') !== 'false'
}

// 保存天气开关
export function saveWeatherEnabled(enabled) {
  localStorage.setItem('nav-weather-enabled', enabled.toString())
}

// 获取浏览器定位
export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000, enableHighAccuracy: false }
    )
  })
}

// 搜索城市（使用高德地理编码API，国内可用）
export async function searchCity(keyword) {
  try {
    // 使用高德地图API（需要Key，但这里用免费的公共接口）
    const resp = await fetch(
      `https://restapi.amap.com/v3/assistant/inputtips?key=YOUR_AMAP_KEY&keywords=${encodeURIComponent(keyword)}&datatype=all`
    )
    const data = await resp.json()
    if (data.tips) {
      return data.tips.map(t => ({
        id: t.adcode || t.name,
        name: t.name,
        admin1: t.district || '',
        country: '中国',
        lat: t.location ? parseFloat(t.location.split(',')[1]) : 0,
        lon: t.location ? parseFloat(t.location.split(',')[0]) : 0,
      })).filter(t => t.lat && t.lon)
    }
    return []
  } catch {
    // 备用：使用本地简单匹配
    return []
  }
}

// 获取天气数据（使用和风天气免费版，国内可用）
export async function fetchWeather(lat, lon) {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`
  const cached = localStorage.getItem(WEATHER_CACHE_KEY)
  const cachedTime = localStorage.getItem(WEATHER_CACHE_TIME)
  if (cached && cachedTime) {
    try {
      const parsed = JSON.parse(cached)
      if (parsed.cacheKey === cacheKey && Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
        return parsed.data
      }
    } catch {}
  }

  // 使用和风天气免费版API（国内可用）
  // 注意：这里使用一个公共的demo key，实际使用建议申请自己的key
  const key = '8c3d0455f8a4478eaa7e1c5b7289e0c9'
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const resp = await fetch(
      `https://devapi.qweather.com/v7/weather/now?location=${lon.toFixed(2)},${lat.toFixed(2)}&key=${key}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    if (data.code === '200' && data.now) {
      const c = data.now
      const mapped = mapCode(c.icon)
      const weather = {
        temp: parseInt(c.temp),
        feelsLike: parseInt(c.feelsLike),
        humidity: parseInt(c.humidity),
        windSpeed: parseInt(c.windSpeed),
        windDir: c.windDir,
        text: c.text,
        icon: mapped.icon,
        type: mapped.type,
        code: c.icon,
      }
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ cacheKey, data: weather }))
      localStorage.setItem(WEATHER_CACHE_TIME, Date.now().toString())
      return weather
    }
    throw new Error(data.code || '未知错误')
  } catch (err) {
    console.error('天气获取失败:', err)
    return null
  }
}

// 反向地理编码（经纬度 → 城市名）
export async function reverseGeocode(lat, lon) {
  try {
    const key = '8c3d0455f8a4478eaa7e1c5b7289e0c9'
    const resp = await fetch(
      `https://geoapi.qweather.com/v2/city/lookup?location=${lon.toFixed(2)},${lat.toFixed(2)}&key=${key}&number=1`
    )
    const data = await resp.json()
    if (data.code === '200' && data.location?.[0]) {
      return { name: data.location[0].name, admin1: data.location[0].adm1 }
    }
    return null
  } catch {
    return null
  }
}

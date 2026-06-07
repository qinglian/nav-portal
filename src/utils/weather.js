// 天气工具类 - 使用 Open-Meteo 免费API（无需Key）

const WEATHER_CACHE_KEY = 'nav-weather-cache'
const WEATHER_CACHE_TIME = 'nav-weather-cache-time'
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟

// WMO天气代码映射
const WMO_MAP = {
  '0': { type: 'sunny', desc: '晴', icon: '☀️' },
  '1': { type: 'sunny', desc: '大部晴朗', icon: '🌤️' },
  '2': { type: 'cloudy', desc: '多云', icon: '⛅' },
  '3': { type: 'overcast', desc: '阴天', icon: '☁️' },
  '45': { type: 'fog', desc: '雾', icon: '🌫️' },
  '48': { type: 'fog', desc: '冻雾', icon: '🌫️' },
  '51': { type: 'rain', desc: '小毛毛雨', icon: '🌦️' },
  '53': { type: 'rain', desc: '中毛毛雨', icon: '🌦️' },
  '55': { type: 'rain', desc: '大毛毛雨', icon: '🌧️' },
  '56': { type: 'rain', desc: '冻毛毛雨', icon: '🌧️' },
  '57': { type: 'rain', desc: '强冻毛毛雨', icon: '🌧️' },
  '61': { type: 'rain', desc: '小雨', icon: '🌧️' },
  '63': { type: 'rain', desc: '中雨', icon: '🌧️' },
  '65': { type: 'rain', desc: '大雨', icon: '🌧️' },
  '66': { type: 'rain', desc: '冻雨', icon: '🌧️' },
  '67': { type: 'rain', desc: '强冻雨', icon: '🌧️' },
  '71': { type: 'snow', desc: '小雪', icon: '🌨️' },
  '73': { type: 'snow', desc: '中雪', icon: '🌨️' },
  '75': { type: 'snow', desc: '大雪', icon: '❄️' },
  '77': { type: 'snow', desc: '雪粒', icon: '🌨️' },
  '80': { type: 'rain', desc: '小阵雨', icon: '🌦️' },
  '81': { type: 'rain', desc: '中阵雨', icon: '🌧️' },
  '82': { type: 'rain', desc: '强阵雨', icon: '⛈️' },
  '85': { type: 'snow', desc: '小阵雪', icon: '🌨️' },
  '86': { type: 'snow', desc: '大阵雪', icon: '❄️' },
  '95': { type: 'rain', desc: '雷暴', icon: '⛈️' },
  '96': { type: 'rain', desc: '雷暴伴小冰雹', icon: '⛈️' },
  '99': { type: 'rain', desc: '雷暴伴大冰雹', icon: '⛈️' },
}

function mapWMO(code) {
  return WMO_MAP[String(code)] || { type: 'cloudy', desc: '多云', icon: '⛅' }
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

// 搜索城市（使用 Open-Meteo Geocoding API，免费无需Key）
export async function searchCity(keyword) {
  try {
    const lang = navigator.language.startsWith('zh') ? 'zh' : 'en'
    const resp = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(keyword)}&count=5&language=${lang}&format=json`
    )
    const data = await resp.json()
    if (data.results) {
      return data.results.map(r => ({
        id: `${r.latitude},${r.longitude}`,
        name: r.name,
        admin1: r.admin1 || '',
        country: r.country || '',
        lat: r.latitude,
        lon: r.longitude,
      }))
    }
    return []
  } catch {
    return []
  }
}

// 获取天气数据（Open-Meteo，免费无需Key）
export async function fetchWeather(lat, lon) {
  // 检查缓存
  const cacheKey = `${lat},${lon}`
  const cached = localStorage.getItem(WEATHER_CACHE_KEY)
  const cachedTime = localStorage.getItem(WEATHER_CACHE_TIME)
  if (cached && cachedTime) {
    try {
      const parsed = JSON.parse(cached)
      if (parsed.cacheKey === cacheKey && Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
        return parsed.data
      }
    } catch {
      // 缓存损坏，继续获取新数据
    }
  }

  // 尝试多个 API 端点
  const endpoints = [
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`,
    `https://customer-api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`,
  ]

  for (const url of endpoints) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const resp = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (!resp.ok) continue
      const data = await resp.json()
      if (data.current) {
        const c = data.current
        const wmo = mapWMO(c.weather_code)
        const weather = {
          temp: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          windDir: c.wind_direction_10m,
          text: wmo.desc,
          icon: wmo.icon,
          type: wmo.type,
          code: c.weather_code,
        }
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ cacheKey, data: weather }))
        localStorage.setItem(WEATHER_CACHE_TIME, Date.now().toString())
        return weather
      }
    } catch {
      continue
    }
  }
  return null
}

// 反向地理编码（经纬度 → 城市名）
export async function reverseGeocode(lat, lon) {
  try {
    const resp = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=&count=1&language=zh&format=json`
    )
    // Open-Meteo 没有反向地理编码，使用 nominatim
    const resp2 = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh&zoom=10`
    )
    const data = await resp2.json()
    if (data.address) {
      const city = data.address.city || data.address.town || data.address.county || data.address.state || ''
      const country = data.address.country || ''
      return { name: city, admin1: country }
    }
    return null
  } catch {
    return null
  }
}

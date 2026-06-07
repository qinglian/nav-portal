// 天气工具类 - 使用 Open-Meteo 免费API（无需Key，支持CORS）

const WEATHER_CACHE_KEY = 'nav-weather-cache'
const WEATHER_CACHE_TIME = 'nav-weather-cache-time'
const CACHE_DURATION = 30 * 60 * 1000 // 30分钟

// WMO 天气代码映射
const WMO_MAP = {
  0: { type: 'sunny', desc: '晴', icon: '☀️' },
  1: { type: 'sunny', desc: '大部晴朗', icon: '🌤️' },
  2: { type: 'cloudy', desc: '多云', icon: '⛅' },
  3: { type: 'overcast', desc: '阴天', icon: '☁️' },
  45: { type: 'fog', desc: '雾', icon: '🌫️' },
  48: { type: 'fog', desc: '冻雾', icon: '🌫️' },
  51: { type: 'rain', desc: '小毛毛雨', icon: '🌦️' },
  53: { type: 'rain', desc: '中毛毛雨', icon: '🌦️' },
  55: { type: 'rain', desc: '大毛毛雨', icon: '🌧️' },
  56: { type: 'rain', desc: '冻毛毛雨', icon: '🌧️' },
  57: { type: 'rain', desc: '强冻毛毛雨', icon: '🌧️' },
  61: { type: 'rain', desc: '小雨', icon: '🌧️' },
  63: { type: 'rain', desc: '中雨', icon: '🌧️' },
  65: { type: 'rain', desc: '大雨', icon: '🌧️' },
  66: { type: 'rain', desc: '冻雨', icon: '🌧️' },
  67: { type: 'rain', desc: '强冻雨', icon: '🌧️' },
  71: { type: 'snow', desc: '小雪', icon: '🌨️' },
  73: { type: 'snow', desc: '中雪', icon: '🌨️' },
  75: { type: 'snow', desc: '大雪', icon: '❄️' },
  77: { type: 'snow', desc: '雪粒', icon: '🌨️' },
  80: { type: 'rain', desc: '小阵雨', icon: '🌦️' },
  81: { type: 'rain', desc: '中阵雨', icon: '🌧️' },
  82: { type: 'rain', desc: '强阵雨', icon: '⛈️' },
  85: { type: 'snow', desc: '小阵雪', icon: '🌨️' },
  86: { type: 'snow', desc: '大阵雪', icon: '❄️' },
  95: { type: 'rain', desc: '雷暴', icon: '⛈️' },
  96: { type: 'rain', desc: '雷暴伴小冰雹', icon: '⛈️' },
  99: { type: 'rain', desc: '雷暴伴大冰雹', icon: '⛈️' },
}

function mapWMO(code) {
  return WMO_MAP[code] || { type: 'cloudy', desc: '多云', icon: '⛅' }
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
  // 切换城市时清除天气缓存，确保获取新数据
  localStorage.removeItem(WEATHER_CACHE_KEY)
  localStorage.removeItem(WEATHER_CACHE_TIME)
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

// 搜索城市（Open-Meteo Geocoding，免费无需Key）
export async function searchCity(keyword) {
  try {
    const lang = navigator.language.startsWith('zh') ? 'zh' : 'en'
    const resp = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(keyword)}&count=8&language=${lang}&format=json`
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
  } catch (err) {
    console.error('城市搜索失败:', err)
    return []
  }
}

// 获取天气数据（Open-Meteo，免费无需Key，支持CORS）
export async function fetchWeather(lat, lon) {
  // 缓存key使用更高精度
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
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

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
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
    return null
  } catch (err) {
    console.error('天气获取失败:', err)
    return null
  }
}

// 反向地理编码：通过搜索附近城市来推断城市名
export async function reverseGeocode(lat, lon) {
  try {
    // 尝试搜索附近城市（用空搜索不行，用经纬度附近的已知城市）
    // 先尝试用中文城市名搜索常见城市列表
    const majorCities = [
      { name: '北京', lat: 39.9042, lon: 116.4074 },
      { name: '上海', lat: 31.2304, lon: 121.4737 },
      { name: '广州', lat: 23.1291, lon: 113.2644 },
      { name: '深圳', lat: 22.5431, lon: 114.0579 },
      { name: '成都', lat: 30.5728, lon: 104.0668 },
      { name: '杭州', lat: 30.2741, lon: 120.1551 },
      { name: '武汉', lat: 30.5928, lon: 114.3055 },
      { name: '西安', lat: 34.3416, lon: 108.9398 },
      { name: '重庆', lat: 29.5630, lon: 106.5516 },
      { name: '南京', lat: 32.0603, lon: 118.7969 },
      { name: '天津', lat: 39.0842, lon: 117.2009 },
      { name: '苏州', lat: 31.2989, lon: 120.5853 },
      { name: '郑州', lat: 34.7466, lon: 113.6253 },
      { name: '长沙', lat: 28.2280, lon: 112.9388 },
      { name: '沈阳', lat: 41.8057, lon: 123.4315 },
      { name: '青岛', lat: 36.0671, lon: 120.3826 },
      { name: '宁波', lat: 29.8683, lon: 121.5440 },
      { name: '东莞', lat: 23.0489, lon: 113.7447 },
      { name: '佛山', lat: 23.0218, lon: 113.1219 },
      { name: '合肥', lat: 31.8206, lon: 117.2272 },
    ]
    
    // 找最近的城市
    let nearest = null
    let minDist = Infinity
    for (const city of majorCities) {
      const dist = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2))
      if (dist < minDist) {
        minDist = dist
        nearest = city
      }
    }
    
    // 如果距离小于2度（约200公里），认为是该城市
    if (nearest && minDist < 2) {
      return { name: nearest.name, admin1: '' }
    }
    
    return { name: '未知位置', admin1: '' }
  } catch {
    return { name: '未知位置', admin1: '' }
  }
}

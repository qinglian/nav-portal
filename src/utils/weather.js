// 天气工具类 - 使用和风天气免费API

const QW_API = 'https://devapi.qweather.com/v7'
const QW_KEY = 'your_qweather_key' // 需要用户自行申请或使用免费key

// 天气代码映射
const WEATHER_MAP = {
  '100': { type: 'sunny', desc: '晴', icon: '☀️' },
  '101': { type: 'cloudy', desc: '多云', icon: '⛅' },
  '102': { type: 'cloudy', desc: '少云', icon: '🌤️' },
  '103': { type: 'cloudy', desc: '晴间多云', icon: '⛅' },
  '104': { type: 'overcast', desc: '阴', icon: '☁️' },
  '150': { type: 'sunny', desc: '晴（夜）', icon: '🌙' },
  '151': { type: 'cloudy', desc: '多云（夜）', icon: '☁️' },
  '152': { type: 'cloudy', desc: '少云（夜）', icon: '☁️' },
  '153': { type: 'cloudy', desc: '晴间多云（夜）', icon: '☁️' },
  '154': { type: 'overcast', desc: '阴（夜）', icon: '☁️' },
  '300': { type: 'rain', desc: '阵雨', icon: '🌦️' },
  '301': { type: 'rain', desc: '强阵雨', icon: '🌧️' },
  '302': { type: 'rain', desc: '雷阵雨', icon: '⛈️' },
  '303': { type: 'rain', desc: '强雷阵雨', icon: '⛈️' },
  '304': { type: 'rain', desc: '雷阵雨伴有冰雹', icon: '⛈️' },
  '305': { type: 'rain', desc: '小雨', icon: '🌧️' },
  '306': { type: 'rain', desc: '中雨', icon: '🌧️' },
  '307': { type: 'rain', desc: '大雨', icon: '🌧️' },
  '308': { type: 'rain', desc: '极端大雨', icon: '🌧️' },
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

// 获取天气类型
export function getWeatherType(code) {
  return WEATHER_MAP[code]?.type || 'unknown'
}

// 获取天气描述
export function getWeatherDesc(code) {
  return WEATHER_MAP[code]?.desc || '未知'
}

// 获取天气图标
export function getWeatherIcon(code) {
  return WEATHER_MAP[code]?.icon || '❓'
}

// 获取保存的城市
export function getSavedCity() {
  return localStorage.getItem('nav-weather-city') || ''
}

// 保存城市
export function saveCity(city) {
  localStorage.setItem('nav-weather-city', city)
}

// 获取定位
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

// 城市名搜索（使用 GeoAPI）
export async function searchCity(keyword) {
  try {
    const resp = await fetch(
      `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(keyword)}&key=${QW_KEY}&number=5`
    )
    const data = await resp.json()
    if (data.code === '200' && data.location) {
      return data.location.map(loc => ({
        id: loc.id,
        name: loc.name,
        adm1: loc.adm1,
        adm2: loc.adm2,
        country: loc.country,
        lon: loc.lon,
        lat: loc.lat,
      }))
    }
    return []
  } catch {
    return []
  }
}

// 获取天气数据
export async function fetchWeather(locationId) {
  const cacheKey = 'nav-weather-cache'
  const cacheTime = 'nav-weather-cache-time'
  const CACHE_DURATION = 30 * 60 * 1000 // 30分钟

  // 检查缓存
  const cached = localStorage.getItem(cacheKey)
  const cachedTime = localStorage.getItem(cacheTime)
  if (cached && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
    return JSON.parse(cached)
  }

  try {
    const resp = await fetch(
      `${QW_API}/weather/now?location=${locationId}&key=${QW_KEY}`
    )
    const data = await resp.json()
    if (data.code === '200' && data.now) {
      const weather = {
        temp: data.now.temp,
        feelsLike: data.now.feelsLike,
        icon: data.now.icon,
        text: data.now.text,
        windDir: data.now.windDir,
        windScale: data.now.windScale,
        humidity: data.now.humidity,
        vis: data.now.vis,
        pressure: data.now.pressure,
        obsTime: data.now.obsTime,
        type: getWeatherType(data.now.icon),
        desc: getWeatherDesc(data.now.icon),
        emoji: getWeatherIcon(data.now.icon),
      }
      // 保存缓存
      localStorage.setItem(cacheKey, JSON.stringify(weather))
      localStorage.setItem(cacheTime, Date.now().toString())
      return weather
    }
    return null
  } catch {
    return null
  }
}

// 根据经纬度获取位置ID
export async function getLocationId(lat, lon) {
  try {
    const resp = await fetch(
      `https://geoapi.qweather.com/v2/city/lookup?location=${lon},${lat}&key=${QW_KEY}&number=1`
    )
    const data = await resp.json()
    if (data.code === '200' && data.location?.[0]) {
      return {
        id: data.location[0].id,
        name: data.location[0].name,
        adm1: data.location[0].adm1,
      }
    }
    return null
  } catch {
    return null
  }
}

// 获取完整天气信息（含城市名）
export async function getFullWeather(locationId, cityName) {
  const weather = await fetchWeather(locationId)
  if (weather) {
    weather.city = cityName
  }
  return weather
}

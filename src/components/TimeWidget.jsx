import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import styles from './TimeWidget.module.css'

// 简化的天气映射
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
  61: { type: 'rain', desc: '小雨', icon: '🌧️' },
  63: { type: 'rain', desc: '中雨', icon: '🌧️' },
  65: { type: 'rain', desc: '大雨', icon: '🌧️' },
  71: { type: 'snow', desc: '小雪', icon: '🌨️' },
  73: { type: 'snow', desc: '中雪', icon: '🌨️' },
  75: { type: 'snow', desc: '大雪', icon: '❄️' },
  95: { type: 'rain', desc: '雷暴', icon: '⛈️' },
}

function mapWMO(code) {
  return WMO_MAP[code] || { type: 'cloudy', desc: '多云', icon: '⛅' }
}

// ==================== 天气动画 Canvas 组件 ====================
function WeatherEffect({ type }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.parentElement.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    let particles = []

    const createParticle = (w, h, weatherType, randomY = false) => {
      switch (weatherType) {
        case 'rain':
          return {
            x: Math.random() * w * 1.2 - w * 0.1,
            y: randomY ? Math.random() * h : -10,
            speed: 4 + Math.random() * 6,
            length: 12 + Math.random() * 18,
            opacity: 0.15 + Math.random() * 0.25,
            wind: -1.5,
          }
        case 'snow':
          return {
            x: Math.random() * w,
            y: randomY ? Math.random() * h : -10,
            speed: 0.5 + Math.random() * 1.5,
            radius: 1.5 + Math.random() * 3,
            opacity: 0.4 + Math.random() * 0.4,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
          }
        case 'fog':
          return {
            x: randomY ? Math.random() * w : -100,
            y: Math.random() * h,
            speed: 0.3 + Math.random() * 0.5,
            width: 80 + Math.random() * 120,
            height: 20 + Math.random() * 30,
            opacity: 0.04 + Math.random() * 0.06,
          }
        default:
          return {}
      }
    }

    const initParticles = () => {
      particles = []
      const count = type === 'rain' ? 80 : type === 'snow' ? 40 : type === 'fog' ? 15 : 0
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(canvas.width, canvas.height, type, true))
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (type === 'rain') {
        particles.forEach(p => {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.wind * 2, p.y + p.length)
          ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`
          ctx.lineWidth = 1.2
          ctx.lineCap = 'round'
          ctx.stroke()
          p.x += p.wind
          p.y += p.speed
          if (p.y > canvas.height) {
            Object.assign(p, createParticle(canvas.width, canvas.height, 'rain'))
          }
        })
      } else if (type === 'snow') {
        particles.forEach(p => {
          p.wobble += p.wobbleSpeed
          ctx.beginPath()
          ctx.arc(p.x + Math.sin(p.wobble) * 1.5, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
          ctx.fill()
          p.y += p.speed
          if (p.y > canvas.height) {
            Object.assign(p, createParticle(canvas.width, canvas.height, 'snow'))
          }
        })
      } else if (type === 'fog') {
        particles.forEach(p => {
          ctx.beginPath()
          const gradient = ctx.createRadialGradient(
            p.x + p.width / 2, p.y, 0,
            p.x + p.width / 2, p.y, p.width / 2
          )
          gradient.addColorStop(0, `rgba(200, 210, 220, ${p.opacity})`)
          gradient.addColorStop(1, 'rgba(200, 210, 220, 0)')
          ctx.fillStyle = gradient
          ctx.arc(p.x + p.width / 2, p.y, p.width / 2, 0, Math.PI * 2)
          ctx.fill()
          p.x += p.speed
          if (p.x > canvas.width + 100) {
            Object.assign(p, createParticle(canvas.width, canvas.height, 'fog'))
          }
        })
      }

      animRef.current = requestAnimationFrame(draw)
    }

    if (type === 'rain' || type === 'snow' || type === 'fog') {
      initParticles()
      draw()
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [type])

  if (type !== 'rain' && type !== 'snow' && type !== 'fog') return null

  return <canvas ref={canvasRef} className={styles.weatherCanvas} />
}

// ==================== 数字时钟 ====================
function DigitalClock({ date }) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return (
    <div className={styles.digitalClock}>
      <span className={styles.digit}>{hours[0]}</span>
      <span className={styles.digit}>{hours[1]}</span>
      <span className={styles.colon}>:</span>
      <span className={styles.digit}>{minutes[0]}</span>
      <span className={styles.digit}>{minutes[1]}</span>
      <span className={styles.colon}>:</span>
      <span className={styles.digit}>{seconds[0]}</span>
      <span className={styles.digit}>{seconds[1]}</span>
    </div>
  )
}

// ==================== 主组件 ====================
export default function TimeWidget() {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [cityName, setCityName] = useState('')
  const [weatherEnabled, setWeatherEnabled] = useState(() => {
    return localStorage.getItem('nav-weather-enabled') !== 'false'
  })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 监听天气开关变化
  useEffect(() => {
    const handler = () => {
      setWeatherEnabled(localStorage.getItem('nav-weather-enabled') !== 'false')
    }
    window.addEventListener('weatherToggleChanged', handler)
    return () => window.removeEventListener('weatherToggleChanged', handler)
  }, [])

  const loadWeather = useCallback(async () => {
    if (!weatherEnabled) return
    setWeatherLoading(true)
    setWeatherError('')

    try {
      const saved = localStorage.getItem('nav-weather-city')
      let lat = 39.9042
      let lon = 116.4074
      let name = '北京'

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.lat && parsed.lon) {
            lat = parsed.lat
            lon = parsed.lon
            name = parsed.name || '北京'
          }
        } catch {}
      }

      setCityName(name)

      let data = null
      let apiUsed = ''

      // 方案1: Open-Meteo
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
        data = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('GET', url, true)
          xhr.timeout = 5000
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText)) } catch (e) { reject(e) }
            } else reject(new Error(`HTTP ${xhr.status}`))
          }
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.ontimeout = () => reject(new Error('Timeout'))
          xhr.send()
        })
        apiUsed = 'open-meteo'
      } catch (e1) {
        console.warn('Open-Meteo failed:', e1.message)
      }

      // 方案2: wttr.in (备用)
      if (!data) {
        try {
          const url2 = `https://wttr.in/${encodeURIComponent(name)}?format=j1`
          data = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('GET', url2, true)
            xhr.timeout = 5000
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)) } catch (e) { reject(e) }
              } else reject(new Error(`HTTP ${xhr.status}`))
            }
            xhr.onerror = () => reject(new Error('Network error'))
            xhr.ontimeout = () => reject(new Error('Timeout'))
            xhr.send()
          })
          apiUsed = 'wttr'
        } catch (e2) {
          console.warn('wttr.in failed:', e2.message)
        }
      }

      // 处理数据
      if (apiUsed === 'wttr' && data && data.current_condition && data.current_condition[0]) {
        const cc = data.current_condition[0]
        const temp = parseInt(cc.temp_C)
        const code = parseInt(cc.weatherCode)
        const wmo = mapWMO(code)
        setWeather({
          temp,
          text: wmo.desc,
          icon: wmo.icon,
          type: wmo.type,
        })
        setWeatherError('')
      } else if (data && data.current) {
        const wmo = mapWMO(data.current.weather_code)
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          text: wmo.desc,
          icon: wmo.icon,
          type: wmo.type,
        })
        setWeatherError('')
      } else {
        console.warn('All weather APIs failed, using mock data')
        const mockTemp = 20 + Math.floor(Math.random() * 15)
        const mockCodes = [0, 1, 2, 3, 61, 95]
        const mockCode = mockCodes[Math.floor(Math.random() * mockCodes.length)]
        const wmo = mapWMO(mockCode)
        setWeather({
          temp: mockTemp,
          text: wmo.desc + ' (离线)',
          icon: wmo.icon,
          type: wmo.type,
        })
        setWeatherError('')
      }
    } catch (err) {
      console.error('Weather error:', err)
      setWeatherError('天气获取失败')
    }

    setWeatherLoading(false)
  }, [weatherEnabled])

  useEffect(() => {
    if (weatherEnabled) {
      loadWeather()
      const interval = setInterval(loadWeather, 30 * 60 * 1000)
      return () => clearInterval(interval)
    } else {
      setWeather(null)
      setCityName('')
      setWeatherError('')
    }
  }, [weatherEnabled, loadWeather])

  useEffect(() => {
    const handler = () => {
      if (weatherEnabled) loadWeather()
    }
    window.addEventListener('weatherCityChanged', handler)
    return () => window.removeEventListener('weatherCityChanged', handler)
  }, [loadWeather, weatherEnabled])

  const formatDate = (date) => {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
  }

  const getGreeting = () => {
    const h = time.getHours()
    if (h < 6) return '夜深了，注意休息'
    if (h < 9) return '早上好'
    if (h < 12) return '上午好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    if (h < 22) return '晚上好'
    return '夜深了，注意休息'
  }

  const weatherType = weather?.type || 'sunny'

  const weatherBgClass = useMemo(() => {
    if (!weatherEnabled || !weather) return ''
    switch (weatherType) {
      case 'rain': return styles.weatherRain
      case 'snow': return styles.weatherSnow
      case 'overcast': return styles.weatherOvercast
      case 'fog': return styles.weatherFog
      case 'cloudy': return styles.weatherCloudy
      case 'sunny': return styles.weatherSunny
      default: return ''
    }
  }, [weatherType, weatherEnabled, weather])

  return (
    <div className={`${styles.widget} ${weatherBgClass}`}>
      {/* 天气动画 Canvas */}
      {weatherEnabled && weather && <WeatherEffect type={weather.type} />}

      <div className={`${styles.content} ${!weatherEnabled ? styles.contentNoWeather : ''}`}>
        {/* 左侧：问候 + 日期 */}
        <div className={styles.left}>
          <span className={styles.greeting}>{getGreeting()}</span>
          <div className={styles.date}>
            <Calendar size={13} />
            <span>{formatDate(time)}</span>
          </div>
        </div>

        {/* 中间/右侧：翻页时钟 */}
        <div className={weatherEnabled ? styles.center : styles.rightTime}>
          <DigitalClock date={time} />
        </div>

        {/* 右侧：天气（仅开启时显示） */}
        {weatherEnabled && (
          <div className={styles.right}>
            {weather && (
              <div className={styles.weatherInfo}>
                <span className={styles.weatherEmoji}>{weather.icon}</span>
                <div className={styles.weatherDetail}>
                  <span className={styles.weatherTemp}>{weather.temp}°C</span>
                  <span className={styles.weatherText}>{weather.text}</span>
                </div>
                {cityName && (
                  <div className={styles.weatherCity}>
                    <MapPin size={11} />
                    <span>{cityName}</span>
                  </div>
                )}
              </div>
            )}

            {weatherLoading && (
              <div className={styles.weatherLoading}>天气加载中...</div>
            )}

            {weatherError && !weather && (
              <div className={styles.weatherError}>{weatherError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

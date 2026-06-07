import { useState, useEffect, useRef, useMemo } from 'react'
import { Calendar, Clock, MapPin, Droplets, Wind, Eye, Thermometer } from 'lucide-react'
import { fetchWeather, getSavedCity, getLocation, getLocationId, searchCity, saveCity, getWeatherType } from '../utils/weather'
import styles from './TimeWidget.module.css'

// 拟物化天气动画组件
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
    let frame = 0

    // 初始化粒子
    const initParticles = () => {
      particles = []
      const count = type === 'rain' ? 80 : type === 'snow' ? 40 : type === 'fog' ? 15 : 0
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(canvas.width, canvas.height, type, true))
      }
    }

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

      frame++
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

export default function TimeWidget() {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState('')
  const [cityName, setCityName] = useState('')

  // 时间更新
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 天气获取
  useEffect(() => {
    let mounted = true
    const loadWeather = async () => {
      setWeatherLoading(true)
      setWeatherError('')
      try {
        const savedCity = getSavedCity()
        if (savedCity) {
          const cityData = JSON.parse(savedCity)
          setCityName(cityData.name)
          const w = await fetchWeather(cityData.id)
          if (mounted) {
            setWeather(w)
            setWeatherError(w ? '' : '天气数据获取失败')
          }
        } else {
          try {
            const loc = await getLocation()
            const locData = await getLocationId(loc.lat, loc.lon)
            if (locData && mounted) {
              setCityName(locData.name)
              saveCity(JSON.stringify({ id: locData.id, name: locData.name }))
              const w = await fetchWeather(locData.id)
              if (mounted) {
                setWeather(w)
                setWeatherError(w ? '' : '天气数据获取失败')
              }
            }
          } catch {
            if (mounted) {
              setWeatherError('定位失败，请在网站配置中设置城市')
            }
          }
        }
      } catch {
        if (mounted) setWeatherError('天气获取失败')
      }
      if (mounted) setWeatherLoading(false)
    }
    loadWeather()

    // 监听城市变更事件
    const handleCityChange = () => loadWeather()
    window.addEventListener('weatherCityChanged', handleCityChange)
    return () => {
      mounted = false
      window.removeEventListener('weatherCityChanged', handleCityChange)
    }
  }, [])

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekDay = weekDays[date.getDay()]
    return `${year}年${month}月${day}日 ${weekDay}`
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getGreeting = () => {
    const hour = time.getHours()
    if (hour < 6) return '夜深了，注意休息'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了，注意休息'
  }

  const weatherType = weather?.type || 'sunny'

  // 根据天气类型设置卡片背景色调
  const weatherBgClass = useMemo(() => {
    switch (weatherType) {
      case 'rain': return styles.weatherRain
      case 'snow': return styles.weatherSnow
      case 'overcast': return styles.weatherOvercast
      case 'fog': return styles.weatherFog
      case 'cloudy': return styles.weatherCloudy
      case 'sunny': return styles.weatherSunny
      default: return ''
    }
  }, [weatherType])

  return (
    <div className={`${styles.widget} ${weatherBgClass}`}>
      {/* 拟物化天气动画层 */}
      <WeatherEffect type={weatherType} />

      {/* 内容层 */}
      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.greeting}>{getGreeting()}</span>
          <div className={styles.date}>
            <Calendar size={13} />
            <span>{formatDate(time)}</span>
          </div>
        </div>

        <div className={styles.right}>
          {/* 天气信息 */}
          {weather && (
            <div className={styles.weatherInfo}>
              <span className={styles.weatherEmoji}>{weather.emoji}</span>
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

          <div className={styles.time}>
            <Clock size={14} />
            <span>{formatTime(time)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

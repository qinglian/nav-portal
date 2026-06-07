import { useState, useEffect, useRef, useMemo } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { fetchWeather, getSavedCity, getLocation, getLocationId, saveCity } from '../utils/weather'
import styles from './TimeWidget.module.css'

// 拟物化天气动画组件
function WeatherEffect({ type }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    let particles = []
    let sunRays = []
    let clouds = []
    let lightningTimer = 0
    let lightningFlash = 0

    const w = canvas.parentElement.getBoundingClientRect().width
    const h = canvas.parentElement.getBoundingClientRect().height

    // 初始化粒子
    const init = () => {
      particles = []
      sunRays = []
      clouds = []

      if (type === 'rain') {
        for (let i = 0; i < 100; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 8 + Math.random() * 10,
            length: 15 + Math.random() * 20,
            width: 0.8 + Math.random() * 1.2,
            opacity: 0.3 + Math.random() * 0.4,
            wind: -2 + Math.random() * 1,
          })
        }
      } else if (type === 'snow') {
        for (let i = 0; i < 50; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 0.8 + Math.random() * 2,
            radius: 1.5 + Math.random() * 3,
            opacity: 0.5 + Math.random() * 0.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.015 + Math.random() * 0.025,
          })
        }
      } else if (type === 'sunny') {
        // 太阳光线
        for (let i = 0; i < 12; i++) {
          sunRays.push({
            angle: (Math.PI * 2 / 12) * i,
            length: 60 + Math.random() * 40,
            width: 2 + Math.random() * 2,
            opacity: 0.08 + Math.random() * 0.12,
            speed: 0.002 + Math.random() * 0.003,
          })
        }
        // 漂浮光点
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            radius: 1 + Math.random() * 3,
            opacity: 0.15 + Math.random() * 0.25,
            speedY: -0.3 - Math.random() * 0.5,
            speedX: -0.2 + Math.random() * 0.4,
          })
        }
      } else if (type === 'cloudy' || type === 'overcast') {
        for (let i = 0; i < 5; i++) {
          clouds.push({
            x: Math.random() * w,
            y: 20 + Math.random() * (h * 0.4),
            width: 80 + Math.random() * 120,
            height: 30 + Math.random() * 20,
            speed: 0.2 + Math.random() * 0.3,
            opacity: 0.08 + Math.random() * 0.12,
          })
        }
      } else if (type === 'fog') {
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            width: 100 + Math.random() * 150,
            height: 40 + Math.random() * 30,
            speed: 0.2 + Math.random() * 0.4,
            opacity: 0.06 + Math.random() * 0.08,
          })
        }
      }
    }

    init()

    let frame = 0
    const draw = () => {
      const displayW = canvas.parentElement.getBoundingClientRect().width
      const displayH = canvas.parentElement.getBoundingClientRect().height
      ctx.clearRect(0, 0, displayW, displayH)

      if (type === 'rain') {
        // 雨滴
        particles.forEach(p => {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.wind, p.y + p.length)
          ctx.strokeStyle = `rgba(180, 200, 230, ${p.opacity})`
          ctx.lineWidth = p.width
          ctx.lineCap = 'round'
          ctx.stroke()

          p.x += p.wind
          p.y += p.speed

          // 落地溅起
          if (p.y > displayH - 5) {
            ctx.beginPath()
            ctx.arc(p.x, displayH - 2, 2, 0, Math.PI, true)
            ctx.strokeStyle = `rgba(180, 200, 230, ${p.opacity * 0.5})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }

          if (p.y > displayH + 10) {
            p.x = Math.random() * displayW
            p.y = -p.length
          }
        })

        // 雷电效果（雷阵雨时）
        lightningTimer++
        if (lightningTimer > 200 + Math.random() * 300) {
          lightningFlash = 8
          lightningTimer = 0
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash * 0.03})`
          ctx.fillRect(0, 0, displayW, displayH)
          lightningFlash--
        }

      } else if (type === 'snow') {
        particles.forEach(p => {
          p.wobble += p.wobbleSpeed
          const x = p.x + Math.sin(p.wobble) * 2

          // 雪花六边形
          ctx.save()
          ctx.translate(x, p.y)
          ctx.rotate(p.wobble * 0.5)
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i
            ctx.lineTo(Math.cos(angle) * p.radius, Math.sin(angle) * p.radius)
          }
          ctx.closePath()
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
          ctx.fill()
          ctx.restore()

          p.y += p.speed
          if (p.y > displayH + 10) {
            p.x = Math.random() * displayW
            p.y = -10
          }
        })

      } else if (type === 'sunny') {
        // 太阳光晕
        const sunX = displayW * 0.85
        const sunY = displayH * 0.25

        // 外层光晕
        const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80)
        outerGlow.addColorStop(0, 'rgba(255, 220, 100, 0.15)')
        outerGlow.addColorStop(0.5, 'rgba(255, 200, 80, 0.08)')
        outerGlow.addColorStop(1, 'rgba(255, 180, 60, 0)')
        ctx.fillStyle = outerGlow
        ctx.fillRect(0, 0, displayW, displayH)

        // 太阳本体
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30)
        sunGlow.addColorStop(0, 'rgba(255, 230, 150, 0.6)')
        sunGlow.addColorStop(0.4, 'rgba(255, 210, 100, 0.3)')
        sunGlow.addColorStop(1, 'rgba(255, 200, 80, 0)')
        ctx.fillStyle = sunGlow
        ctx.beginPath()
        ctx.arc(sunX, sunY, 30, 0, Math.PI * 2)
        ctx.fill()

        // 光线旋转
        sunRays.forEach(ray => {
          ray.angle += ray.speed
          const startX = sunX + Math.cos(ray.angle) * 35
          const startY = sunY + Math.sin(ray.angle) * 35
          const endX = sunX + Math.cos(ray.angle) * ray.length
          const endY = sunY + Math.sin(ray.angle) * ray.length

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.strokeStyle = `rgba(255, 220, 120, ${ray.opacity})`
          ctx.lineWidth = ray.width
          ctx.lineCap = 'round'
          ctx.stroke()
        })

        // 漂浮光点
        particles.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 230, 150, ${p.opacity})`
          ctx.fill()

          p.y += p.speedY
          p.x += p.speedX

          if (p.y < -10) {
            p.y = displayH + 10
            p.x = Math.random() * displayW
          }
          if (p.x < -10) p.x = displayW + 10
          if (p.x > displayW + 10) p.x = -10
        })

      } else if (type === 'cloudy' || type === 'overcast') {
        clouds.forEach(cloud => {
          // 绘制云朵
          ctx.beginPath()
          const cx = cloud.x
          const cy = cloud.y
          const cw = cloud.width
          const ch = cloud.height

          ctx.ellipse(cx, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2)
          ctx.ellipse(cx - cw * 0.25, cy + ch * 0.1, cw * 0.35, ch * 0.45, 0, 0, Math.PI * 2)
          ctx.ellipse(cx + cw * 0.25, cy + ch * 0.1, cw * 0.35, ch * 0.45, 0, 0, Math.PI * 2)
          ctx.ellipse(cx, cy - ch * 0.15, cw * 0.3, ch * 0.35, 0, 0, Math.PI * 2)

          ctx.fillStyle = `rgba(220, 225, 235, ${cloud.opacity})`
          ctx.fill()

          cloud.x += cloud.speed
          if (cloud.x > displayW + cw) {
            cloud.x = -cw
          }
        })

      } else if (type === 'fog') {
        particles.forEach(p => {
          const gradient = ctx.createRadialGradient(
            p.x + p.width / 2, p.y, 0,
            p.x + p.width / 2, p.y, p.width / 2
          )
          gradient.addColorStop(0, `rgba(200, 205, 210, ${p.opacity})`)
          gradient.addColorStop(1, 'rgba(200, 205, 210, 0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.ellipse(p.x + p.width / 2, p.y, p.width / 2, p.height / 2, 0, 0, Math.PI * 2)
          ctx.fill()

          p.x += p.speed
          if (p.x > displayW + p.width) {
            p.x = -p.width
          }
        })
      }

      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [type])

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

  // 根据天气类型设置卡片背景
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

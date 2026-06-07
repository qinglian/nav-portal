import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { fetchWeather, getSavedCity, getLocation, reverseGeocode, saveCity, getWeatherEnabled, saveWeatherEnabled } from '../utils/weather'
import styles from './TimeWidget.module.css'

// ==================== 拟物化天气动画 ====================
function WeatherEffect({ type }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !type) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const getSize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      return { w: rect.width, h: rect.height }
    }

    let { w, h } = getSize()
    let drops = [], flakes = [], sunAngle = 0, fogParts = [], cloudParts = []
    let time = 0

    // ---- 初始化 ----
    if (type === 'rain') {
      for (let i = 0; i < 120; i++) {
        drops.push(makeDrop(w, h, true))
      }
    } else if (type === 'snow') {
      for (let i = 0; i < 60; i++) {
        flakes.push(makeFlake(w, h, true))
      }
    } else if (type === 'sunny') {
      for (let i = 0; i < 25; i++) {
        fogParts.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 1 + Math.random() * 2.5,
          o: 0.1 + Math.random() * 0.2,
          vy: -(0.15 + Math.random() * 0.35),
          vx: (Math.random() - 0.5) * 0.3,
        })
      }
    } else if (type === 'cloudy' || type === 'overcast') {
      for (let i = 0; i < 4; i++) {
        cloudParts.push({
          x: Math.random() * w * 1.5 - w * 0.25,
          y: h * 0.1 + Math.random() * h * 0.35,
          rx: 50 + Math.random() * 70,
          ry: 18 + Math.random() * 14,
          speed: 0.15 + Math.random() * 0.25,
          o: type === 'overcast' ? 0.12 + Math.random() * 0.1 : 0.06 + Math.random() * 0.06,
        })
      }
    } else if (type === 'fog') {
      for (let i = 0; i < 10; i++) {
        fogParts.push({
          x: Math.random() * w * 1.5 - w * 0.25,
          y: Math.random() * h,
          rx: 60 + Math.random() * 100,
          ry: 25 + Math.random() * 20,
          speed: 0.15 + Math.random() * 0.3,
          o: 0.05 + Math.random() * 0.06,
        })
      }
    }

    function makeDrop(w, h, init) {
      return {
        x: Math.random() * (w + 40) - 20,
        y: init ? Math.random() * h : -Math.random() * 30,
        speed: 10 + Math.random() * 8,
        len: 18 + Math.random() * 16,
        o: 0.25 + Math.random() * 0.35,
        wind: -1.5 - Math.random(),
      }
    }

    function makeFlake(w, h, init) {
      return {
        x: Math.random() * w,
        y: init ? Math.random() * h : -Math.random() * 20,
        speed: 0.6 + Math.random() * 1.8,
        r: 1.5 + Math.random() * 3.5,
        o: 0.5 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2,
        ws: 0.01 + Math.random() * 0.02,
        rot: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 0.02,
      }
    }

    // ---- 绘制 ----
    const draw = () => {
      const { w: cw, h: ch } = getSize()
      if (cw !== w || ch !== h) { w = cw; h = ch }
      ctx.clearRect(0, 0, w, h)
      time += 0.016

      if (type === 'rain') {
        // 雨滴 - 细长倾斜线条
        drops.forEach(d => {
          ctx.beginPath()
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x + d.wind * 1.5, d.y + d.len)
          ctx.strokeStyle = `rgba(160, 190, 220, ${d.o})`
          ctx.lineWidth = 1
          ctx.stroke()

          // 溅落水花
          if (d.y + d.len > h) {
            for (let i = 0; i < 3; i++) {
              const sx = d.x + d.wind * 1.5 + (Math.random() - 0.5) * 6
              const sy = h - 1
              const sr = 1 + Math.random() * 1.5
              ctx.beginPath()
              ctx.arc(sx, sy, sr, Math.PI, 0)
              ctx.strokeStyle = `rgba(160, 190, 220, ${d.o * 0.4})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }

          d.x += d.wind
          d.y += d.speed
          if (d.y > h + 20) Object.assign(d, makeDrop(w, h, false))
        })

        // 底部水面反光
        const waterGrad = ctx.createLinearGradient(0, h - 8, 0, h)
        waterGrad.addColorStop(0, 'rgba(100, 140, 180, 0)')
        waterGrad.addColorStop(1, 'rgba(100, 140, 180, 0.06)')
        ctx.fillStyle = waterGrad
        ctx.fillRect(0, h - 8, w, 8)

      } else if (type === 'snow') {
        flakes.forEach(f => {
          f.wobble += f.ws
          f.rot += f.rs
          const x = f.x + Math.sin(f.wobble) * 2.5

          // 绘制精致雪花
          ctx.save()
          ctx.translate(x, f.y)
          ctx.rotate(f.rot)
          ctx.globalAlpha = f.o

          if (f.r > 2.5) {
            // 大雪花 - 六角形
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i
              ctx.beginPath()
              ctx.moveTo(0, 0)
              ctx.lineTo(Math.cos(a) * f.r, Math.sin(a) * f.r)
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
              ctx.lineWidth = 0.8
              ctx.stroke()
              // 小分支
              const bx = Math.cos(a) * f.r * 0.6
              const by = Math.sin(a) * f.r * 0.6
              ctx.beginPath()
              ctx.moveTo(bx, by)
              ctx.lineTo(bx + Math.cos(a + 0.5) * f.r * 0.3, by + Math.sin(a + 0.5) * f.r * 0.3)
              ctx.stroke()
            }
          } else {
            // 小雪花 - 圆点
            ctx.beginPath()
            ctx.arc(0, 0, f.r, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.fill()
          }

          ctx.globalAlpha = 1
          ctx.restore()

          f.y += f.speed
          if (f.y > h + 15) Object.assign(f, makeFlake(w, h, false))
        })

        // 底部积雪
        const snowGrad = ctx.createLinearGradient(0, h - 6, 0, h)
        snowGrad.addColorStop(0, 'rgba(220, 230, 240, 0)')
        snowGrad.addColorStop(1, 'rgba(220, 230, 240, 0.08)')
        ctx.fillStyle = snowGrad
        ctx.fillRect(0, h - 6, w, 6)

      } else if (type === 'sunny') {
        const sx = w * 0.88
        const sy = h * 0.2

        // 大范围光晕
        const g1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.6)
        g1.addColorStop(0, 'rgba(255, 210, 80, 0.1)')
        g1.addColorStop(0.3, 'rgba(255, 200, 60, 0.04)')
        g1.addColorStop(1, 'rgba(255, 180, 40, 0)')
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, w, h)

        // 太阳本体
        const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22)
        g2.addColorStop(0, 'rgba(255, 240, 180, 0.7)')
        g2.addColorStop(0.5, 'rgba(255, 220, 120, 0.35)')
        g2.addColorStop(1, 'rgba(255, 200, 80, 0)')
        ctx.fillStyle = g2
        ctx.beginPath()
        ctx.arc(sx, sy, 22, 0, Math.PI * 2)
        ctx.fill()

        // 旋转光芒
        sunAngle += 0.003
        for (let i = 0; i < 8; i++) {
          const a = sunAngle + (Math.PI * 2 / 8) * i
          const inner = 24
          const outer = 45 + Math.sin(time * 2 + i) * 10
          ctx.beginPath()
          ctx.moveTo(sx + Math.cos(a) * inner, sy + Math.sin(a) * inner)
          ctx.lineTo(sx + Math.cos(a) * outer, sy + Math.sin(a) * outer)
          ctx.strokeStyle = `rgba(255, 220, 120, ${0.06 + Math.sin(time * 2 + i) * 0.03})`
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        // 漂浮光尘
        fogParts.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 230, 150, ${p.o * (0.5 + 0.5 * Math.sin(time + p.x))})`
          ctx.fill()
          p.y += p.vy
          p.x += p.vx
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        })

      } else if (type === 'cloudy' || type === 'overcast') {
        cloudParts.forEach(c => {
          ctx.save()
          ctx.globalAlpha = c.o
          // 柔和云朵 - 多个椭圆叠加
          ctx.fillStyle = type === 'overcast' ? 'rgba(140, 150, 165, 1)' : 'rgba(210, 218, 230, 1)'
          ctx.beginPath()
          ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.ellipse(c.x - c.rx * 0.3, c.y + c.ry * 0.15, c.rx * 0.6, c.ry * 0.8, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.ellipse(c.x + c.rx * 0.3, c.y + c.ry * 0.1, c.rx * 0.55, c.ry * 0.75, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.ellipse(c.x + c.rx * 0.1, c.y - c.ry * 0.3, c.rx * 0.45, c.ry * 0.6, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.restore()
          c.x += c.speed
          if (c.x - c.rx > w) c.x = -c.rx * 2
        })

      } else if (type === 'fog') {
        fogParts.forEach(p => {
          ctx.save()
          ctx.globalAlpha = p.o * (0.7 + 0.3 * Math.sin(time * 0.5 + p.x * 0.01))
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx)
          g.addColorStop(0, 'rgba(190, 195, 200, 1)')
          g.addColorStop(1, 'rgba(190, 195, 200, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.restore()
          p.x += p.speed
          if (p.x - p.rx > w) p.x = -p.rx * 2
        })
      }

      animRef.current = requestAnimationFrame(draw)
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    draw()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [type])

  return <canvas ref={canvasRef} className={styles.weatherCanvas} />
}

// ==================== 主组件 ====================
export default function TimeWidget() {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [cityName, setCityName] = useState('')
  const [weatherEnabled, setWeatherEnabled] = useState(() => getWeatherEnabled())

  // 时间更新
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 天气获取
  const loadWeather = useCallback(async () => {
    if (!weatherEnabled) return
    setWeatherLoading(true)
    setWeatherError('')
    try {
      const saved = getSavedCity()
      if (saved) {
        setCityName(saved.name)
        const w = await fetchWeather(saved.lat, saved.lon)
        if (w) setWeather(w)
        else setWeatherError('天气获取失败')
      } else {
        try {
          const loc = await getLocation()
          const geo = await reverseGeocode(loc.lat, loc.lon)
          if (geo) {
            setCityName(geo.name)
            saveCity({ lat: loc.lat, lon: loc.lon, name: geo.name })
          }
          const w = await fetchWeather(loc.lat, loc.lon)
          if (w) setWeather(w)
          else setWeatherError('天气获取失败')
        } catch {
          setWeatherError('定位失败，请在网站配置中设置城市')
        }
      }
    } catch {
      setWeatherError('天气获取失败')
    }
    setWeatherLoading(false)
  }, [weatherEnabled])

  useEffect(() => { loadWeather() }, [loadWeather])

  // 监听城市变更
  useEffect(() => {
    const handler = () => loadWeather()
    window.addEventListener('weatherCityChanged', handler)
    return () => window.removeEventListener('weatherCityChanged', handler)
  }, [loadWeather])

  const formatDate = (date) => {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
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
    if (!weatherEnabled) return ''
    switch (weatherType) {
      case 'rain': return styles.weatherRain
      case 'snow': return styles.weatherSnow
      case 'overcast': return styles.weatherOvercast
      case 'fog': return styles.weatherFog
      case 'cloudy': return styles.weatherCloudy
      case 'sunny': return styles.weatherSunny
      default: return ''
    }
  }, [weatherType, weatherEnabled])

  return (
    <div className={`${styles.widget} ${weatherBgClass}`}>
      {weatherEnabled && <WeatherEffect type={weatherType} />}

      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.greeting}>{getGreeting()}</span>
          <div className={styles.date}>
            <Calendar size={13} />
            <span>{formatDate(time)}</span>
          </div>
        </div>

        <div className={styles.right}>
          {weatherEnabled && weather && (
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

          {weatherEnabled && weatherLoading && (
            <div className={styles.weatherLoading}>天气加载中...</div>
          )}

          {weatherEnabled && weatherError && !weather && (
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

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import { fetchWeather, getSavedCity, getLocation, reverseGeocode, saveCity, getWeatherEnabled } from '../utils/weather'
import styles from './TimeWidget.module.css'

// ==================== 翻页数字组件 ====================
function FlipDigit({ value, label }) {
  const [prevValue, setPrevValue] = useState(value)
  const [isFlipping, setIsFlipping] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value !== prevRef.current) {
      setPrevValue(prevRef.current)
      setIsFlipping(true)
      prevRef.current = value
      const timer = setTimeout(() => setIsFlipping(false), 600)
      return () => clearTimeout(timer)
    }
  }, [value])

  const displayValue = String(value).padStart(2, '0')
  const displayPrev = String(prevValue).padStart(2, '0')

  return (
    <div className={styles.flipUnit}>
      <div className={styles.flipCard}>
        {/* 上半部分 - 当前值 */}
        <div className={`${styles.flipTop} ${isFlipping ? styles.flipTopAnimate : ''}`}>
          <span>{displayValue}</span>
        </div>
        {/* 上半部分 - 旧值（翻转时显示） */}
        <div className={`${styles.flipTopBack} ${isFlipping ? styles.flipTopBackAnimate : ''}`}>
          <span>{displayPrev}</span>
        </div>
        {/* 下半部分 - 当前值 */}
        <div className={`${styles.flipBottom} ${isFlipping ? styles.flipBottomAnimate : ''}`}>
          <span>{displayValue}</span>
        </div>
        {/* 下半部分 - 旧值（翻转时显示） */}
        <div className={`${styles.flipBottomBack} ${isFlipping ? styles.flipBottomBackAnimate : ''}`}>
          <span>{displayPrev}</span>
        </div>
      </div>
      {label && <span className={styles.flipLabel}>{label}</span>}
    </div>
  )
}

// ==================== 翻页时钟 ====================
function FlipClock({ date }) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  return (
    <div className={styles.flipClock}>
      <FlipDigit value={hours} />
      <span className={styles.flipSeparator}>:</span>
      <FlipDigit value={minutes} />
      <span className={styles.flipSeparator}>:</span>
      <FlipDigit value={seconds} />
    </div>
  )
}

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

    if (type === 'rain') {
      for (let i = 0; i < 150; i++) drops.push(makeDrop(w, h, true))
    } else if (type === 'snow') {
      for (let i = 0; i < 70; i++) flakes.push(makeFlake(w, h, true))
    } else if (type === 'sunny') {
      for (let i = 0; i < 30; i++) {
        fogParts.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.8 + Math.random() * 2,
          o: 0.08 + Math.random() * 0.15,
          vy: -(0.1 + Math.random() * 0.25),
          vx: (Math.random() - 0.5) * 0.2,
          phase: Math.random() * Math.PI * 2,
        })
      }
    } else if (type === 'cloudy' || type === 'overcast') {
      for (let i = 0; i < 5; i++) {
        cloudParts.push({
          x: Math.random() * w * 1.5 - w * 0.25,
          y: h * 0.05 + Math.random() * h * 0.4,
          rx: 45 + Math.random() * 80,
          ry: 15 + Math.random() * 12,
          speed: 0.1 + Math.random() * 0.2,
          o: type === 'overcast' ? 0.1 + Math.random() * 0.08 : 0.04 + Math.random() * 0.04,
        })
      }
    } else if (type === 'fog') {
      for (let i = 0; i < 12; i++) {
        fogParts.push({
          x: Math.random() * w * 1.5 - w * 0.25,
          y: Math.random() * h,
          rx: 50 + Math.random() * 120,
          ry: 20 + Math.random() * 25,
          speed: 0.1 + Math.random() * 0.25,
          o: 0.04 + Math.random() * 0.05,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    function makeDrop(w, h, init) {
      const layer = Math.random()
      return {
        x: Math.random() * (w + 60) - 30,
        y: init ? Math.random() * h : -Math.random() * 40,
        speed: 6 + layer * 12,
        len: 10 + layer * 20,
        width: 0.5 + layer * 1,
        o: 0.15 + layer * 0.3,
        wind: -0.8 - layer * 1.5,
      }
    }

    function makeFlake(w, h, init) {
      return {
        x: Math.random() * w,
        y: init ? Math.random() * h : -Math.random() * 25,
        speed: 0.4 + Math.random() * 1.5,
        r: 1 + Math.random() * 4,
        o: 0.4 + Math.random() * 0.6,
        wobble: Math.random() * Math.PI * 2,
        ws: 0.008 + Math.random() * 0.015,
        rot: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 0.015,
      }
    }

    const draw = () => {
      const { w: cw, h: ch } = getSize()
      if (cw !== w || ch !== h) { w = cw; h = ch }
      ctx.clearRect(0, 0, w, h)
      time += 0.016

      if (type === 'rain') {
        drops.forEach(d => {
          const alpha = d.o * (0.6 + 0.4 * Math.sin(time * 3 + d.x * 0.1))
          ctx.beginPath()
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x + d.wind * 2, d.y + d.len)
          ctx.strokeStyle = `rgba(170, 195, 225, ${alpha})`
          ctx.lineWidth = d.width
          ctx.lineCap = 'round'
          ctx.stroke()

          if (d.y + d.len >= h - 2) {
            const splashCount = d.len > 15 ? 4 : 2
            for (let i = 0; i < splashCount; i++) {
              const angle = -Math.PI * (0.15 + Math.random() * 0.7)
              const dist = 2 + Math.random() * 4
              const sx = d.x + d.wind * 2
              const sy = h - 2
              ctx.beginPath()
              ctx.moveTo(sx, sy)
              ctx.lineTo(sx + Math.cos(angle) * dist, sy + Math.sin(angle) * dist)
              ctx.strokeStyle = `rgba(170, 195, 225, ${alpha * 0.5})`
              ctx.lineWidth = 0.4
              ctx.stroke()
            }
          }

          d.x += d.wind
          d.y += d.speed
          if (d.y > h + 30) Object.assign(d, makeDrop(w, h, false))
        })

        const wg = ctx.createLinearGradient(0, h - 12, 0, h)
        wg.addColorStop(0, 'rgba(100, 130, 170, 0)')
        wg.addColorStop(0.5, 'rgba(100, 130, 170, 0.03)')
        wg.addColorStop(1, 'rgba(100, 130, 170, 0.06)')
        ctx.fillStyle = wg
        ctx.fillRect(0, h - 12, w, 12)

      } else if (type === 'snow') {
        flakes.forEach(f => {
          f.wobble += f.ws
          f.rot += f.rs
          const x = f.x + Math.sin(f.wobble) * 3

          ctx.save()
          ctx.translate(x, f.y)
          ctx.rotate(f.rot)
          ctx.globalAlpha = f.o

          if (f.r > 2.5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
            ctx.lineWidth = 0.6
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i
              const ex = Math.cos(a) * f.r
              const ey = Math.sin(a) * f.r
              ctx.beginPath()
              ctx.moveTo(0, 0)
              ctx.lineTo(ex, ey)
              ctx.stroke()
              for (let j = 1; j <= 2; j++) {
                const t = j * 0.35
                const bx = ex * t
                const by = ey * t
                const bl = f.r * (0.25 - j * 0.05)
                ctx.beginPath()
                ctx.moveTo(bx, by)
                ctx.lineTo(bx + Math.cos(a + 0.6) * bl, by + Math.sin(a + 0.6) * bl)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(bx, by)
                ctx.lineTo(bx + Math.cos(a - 0.6) * bl, by + Math.sin(a - 0.6) * bl)
                ctx.stroke()
              }
            }
            ctx.beginPath()
            ctx.arc(0, 0, 0.8, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(0, 0, f.r, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.fill()
          }

          ctx.globalAlpha = 1
          ctx.restore()
          f.y += f.speed
          if (f.y > h + 20) Object.assign(f, makeFlake(w, h, false))
        })

        const sg = ctx.createLinearGradient(0, h - 10, 0, h)
        sg.addColorStop(0, 'rgba(230, 235, 245, 0)')
        sg.addColorStop(1, 'rgba(230, 235, 245, 0.06)')
        ctx.fillStyle = sg
        ctx.fillRect(0, h - 10, w, 10)

      } else if (type === 'sunny') {
        const sx = w * 0.9
        const sy = h * 0.15

        const g1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.7)
        g1.addColorStop(0, 'rgba(255, 215, 80, 0.08)')
        g1.addColorStop(0.2, 'rgba(255, 200, 60, 0.04)')
        g1.addColorStop(1, 'rgba(255, 180, 40, 0)')
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, w, h)

        const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18)
        g2.addColorStop(0, 'rgba(255, 245, 200, 0.8)')
        g2.addColorStop(0.4, 'rgba(255, 225, 130, 0.4)')
        g2.addColorStop(1, 'rgba(255, 210, 90, 0)')
        ctx.fillStyle = g2
        ctx.beginPath()
        ctx.arc(sx, sy, 18, 0, Math.PI * 2)
        ctx.fill()

        sunAngle += 0.002
        for (let i = 0; i < 12; i++) {
          const a = sunAngle + (Math.PI * 2 / 12) * i
          const pulse = Math.sin(time * 1.5 + i * 0.5) * 0.5 + 0.5
          const inner = 20
          const outer = 35 + pulse * 15
          ctx.beginPath()
          ctx.moveTo(sx + Math.cos(a) * inner, sy + Math.sin(a) * inner)
          ctx.lineTo(sx + Math.cos(a) * outer, sy + Math.sin(a) * outer)
          ctx.strokeStyle = `rgba(255, 225, 130, ${0.03 + pulse * 0.04})`
          ctx.lineWidth = 1.5 + pulse
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        fogParts.forEach(p => {
          const flicker = 0.4 + 0.6 * Math.sin(time * 1.2 + p.phase)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 235, 160, ${p.o * flicker})`
          ctx.fill()
          p.y += p.vy
          p.x += p.vx + Math.sin(time + p.phase) * 0.05
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        })

      } else if (type === 'cloudy' || type === 'overcast') {
        cloudParts.forEach(c => {
          ctx.save()
          ctx.globalAlpha = c.o
          const color = type === 'overcast' ? 'rgba(130, 140, 155, 1)' : 'rgba(215, 222, 232, 1)'
          ctx.fillStyle = color
          const drawBlob = (ox, oy, rx, ry) => {
            ctx.beginPath()
            ctx.ellipse(c.x + ox, c.y + oy, rx, ry, 0, 0, Math.PI * 2)
            ctx.fill()
          }
          drawBlob(0, 0, c.rx, c.ry)
          drawBlob(-c.rx * 0.35, c.ry * 0.1, c.rx * 0.55, c.ry * 0.75)
          drawBlob(c.rx * 0.3, c.ry * 0.05, c.rx * 0.5, c.ry * 0.7)
          drawBlob(c.rx * 0.05, -c.ry * 0.35, c.rx * 0.4, c.ry * 0.55)
          drawBlob(-c.rx * 0.15, -c.ry * 0.2, c.rx * 0.35, c.ry * 0.5)
          ctx.globalAlpha = 1
          ctx.restore()
          c.x += c.speed
          if (c.x - c.rx * 1.5 > w) c.x = -c.rx * 2
        })

      } else if (type === 'fog') {
        fogParts.forEach(p => {
          const breathe = 0.6 + 0.4 * Math.sin(time * 0.3 + p.phase)
          ctx.save()
          ctx.globalAlpha = p.o * breathe
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx)
          g.addColorStop(0, 'rgba(195, 200, 210, 1)')
          g.addColorStop(0.6, 'rgba(195, 200, 210, 0.3)')
          g.addColorStop(1, 'rgba(195, 200, 210, 0)')
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

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 监听天气开关变化（从 Header 同步）
  useEffect(() => {
    const handler = () => {
      setWeatherEnabled(getWeatherEnabled())
    }
    window.addEventListener('weatherToggleChanged', handler)
    return () => window.removeEventListener('weatherToggleChanged', handler)
  }, [])

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

  useEffect(() => {
    if (weatherEnabled) {
      loadWeather()
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
      {weatherEnabled && <WeatherEffect type={weatherType} />}

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
          <FlipClock date={time} />
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

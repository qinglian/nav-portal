import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, ArrowRight, Moon, Sun, Compass } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import styles from './StartPage.module.css'

const DEFAULT_ENGINES = [
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=', color: '#008373', suggestApi: 'https://api.bing.com/qsonhs.aspx?q=' },
  { id: 'google', name: '谷歌', url: 'https://www.google.com/search?q=', color: '#4285f4', suggestApi: '' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', color: '#2932e1', suggestApi: 'https://suggestion.baidu.com/su?wd=' },
  { id: 'metaso', name: '秘塔AI', url: 'https://metaso.cn/?q=', color: '#00b4d8', suggestApi: '' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#de5833', suggestApi: 'https://duckduckgo.com/ac/?q=' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=', color: '#fb5100', suggestApi: '' },
]

// 热门搜索建议（当API不可用时使用）
const TRENDING_SUGGESTS = [
  'AI工具推荐', '今日热点新闻', '天气预报', '技术文档',
  '在线翻译', '音乐排行榜', '电影推荐', '编程教程',
  '健康饮食', '旅行攻略', '股票行情', '电子书推荐'
]

export default function StartPage({ onGoToNav }) {
  const { theme, toggleTheme } = useTheme()
  const [engines, setEngines] = useState(() => {
    const saved = localStorage.getItem('nav-search-engines')
    return saved ? JSON.parse(saved) : DEFAULT_ENGINES
  })
  const [currentEngine, setCurrentEngine] = useState(() => {
    return localStorage.getItem('nav-current-engine') || 'bing'
  })
  const [searchInput, setSearchInput] = useState('')
  const [showEnginePicker, setShowEnginePicker] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [greeting, setGreeting] = useState('')
  const inputRef = useRef(null)
  const suggestTimer = useRef(null)
  const pickerRef = useRef(null)

  // 问候语
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 9) setGreeting('早上好')
    else if (hour < 12) setGreeting('上午好')
    else if (hour < 14) setGreeting('中午好')
    else if (hour < 18) setGreeting('下午好')
    else if (hour < 22) setGreeting('晚上好')
    else setGreeting('夜深了')
  }, [])

  // 时间
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEnginePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // 搜索建议（吸附功能）
  const fetchSuggestions = useMemo(() => (query) => {
    if (!query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const engine = engines.find(en => en.id === currentEngine)
    if (!engine || !engine.suggestApi) {
      // 没有API时使用本地过滤
      const filtered = TRENDING_SUGGESTS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.length > 0 ? filtered : [query])
      setShowSuggestions(true)
      return
    }

    clearTimeout(suggestTimer.current)
    suggestTimer.current = setTimeout(() => {
      // 使用JSONP获取百度建议
      if (currentEngine === 'baidu') {
        const callbackName = 'bdSuggest_' + Date.now()
        window[callbackName] = (data) => {
          const result = data.s ? data.s.slice(0, 8) : []
          setSuggestions(result.length > 0 ? result : [query])
          setShowSuggestions(true)
          delete window[callbackName]
        }
        const script = document.createElement('script')
        script.src = `${engine.suggestApi}${encodeURIComponent(query)}&cb=${callbackName}`
        script.onerror = () => {
          setSuggestions([query])
          setShowSuggestions(true)
          delete window[callbackName]
        }
        document.head.appendChild(script)
        setTimeout(() => script.remove(), 5000)
      } else {
        // 其他引擎用本地建议
        const filtered = TRENDING_SUGGESTS.filter(s =>
          s.toLowerCase().includes(query.toLowerCase())
        )
        setSuggestions(filtered.length > 0 ? filtered : [query])
        setShowSuggestions(true)
      }
    }, 200)
  }, [engines, currentEngine])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    setActiveSuggestion(-1)
    fetchSuggestions(value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        setSearchInput(suggestions[activeSuggestion])
        doSearch(suggestions[activeSuggestion])
      } else {
        doSearch(searchInput)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setShowEnginePicker(false)
    }
  }

  const doSearch = (query) => {
    if (!query || !query.trim()) return
    const engine = engines.find(en => en.id === currentEngine)
    if (engine) {
      window.open(engine.url + encodeURIComponent(query.trim()), '_blank')
    }
    setShowSuggestions(false)
  }

  const selectSuggestion = (suggestion) => {
    setSearchInput(suggestion)
    setShowSuggestions(false)
    doSearch(suggestion)
  }

  const selectEngine = (id) => {
    setCurrentEngine(id)
    localStorage.setItem('nav-current-engine', id)
    setShowEnginePicker(false)
    // 重新获取建议
    if (searchInput) fetchSuggestions(searchInput)
  }

  const activeEngine = engines.find(en => en.id === currentEngine) || engines[0]

  const formatDate = (date) => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    return {
      year: date.getFullYear(),
      month: months[date.getMonth()],
      day: date.getDate(),
      weekday: days[date.getDay()],
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    }
  }

  const dateInfo = formatDate(time)

  return (
    <div className={styles.startPage}>
      {/* 顶部工具栏 */}
      <div className={styles.topBar}>
        <button className={styles.navBtn} onClick={onGoToNav}>
          <Compass size={16} />
          <span>导航</span>
        </button>

        <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'dark' ? '切换亮色' : '切换暗色'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* 中间内容 */}
      <div className={styles.centerContent}>
        {/* 问候语 */}
        <div className={styles.greeting}>{greeting}</div>

        {/* 时间日期 */}
        <div className={styles.timeSection}>
          <div className={styles.time}>
            <span className={styles.timeHour}>{String(dateInfo.hour).padStart(2, '0')}</span>
            <span className={styles.timeColon}>:</span>
            <span className={styles.timeMinute}>{String(dateInfo.minute).padStart(2, '0')}</span>
            <span className={styles.timeSecond}>:{String(dateInfo.second).padStart(2, '0')}</span>
          </div>
          <div className={styles.dateInfo}>
            <span>{dateInfo.year}年 {dateInfo.day}日</span>
            <span className={styles.dateDivider}>·</span>
            <span>{dateInfo.weekday}</span>
          </div>
        </div>

        {/* 搜索框 - Mac玻璃风格 */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            {/* 搜索引擎选择器 */}
            <div className={styles.engineSelector} ref={pickerRef}>
              <button
                className={styles.engineBtn}
                onClick={() => setShowEnginePicker(!showEnginePicker)}
              >
                <span className={styles.engineDot} style={{ background: activeEngine?.color }} />
                <span className={styles.engineName}>{activeEngine?.name}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${showEnginePicker ? styles.chevronOpen : ''}`} />
              </button>

              {showEnginePicker && (
                <div className={styles.engineDropdown}>
                  {engines.map(engine => (
                    <button
                      key={engine.id}
                      className={`${styles.engineOption} ${engine.id === currentEngine ? styles.engineOptionActive : ''}`}
                      onClick={() => selectEngine(engine.id)}
                    >
                      <span className={styles.engineDot} style={{ background: engine.color }} />
                      <span>{engine.name}</span>
                      {engine.id === currentEngine && <span className={styles.engineCheck}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 搜索输入 */}
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                placeholder={`使用 ${activeEngine?.name || '搜索引擎'} 搜索...`}
                className={styles.searchInput}
                autoComplete="off"
              />
              {searchInput && (
                <button className={styles.clearBtn} onClick={() => { setSearchInput(''); setSuggestions([]); setShowSuggestions(false) }}>
                  ×
                </button>
              )}
            </div>

            {/* 搜索建议下拉 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`${styles.suggestionItem} ${index === activeSuggestion ? styles.suggestionActive : ''}`}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setActiveSuggestion(index)}
                  >
                    <Search size={14} className={styles.suggestionIcon} />
                    <span className={styles.suggestionText}>{suggestion}</span>
                    <ArrowRight size={12} className={styles.suggestionArrow} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 快捷提示 */}
        <div className={styles.hint}>
          输入关键词搜索 · 按 Enter 快速搜索 · 按 ↑↓ 选择建议
        </div>
      </div>
    </div>
  )
}

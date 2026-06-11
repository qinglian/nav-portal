import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, ArrowRight, Moon, Sun, Compass, Pencil, X, Plus } from 'lucide-react'
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

const TRENDING_SUGGESTS = [
  'AI工具推荐', '今日热点新闻', '天气预报', '技术文档',
  '在线翻译', '音乐排行榜', '电影推荐', '编程教程',
  '健康饮食', '旅行攻略', '股票行情', '电子书推荐'
]

const DEFAULT_SHORTCUTS = [
  { id: '1', name: 'GitHub', url: 'https://github.com', iconUrl: '' },
  { id: '2', name: 'B站', url: 'https://www.bilibili.com', iconUrl: '' },
  { id: '3', name: '知乎', url: 'https://www.zhihu.com', iconUrl: '' },
  { id: '4', name: 'YouTube', url: 'https://www.youtube.com', iconUrl: '' },
]

const SHORTCUTS_KEY = 'nav-startpage-shortcuts'

function getAutoFavicon(url) {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return null
  }
}

function getSavedShortcuts() {
  const saved = localStorage.getItem(SHORTCUTS_KEY)
  if (!saved) return [...DEFAULT_SHORTCUTS]
  try { return JSON.parse(saved) } catch { return [...DEFAULT_SHORTCUTS] }
}

function saveShortcuts(list) {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list))
}

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
  const [shortcuts, setShortcuts] = useState(() => getSavedShortcuts())
  const [isEditShortcuts, setIsEditShortcuts] = useState(false)
  const [showAddShortcut, setShowAddShortcut] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newShortcut, setNewShortcut] = useState({ name: '', url: '', iconUrl: '' })
  const [editShortcut, setEditShortcut] = useState({ name: '', url: '', iconUrl: '' })

  // 拖拽排序状态
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragItemIndex = useRef(null)
  const dragItemData = useRef(null)

  const inputRef = useRef(null)
  const suggestTimer = useRef(null)
  const pickerRef = useRef(null)

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

  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEnginePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchSuggestions = useMemo(() => (query) => {
    if (!query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const engine = engines.find(en => en.id === currentEngine)
    if (!engine || !engine.suggestApi) {
      const filtered = TRENDING_SUGGESTS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.length > 0 ? filtered : [query])
      setShowSuggestions(true)
      return
    }
    clearTimeout(suggestTimer.current)
    suggestTimer.current = setTimeout(() => {
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
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    }
  }

  const dateInfo = formatDate(time)

  // 快捷网页操作
  const handleAddShortcut = () => {
    if (!newShortcut.name.trim() || !newShortcut.url.trim()) return
    let url = newShortcut.url.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    const iconUrl = newShortcut.iconUrl.trim() || ''
    const list = [...shortcuts, { id: Date.now().toString(), name: newShortcut.name.trim(), url, iconUrl }]
    setShortcuts(list)
    saveShortcuts(list)
    setNewShortcut({ name: '', url: '', iconUrl: '' })
    setShowAddShortcut(false)
  }

  const handleRemoveShortcut = (id) => {
    const list = shortcuts.filter(s => s.id !== id)
    setShortcuts(list)
    saveShortcuts(list)
  }

  const startEdit = (site) => {
    setEditingId(site.id)
    setEditShortcut({ name: site.name, url: site.url, iconUrl: site.iconUrl || '' })
  }

  const saveEdit = () => {
    if (!editShortcut.name.trim() || !editShortcut.url.trim()) return
    let url = editShortcut.url.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    const list = shortcuts.map(s =>
      s.id === editingId
        ? { ...s, name: editShortcut.name.trim(), url, iconUrl: editShortcut.iconUrl.trim() || '' }
        : s
    )
    setShortcuts(list)
    saveShortcuts(list)
    setEditingId(null)
  }

  // ========== 拖拽排序 - 实时预览 ==========
  const handleDragStart = (e, index) => {
    if (!isEditShortcuts) return
    dragItemIndex.current = index
    dragItemData.current = shortcuts[index]
    e.dataTransfer.effectAllowed = 'move'
    // 设置拖拽时的透明图像（隐藏默认的）
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const handleDragOverItem = (e, index) => {
    if (!isEditShortcuts || dragItemIndex.current === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
      // 实时交换位置
      if (dragItemIndex.current !== index) {
        const newList = [...shortcuts]
        const [moved] = newList.splice(dragItemIndex.current, 1)
        newList.splice(index, 0, moved)
        setShortcuts(newList)
        dragItemIndex.current = index
      }
    }
  }

  const handleDragLeaveItem = (e) => {
    // 不需要处理，因为 dragOver 已经处理了实时交换
  }

  const handleDragEnd = (e) => {
    dragItemIndex.current = null
    dragItemData.current = null
    setDragOverIndex(null)
    // 保存最终状态
    saveShortcuts(shortcuts)
  }

  const getIconUrl = (site) => {
    if (site.iconUrl) return site.iconUrl
    return getAutoFavicon(site.url)
  }

  return (
    <div className={styles.startPage}>
      {/* 右上角工具栏 */}
      <div className={styles.topBar}>
        <button className={styles.topBtn} onClick={toggleTheme} title={theme === 'dark' ? '切换亮色' : '切换暗色'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button className={styles.topBtn} onClick={() => setIsEditShortcuts(!isEditShortcuts)} title="编辑快捷网页">
          <Pencil size={15} />
        </button>
        <button className={styles.navBtn} onClick={onGoToNav}>
          <Compass size={15} />
          <span>导航</span>
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
            <span>{dateInfo.month} {dateInfo.day}日, {dateInfo.year}</span>
            <span className={styles.dateDivider}>·</span>
            <span>{dateInfo.weekday}</span>
          </div>
        </div>

        {/* 搜索框 */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            <div className={styles.engineSelector} ref={pickerRef}>
              <button className={styles.engineBtn} onClick={() => setShowEnginePicker(!showEnginePicker)}>
                <span className={styles.engineDot} style={{ background: activeEngine?.color }} />
                <span className={styles.engineName}>{activeEngine?.name}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${showEnginePicker ? styles.chevronOpen : ''}`} />
              </button>
              {showEnginePicker && (
                <div className={styles.engineDropdown}>
                  {engines.map(engine => (
                    <button key={engine.id} className={`${styles.engineOption} ${engine.id === currentEngine ? styles.engineOptionActive : ''}`} onClick={() => selectEngine(engine.id)}>
                      <span className={styles.engineDot} style={{ background: engine.color }} />
                      <span>{engine.name}</span>
                      {engine.id === currentEngine && <span className={styles.engineCheck}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input ref={inputRef} type="text" value={searchInput} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }} placeholder={`使用 ${activeEngine?.name || '搜索引擎'} 搜索...`} className={styles.searchInput} autoComplete="off" />
              {searchInput && (
                <button className={styles.clearBtn} onClick={() => { setSearchInput(''); setSuggestions([]); setShowSuggestions(false) }}>×</button>
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((suggestion, index) => (
                  <div key={index} className={`${styles.suggestionItem} ${index === activeSuggestion ? styles.suggestionActive : ''}`} onClick={() => selectSuggestion(suggestion)} onMouseEnter={() => setActiveSuggestion(index)}>
                    <Search size={14} className={styles.suggestionIcon} />
                    <span className={styles.suggestionText}>{suggestion}</span>
                    <ArrowRight size={12} className={styles.suggestionArrow} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 快捷网页 */}
        <div className={styles.shortcutsWrapper}>
          <div className={styles.shortcutsList}>
            {shortcuts.map((site, index) => (
              <div
                key={site.id}
                className={`${styles.shortcutItem} ${isEditShortcuts ? styles.shortcutItemDraggable : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                draggable={isEditShortcuts}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDragLeave={handleDragLeaveItem}
                onDragEnd={handleDragEnd}
              >
                {editingId === site.id ? (
                  <div className={styles.editForm} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editShortcut.name}
                      onChange={(e) => setEditShortcut({ ...editShortcut, name: e.target.value })}
                      placeholder="名称"
                      className={styles.editInput}
                    />
                    <input
                      type="text"
                      value={editShortcut.url}
                      onChange={(e) => setEditShortcut({ ...editShortcut, url: e.target.value })}
                      placeholder="网址"
                      className={styles.editInput}
                    />
                    <input
                      type="text"
                      value={editShortcut.iconUrl}
                      onChange={(e) => setEditShortcut({ ...editShortcut, iconUrl: e.target.value })}
                      placeholder="图标URL（可选）"
                      className={styles.editInput}
                    />
                    <div className={styles.editActions}>
                      <button className={styles.editCancel} onClick={() => setEditingId(null)}>取消</button>
                      <button className={styles.editSave} onClick={saveEdit}>保存</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <a
                      href={isEditShortcuts ? undefined : site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shortcutLink}
                      title={site.name}
                      onClick={(e) => isEditShortcuts && e.preventDefault()}
                    >
                      <div className={styles.shortcutIcon}>
                        <img
                          src={getIconUrl(site)}
                          alt=""
                          draggable={false}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.textContent = site.name.charAt(0)
                          }}
                        />
                      </div>
                      <span className={styles.shortcutName}>{site.name}</span>
                    </a>
                    {isEditShortcuts && (
                      <div className={styles.shortcutActions}>
                        <button className={styles.shortcutActionBtn} onClick={() => startEdit(site)} title="编辑">
                          <Pencil size={11} />
                        </button>
                        <button className={styles.shortcutActionBtn} onClick={() => handleRemoveShortcut(site.id)} title="删除">
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {isEditShortcuts && (
              <button className={styles.shortcutAdd} onClick={() => setShowAddShortcut(!showAddShortcut)} title="添加快捷网页">
                <Plus size={18} />
              </button>
            )}
          </div>
          {isEditShortcuts && showAddShortcut && (
            <div className={styles.shortcutForm}>
              <input type="text" placeholder="名称" value={newShortcut.name} onChange={(e) => setNewShortcut({ ...newShortcut, name: e.target.value })} className={styles.shortcutInput} />
              <input type="text" placeholder="网址" value={newShortcut.url} onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })} className={styles.shortcutInput} />
              <input type="text" placeholder="图标URL（可选，留空自动获取）" value={newShortcut.iconUrl} onChange={(e) => setNewShortcut({ ...newShortcut, iconUrl: e.target.value })} className={styles.shortcutInput} />
              <button className={styles.shortcutConfirm} onClick={handleAddShortcut}>添加</button>
            </div>
          )}
        </div>

        {/* 快捷提示 */}
        <div className={styles.hint}>
          输入关键词搜索 · 按 Enter 快速搜索 · 按 ↑↓ 选择建议
        </div>
      </div>
    </div>
  )
}

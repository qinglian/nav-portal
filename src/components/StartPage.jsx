import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, ArrowRight, Moon, Sun, Compass, Pencil, X, Plus, Settings, Monitor, Sunrise } from 'lucide-react'
import { useTheme, THEME_MODES } from '../context/ThemeContext'
import StartPageSettings from './StartPageSettings'
import { getSettings } from '../utils/startPageSettings'
import { getPageDataKey, getPages } from '../utils/startPagePages'
import styles from './StartPage.module.css'

const SHORTCUTS_KEY = 'nav-shortcuts'

function getSavedShortcuts(pageId = 'default') {
  const key = getPageDataKey(pageId, SHORTCUTS_KEY)
  const saved = localStorage.getItem(key)
  if (!saved) return []
  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

function saveShortcuts(pageId, list) {
  const key = getPageDataKey(pageId, SHORTCUTS_KEY)
  localStorage.setItem(key, JSON.stringify(list))
}

const DEFAULT_ENGINES = [
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=', color: '#008373' },
  { id: 'google', name: '谷歌', url: 'https://www.google.com/search?q=', color: '#4285f4' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', color: '#2932e1' },
  { id: 'metaso', name: '秘塔AI', url: 'https://metaso.cn/?q=', color: '#00b4d8' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#de5833' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=', color: '#fb5100' },
]

function getEngines() {
  const saved = localStorage.getItem('nav-search-engines')
  return saved ? JSON.parse(saved) : DEFAULT_ENGINES
}

function getCurrentEngineId() {
  return localStorage.getItem('nav-current-engine') || 'bing'
}

export default function StartPage({ onGoToNav, pageId = 'default', onSettingsChange }) {
  const { theme, themeMode, setTheme } = useTheme()
  const [engines, setEngines] = useState(() => getEngines())
  const [currentEngineId, setCurrentEngineId] = useState(() => getCurrentEngineId())
  const [query, setQuery] = useState('')
  const [showEnginePicker, setShowEnginePicker] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [dateInfo, setDateInfo] = useState({ hour: 0, minute: 0, second: 0, month: '', day: 0, year: 0, weekday: '' })
  const [shortcuts, setShortcuts] = useState(() => getSavedShortcuts(pageId))
  const [isEditShortcuts, setIsEditShortcuts] = useState(false)
  const [showAddShortcut, setShowAddShortcut] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newShortcut, setNewShortcut] = useState({ name: '', url: '', iconUrl: '' })
  const [editShortcut, setEditShortcut] = useState({ name: '', url: '', iconUrl: '' })
  const [showSettings, setShowSettings] = useState(false)
  const [startSettings, setStartSettings] = useState(() => getSettings(pageId))

  // 设置变化回调（由设置弹窗调用）
  const handleSettingsChange = (newSettings) => {
    setStartSettings({ ...newSettings })
    if (onSettingsChange) onSettingsChange()
  }

  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragItemIndex = useRef(null)
  const dragItemData = useRef(null)
  const searchRef = useRef(null)
  const inputRef = useRef(null)
  const themePickerRef = useRef(null)
  const topBarRef = useRef(null)

  const freeLayoutEnabled = false

  // 更新时钟
  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      setDateInfo({
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        month: months[now.getMonth()],
        day: now.getDate(),
        year: now.getFullYear(),
        weekday: weekdays[now.getDay()],
      })
    }
    updateDate()
    const timer = setInterval(updateDate, 1000)
    return () => clearInterval(timer)
  }, [])

  // 点击外部关闭主题下拉栏
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target)) {
        setShowThemePicker(false)
      }
    }
    if (showThemePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showThemePicker])

  // 问候语
  const greeting = useMemo(() => {
    const h = dateInfo.hour
    if (h < 6) return '夜深了，注意休息'
    if (h < 9) return '早上好，开启美好的一天'
    if (h < 12) return '上午好，工作愉快'
    if (h < 14) return '中午好，记得午休'
    if (h < 18) return '下午好，继续加油'
    if (h < 22) return '晚上好，放松一下'
    return '夜深了，注意休息'
  }, [dateInfo.hour])

  // 当前引擎对象
  const activeEngine = engines.find(e => e.id === currentEngineId) || engines[0]

  // 搜索引擎切换（同步到导航页）
  const handleEngineChange = (engineId) => {
    setCurrentEngineId(engineId)
    localStorage.setItem('nav-current-engine', engineId)
    setShowEnginePicker(false)
    inputRef.current?.focus()
  }

  // 搜索
  const handleSearch = () => {
    if (!query.trim()) return
    const url = activeEngine.url + encodeURIComponent(query)
    window.open(url, '_blank')
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 快捷网页管理
  const handleAddShortcut = () => {
    if (!newShortcut.name.trim() || !newShortcut.url.trim()) return
    const url = newShortcut.url.startsWith('http') ? newShortcut.url : 'https://' + newShortcut.url
    const iconUrl = newShortcut.iconUrl.trim() || ''
    const item = {
      id: Date.now().toString(),
      name: newShortcut.name.trim(),
      url,
      iconUrl,
      pos: undefined,
    }
    const updated = [...shortcuts, item]
    setShortcuts(updated)
    saveShortcuts(pageId, updated)
    setNewShortcut({ name: '', url: '', iconUrl: '' })
    setShowAddShortcut(false)
  }

  const handleRemoveShortcut = (id) => {
    const updated = shortcuts.filter((s) => s.id !== id)
    setShortcuts(updated)
    saveShortcuts(pageId, updated)
  }

  const startEdit = (site) => {
    setEditingId(site.id)
    setEditShortcut({ name: site.name, url: site.url, iconUrl: site.iconUrl || '' })
  }

  const saveEdit = () => {
    if (!editShortcut.name.trim() || !editShortcut.url.trim()) return
    const updated = shortcuts.map((s) =>
      s.id === editingId
        ? { ...s, name: editShortcut.name.trim(), url: editShortcut.url.startsWith('http') ? editShortcut.url : 'https://' + editShortcut.url, iconUrl: editShortcut.iconUrl.trim() || '' }
        : s
    )
    setShortcuts(updated)
    saveShortcuts(pageId, updated)
    setEditingId(null)
  }

  const getIconUrl = (site) => {
    if (site.iconUrl) return site.iconUrl
    try {
      const domain = new URL(site.url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      return ''
    }
  }

  // 拖拽排序
  const handleDragStart = (e, index) => {
    if (!isEditShortcuts) return
    dragItemIndex.current = index
    dragItemData.current = shortcuts[index]
    e.dataTransfer.effectAllowed = 'move'
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const handleDragOverItem = (e, index) => {
    if (!isEditShortcuts || dragItemIndex.current === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (freeLayoutEnabled) {
      // 自由布局：吸附到网格（40px 网格）
      const wrapper = e.currentTarget.parentElement
      const rect = wrapper.getBoundingClientRect()
      const rawX = e.clientX - rect.left - 40
      const rawY = e.clientY - rect.top - 40
      const gridSize = 40
      const x = Math.round(Math.max(0, rawX) / gridSize) * gridSize
      const y = Math.round(Math.max(0, rawY) / gridSize) * gridSize

      const newShortcuts = shortcuts.map((s, i) => {
        if (i === dragItemIndex.current) {
          return { ...s, pos: { x, y } }
        }
        return s
      })
      setShortcuts(newShortcuts)
    } else {
      // 普通模式：交换位置
      if (dragOverIndex !== index) {
        setDragOverIndex(index)
        if (dragItemIndex.current !== index) {
          const newList = [...shortcuts]
          const [moved] = newList.splice(dragItemIndex.current, 1)
          newList.splice(index, 0, moved)
          setShortcuts(newList)
          dragItemIndex.current = index
        }
      }
    }
  }

  const handleDragLeaveItem = (e) => {
    // 不需要处理
  }

  const handleDragEnd = (e) => {
    dragItemIndex.current = null
    dragItemData.current = null
    setDragOverIndex(null)
    saveShortcuts(pageId, shortcuts)
  }

  return (
    <div className={`${styles.container} ${shortcuts.length === 0 ? styles.containerCentered : ''}`}>
      {/* 顶部工具栏 */}
      <div className={`${styles.topBar} ${isEditShortcuts ? styles.topBarVisible : ''}`}
        ref={topBarRef}
        onMouseLeave={() => setShowThemePicker(false)}
      >
        <div className={styles.themePickerWrapper} ref={themePickerRef}>
          <button className={styles.topBtn} onClick={(e) => { e.stopPropagation(); setShowThemePicker(!showThemePicker) }} title="主题模式">
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          {showThemePicker && (
            <div className={styles.themeDropdown}>
              {[
                { mode: 'light', icon: <Sun size={14} />, label: '亮色模式' },
                { mode: 'dark', icon: <Moon size={14} />, label: '深色模式' },
                { mode: 'system', icon: <Monitor size={14} />, label: '跟随系统' },
                { mode: 'sunrise-sunset', icon: <Sunrise size={14} />, label: '日出日落' },
              ].map(item => (
                <button
                  key={item.mode}
                  className={`${styles.themeOption} ${themeMode === item.mode ? styles.themeOptionActive : ''}`}
                  onClick={() => { setTheme(item.mode); setShowThemePicker(false) }}
                >
                  <span className={styles.themeOptionIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                  {themeMode === item.mode && <span className={styles.themeOptionCheck}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`${styles.topBtn} ${isEditShortcuts ? styles.topBtnActive : ''}`}
          onClick={() => setIsEditShortcuts(!isEditShortcuts)}
          title={isEditShortcuts ? '完成编辑' : '编辑快捷网页'}
        >
          <Pencil size={15} />
        </button>
        <button
          className={styles.topBtn}
          onClick={() => setShowSettings(true)}
          title="起始页设置"
        >
          <Settings size={15} />
        </button>
        <button className={styles.navBtn} onClick={onGoToNav}>
          <Compass size={15} />
          <span>导航</span>
        </button>
      </div>

      {/* 问候语 - 跟随时间显示 */}
      {startSettings.timeWidget?.visible !== false && (
        <div className={styles.greeting}>{greeting}</div>
      )}

      {/* 时间日期 */}
      {startSettings.timeWidget?.visible !== false && (
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
      )}

      {/* 搜索框 */}
      {startSettings.searchBox?.visible !== false && (
        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            <div className={styles.engineSelector}>
              <button className={styles.engineBtn} onClick={() => setShowEnginePicker(!showEnginePicker)}>
                <span className={styles.engineDot} style={{ background: activeEngine?.color }} />
                <span className={styles.engineName}>{activeEngine?.name}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${showEnginePicker ? styles.chevronOpen : ''}`} />
              </button>
              {showEnginePicker && (
                <div className={styles.engineDropdown}>
                  {engines.map(engine => (
                    <button key={engine.id} className={`${styles.engineOption} ${engine.id === currentEngineId ? styles.engineOptionActive : ''}`} onClick={() => handleEngineChange(engine.id)}>
                      <span className={styles.engineDot} style={{ background: engine.color }} />
                      <span>{engine.name}</span>
                      {engine.id === currentEngineId && <span className={styles.engineCheck}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`使用 ${activeEngine?.name || '搜索引擎'} 搜索...`}
                className={styles.searchInput}
                autoComplete="off"
              />
              {query && (
                <button className={styles.clearBtn} onClick={() => setQuery('')}>×</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 快捷网页 */}
      <div className={styles.shortcutsWrapper}>
        <div className={`${styles.shortcutsList} ${freeLayoutEnabled ? styles.shortcutsFreeMode : ''} ${freeLayoutEnabled && isEditShortcuts ? styles.shortcutsFreeModeEdit : ''}`}>
          {shortcuts.map((site, index) => {
            const pos = freeLayoutEnabled && site.pos ? site.pos : null
            return (
              <div
                key={site.id}
                className={`${styles.shortcutItem} ${isEditShortcuts ? styles.shortcutItemDraggable : ''} ${dragOverIndex === index ? styles.dragOver : ''} ${pos ? styles.shortcutItemFree : ''}`}
                style={pos ? { left: pos.x, top: pos.y } : undefined}
                draggable={isEditShortcuts && editingId !== site.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDragLeave={handleDragLeaveItem}
                onDragEnd={handleDragEnd}
              >
                {editingId === site.id ? (
                  <div
                    className={styles.editForm}
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrag={(e) => e.preventDefault()}
                  >
                    <input
                      type="text"
                      value={editShortcut.name}
                      onChange={(e) => setEditShortcut({ ...editShortcut, name: e.target.value })}
                      placeholder="名称"
                      className={styles.editInput}
                      draggable={false}
                    />
                    <input
                      type="text"
                      value={editShortcut.url}
                      onChange={(e) => setEditShortcut({ ...editShortcut, url: e.target.value })}
                      placeholder="网址"
                      className={styles.editInput}
                      draggable={false}
                    />
                    <input
                      type="text"
                      value={editShortcut.iconUrl}
                      onChange={(e) => setEditShortcut({ ...editShortcut, iconUrl: e.target.value })}
                      placeholder="图标URL（可选）"
                      className={styles.editInput}
                      draggable={false}
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
            )
          })}
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

      {/* 快捷提示 - 跟随搜索框 */}
      {startSettings.searchBox?.visible !== false && (
        <div className={styles.hint}>
          输入关键词搜索 · 按 Enter 快速搜索
        </div>
      )}

      {/* 设置弹窗 */}
      {showSettings && (
        <StartPageSettings onClose={() => setShowSettings(false)} onSettingsChange={handleSettingsChange} pageId={pageId} pageName={getPages().find(p => p.id === pageId)?.name} />
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Plus, X, Search } from 'lucide-react'
import { getSafeBoxEnabled, verifySafeBoxPassword } from '../utils/safeBox'
import SafeBox from './SafeBox'
import styles from './SearchEnginePicker.module.css'

const DEFAULT_ENGINES = [
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=', color: '#008373' },
  { id: 'google', name: '谷歌', url: 'https://www.google.com/search?q=', color: '#4285f4' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', color: '#2932e1' },
  { id: 'metaso', name: '秘塔AI', url: 'https://metaso.cn/?q=', color: '#00b4d8' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#de5833' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=', color: '#fb5100' },
]

export default function SearchEnginePicker({ isEditMode }) {
  const [engines, setEngines] = useState(() => {
    const saved = localStorage.getItem('nav-search-engines')
    return saved ? JSON.parse(saved) : DEFAULT_ENGINES
  })
  const [currentEngine, setCurrentEngine] = useState(() => {
    return localStorage.getItem('nav-current-engine') || 'bing'
  })
  const [searchInput, setSearchInput] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [showSafeBox, setShowSafeBox] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (showAdd && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAdd])

  const handleSearch = () => {
    const query = searchInput.trim()
    if (!query) return

    // 检测保险箱密码
    if (getSafeBoxEnabled() && verifySafeBoxPassword(query)) {
      setShowSafeBox(true)
      setSearchInput('')
      return
    }

    // 忘记密码：输入当前时间年月日时分（如 202606081637）
    if (getSafeBoxEnabled()) {
      const now = new Date()
      const timeCode =
        String(now.getFullYear()) +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0')
      if (query === timeCode) {
        setShowSafeBox(true)
        setSearchInput('')
        return
      }
    }

    const engine = engines.find(en => en.id === currentEngine)
    if (engine) {
      window.open(engine.url + encodeURIComponent(query), '_blank')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const selectEngine = (id) => {
    setCurrentEngine(id)
    localStorage.setItem('nav-current-engine', id)
  }

  const addEngine = () => {
    if (!newName.trim() || !newUrl.trim()) return
    const id = 'custom_' + Date.now()
    const newEng = {
      id,
      name: newName.trim(),
      url: newUrl.trim().endsWith('=') ? newUrl.trim() : newUrl.trim() + (newUrl.includes('?') ? '&q=' : '?q='),
      color: '#6366f1'
    }
    const updated = [...engines, newEng]
    setEngines(updated)
    localStorage.setItem('nav-search-engines', JSON.stringify(updated))
    setNewName('')
    setNewUrl('')
    setShowAdd(false)
  }

  const removeEngine = (id) => {
    const updated = engines.filter(en => en.id !== id)
    setEngines(updated)
    localStorage.setItem('nav-search-engines', JSON.stringify(updated))
    if (currentEngine === id) {
      setCurrentEngine(updated[0]?.id || '')
      localStorage.setItem('nav-current-engine', updated[0]?.id || '')
    }
  }

  const activeEngine = engines.find(en => en.id === currentEngine) || engines[0]

  return (
    <div className={styles.picker}>
      <div className={styles.title}>
        <Globe size={14} />
        <span>网络搜索</span>
      </div>

      {/* 搜索引擎网格 */}
      <div className={styles.engines}>
        {engines.map(engine => (
          <div
            key={engine.id}
            className={`${styles.engineCard} ${engine.id === currentEngine ? styles.engineActive : ''}`}
            onClick={() => selectEngine(engine.id)}
          >
            <div className={styles.engineDot} style={{ background: engine.color || 'var(--accent-primary)' }} />
            <span className={styles.engineName}>{engine.name}</span>
            {engine.id.startsWith('custom_') && (
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); removeEngine(engine.id) }}
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {isEditMode && !showAdd && (
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            <span>自定义</span>
          </button>
        )}
      </div>

      {/* 自定义添加表单 */}
      {showAdd && (
        <div className={styles.addForm}>
          <input
            ref={inputRef}
            type="text"
            placeholder="引擎名称（如：Yandex）"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={styles.formInput}
          />
          <input
            type="text"
            placeholder="搜索URL，关键词用 {keyword} 占位"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className={styles.formInput}
            onKeyDown={(e) => e.key === 'Enter' && addEngine()}
          />
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowAdd(false); setNewName(''); setNewUrl('') }}>取消</button>
            <button className={styles.confirmBtn} onClick={addEngine}>添加</button>
          </div>
        </div>
      )}

      {/* 搜索输入框 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder={`使用 ${activeEngine?.name || '搜索引擎'} 搜索...`}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.searchInput}
        />
        <button className={styles.searchBtn} onClick={handleSearch}>
          <Search size={16} />
          <span>搜索</span>
        </button>
      </div>

      {/* 保险箱弹窗 - Portal渲染到body */}
      {showSafeBox && createPortal(<SafeBox onClose={() => setShowSafeBox(false)} />, document.body)}
    </div>
  )
}

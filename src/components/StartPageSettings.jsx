import { useState } from 'react'
import { X, Settings, Plus, Trash2, GripVertical, Pencil, Check } from 'lucide-react'
import { getSettings, updateSetting } from '../utils/startPageSettings'
import styles from './StartPageSettings.module.css'

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

function saveEngines(engines) {
  localStorage.setItem('nav-search-engines', JSON.stringify(engines))
}

const CATEGORIES = [
  { id: 'basic', name: '基础设置' },
  { id: 'engines', name: '搜索引擎' },
]

export default function StartPageSettings({ onClose, onSettingsChange, pageId, pageName }) {
  const [activeCategory, setActiveCategory] = useState('basic')
  const [settings, setSettings] = useState(() => getSettings(pageId))
  const isDefault = pageId === 'default'

  // 搜索引擎管理
  const [engines, setEngines] = useState(() => getEngines())
  const [showAddEngine, setShowAddEngine] = useState(false)
  const [newEngineName, setNewEngineName] = useState('')
  const [newEngineUrl, setNewEngineUrl] = useState('')
  const [editingEngineId, setEditingEngineId] = useState(null)
  const [editEngineName, setEditEngineName] = useState('')
  const [editEngineUrl, setEditEngineUrl] = useState('')
  const [dragEngineIdx, setDragEngineIdx] = useState(null)

  const handleChange = (category, key, value) => {
    const newSettings = updateSetting(pageId, category, key, value)
    setSettings({ ...newSettings })
    if (onSettingsChange) onSettingsChange(newSettings)
  }

  const title = isDefault ? '起始页设置' : `起始页设置 - ${pageName || ''}`

  // 添加搜索引擎
  const addEngine = () => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) return
    let url = newEngineUrl.trim()
    // 如果 URL 不以 = 结尾，自动补上查询参数占位
    if (!url.endsWith('=')) {
      url += url.includes('?') ? '&q=' : '?q='
    }
    const id = 'custom_' + Date.now()
    const newEng = { id, name: newEngineName.trim(), url, color: '#6366f1' }
    const updated = [...engines, newEng]
    setEngines(updated)
    saveEngines(updated)
    setNewEngineName('')
    setNewEngineUrl('')
    setShowAddEngine(false)
  }

  // 删除搜索引擎
  const removeEngine = (id) => {
    const updated = engines.filter(e => e.id !== id)
    setEngines(updated)
    saveEngines(updated)
    const currentId = localStorage.getItem('nav-current-engine')
    if (currentId === id) {
      localStorage.setItem('nav-current-engine', updated[0]?.id || '')
    }
  }

  // 开始编辑
  const startEdit = (engine) => {
    setEditingEngineId(engine.id)
    setEditEngineName(engine.name)
    setEditEngineUrl(engine.url)
  }

  // 保存编辑
  const saveEdit = () => {
    if (!editEngineName.trim() || !editEngineUrl.trim()) return
    const updated = engines.map(e =>
      e.id === editingEngineId
        ? { ...e, name: editEngineName.trim(), url: editEngineUrl.trim() }
        : e
    )
    setEngines(updated)
    saveEngines(updated)
    setEditingEngineId(null)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingEngineId(null)
    setEditEngineName('')
    setEditEngineUrl('')
  }

  // 拖拽排序
  const handleEngineDragStart = (idx) => {
    setDragEngineIdx(idx)
  }

  const handleEngineDragOver = (e, idx) => {
    e.preventDefault()
    if (dragEngineIdx === null || dragEngineIdx === idx) return
    const updated = [...engines]
    const [moved] = updated.splice(dragEngineIdx, 1)
    updated.splice(idx, 0, moved)
    setEngines(updated)
    setDragEngineIdx(idx)
  }

  const handleEngineDragEnd = () => {
    setDragEngineIdx(null)
    saveEngines(engines)
  }

  return (
    <div className={styles.overlayWrapper}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Settings size={18} />
            <span>{title}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div className={styles.body}>
          {/* 左侧分类 */}
          <div className={styles.sidebar}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryActive : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 右侧设置项 */}
          <div className={styles.content}>
            {activeCategory === 'basic' && (
              <div className={styles.settingsGroup}>
                <h3 className={styles.groupTitle}>组件显示</h3>

                <div className={styles.settingItem}>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>搜索栏</span>
                    <button
                      className={`${styles.toggle} ${settings.searchBox?.visible !== false ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => handleChange('searchBox', 'visible', settings.searchBox?.visible === false)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>时间显示</span>
                    <button
                      className={`${styles.toggle} ${settings.timeWidget?.visible !== false ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => handleChange('timeWidget', 'visible', settings.timeWidget?.visible === false)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>

                {isDefault && (
                  <div className={styles.settingItem}>
                    <div className={styles.toggleRow}>
                      <span className={styles.toggleLabel}>多页</span>
                      <button
                        className={`${styles.toggle} ${settings.pageSidebar?.visible !== false ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => handleChange('pageSidebar', 'visible', settings.pageSidebar?.visible === false)}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeCategory === 'engines' && (
              <div className={styles.settingsGroup}>
                <h3 className={styles.groupTitle}>搜索引擎管理</h3>
                <p className={styles.groupDesc}>拖拽排序 · 与导航页同步</p>

                <div className={styles.engineList}>
                  {engines.map((engine, index) => (
                    <div
                      key={engine.id}
                      className={`${styles.engineItem} ${dragEngineIdx === index ? styles.engineItemDragging : ''}`}
                      draggable={editingEngineId !== engine.id}
                      onDragStart={() => handleEngineDragStart(index)}
                      onDragOver={(e) => handleEngineDragOver(e, index)}
                      onDragEnd={handleEngineDragEnd}
                    >
                      {editingEngineId === engine.id ? (
                        <div className={styles.engineEditForm}>
                          <input
                            type="text"
                            value={editEngineName}
                            onChange={(e) => setEditEngineName(e.target.value)}
                            placeholder="引擎名称"
                            className={styles.addEngineInput}
                          />
                          <input
                            type="text"
                            value={editEngineUrl}
                            onChange={(e) => setEditEngineUrl(e.target.value)}
                            placeholder="搜索URL"
                            className={styles.addEngineInput}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                          <div className={styles.engineEditActions}>
                            <button className={styles.addEngineCancel} onClick={cancelEdit}>取消</button>
                            <button className={styles.addEngineConfirm} onClick={saveEdit}>保存</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.engineItemLeft}>
                            <GripVertical size={14} className={styles.gripIcon} />
                            <span className={styles.engineDot} style={{ background: engine.color || '#6366f1' }} />
                            <span className={styles.engineItemName}>{engine.name}</span>
                          </div>
                          <div className={styles.engineItemRight}>
                            <span className={styles.engineItemUrl}>{engine.url}</span>
                            <button className={styles.engineEditBtn} onClick={() => startEdit(engine)} title="编辑">
                              <Pencil size={13} />
                            </button>
                            <button className={styles.engineRemoveBtn} onClick={() => removeEngine(engine.id)} title="删除">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {showAddEngine ? (
                  <div className={styles.addEngineForm}>
                    <input
                      type="text"
                      placeholder="引擎名称（如：Yandex）"
                      value={newEngineName}
                      onChange={(e) => setNewEngineName(e.target.value)}
                      className={styles.addEngineInput}
                    />
                    <input
                      type="text"
                      placeholder="搜索URL（如：https://yandex.com/search/?text=）"
                      value={newEngineUrl}
                      onChange={(e) => setNewEngineUrl(e.target.value)}
                      className={styles.addEngineInput}
                      onKeyDown={(e) => e.key === 'Enter' && addEngine()}
                    />
                    <div className={styles.addEngineActions}>
                      <button className={styles.addEngineCancel} onClick={() => { setShowAddEngine(false); setNewEngineName(''); setNewEngineUrl('') }}>取消</button>
                      <button className={styles.addEngineConfirm} onClick={addEngine}>添加</button>
                    </div>
                  </div>
                ) : (
                  <button className={styles.addEngineBtn} onClick={() => setShowAddEngine(true)}>
                    <Plus size={14} />
                    <span>添加搜索引擎</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

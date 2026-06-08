import { useState, useEffect, useRef } from 'react'
import { GripVertical, Eye, EyeOff, Pin, Clock, TrendingUp, Sparkles, Zap } from 'lucide-react'
import {
  getQuickAccessSections,
  saveQuickAccessSections,
  getRecentSites,
  getMostUsedSites,
  getNewestSites,
  getPinnedSites,
  reorderPinnedSites,
} from '../utils/quickAccess'
import SiteCard from './SiteCard'
import styles from './QuickAccess.module.css'

// 子分类 lucide 线条图标
const SECTION_ICONS = {
  recent: Clock,
  most: TrendingUp,
  new: Sparkles,
  pinned: Pin,
}

const MAX_SITES = 12

export default function QuickAccess({ isEditMode, allCategories, onSiteContextMenu, siteStatusEnabled }) {
  const scrollToCategory = (categoryId) => {
    const el = document.getElementById(`category-${categoryId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // 滚动完成后触发闪动效果
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('categoryFlash', { detail: { categoryId } }))
      }, 400)
    }
  }
  const [sections, setSections] = useState(() => getQuickAccessSections())
  const [activeTab, setActiveTab] = useState(null)
  const [sitesMap, setSitesMap] = useState({})
  const [pinnedChanged, setPinnedChanged] = useState(0)
  const tabsRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // 加载各分类数据（非置顶分类最多12个）
  useEffect(() => {
    const map = {}
    map.recent = getRecentSites(MAX_SITES)
    map.most = getMostUsedSites(MAX_SITES)
    map.new = getNewestSites(allCategories, MAX_SITES)
    map.pinned = getPinnedSites()
    setSitesMap(map)

    const visible = sections.filter(s => s.visible)
    if (visible.length > 0 && !activeTab) {
      setActiveTab(visible[0].id)
    }
  }, [allCategories, sections, activeTab, pinnedChanged])

  // 监听置顶变化事件
  useEffect(() => {
    const handler = () => setPinnedChanged(c => c + 1)
    window.addEventListener('quickAccessPinnedChanged', handler)
    return () => window.removeEventListener('quickAccessPinnedChanged', handler)
  }, [])

  // 水滴吸附指示器位置更新
  useEffect(() => {
    updateIndicator(activeTab)
  }, [activeTab, sections, isEditMode])

  const updateIndicator = (tabId) => {
    if (!tabsRef.current || !tabId) return
    const wrapper = tabsRef.current.querySelector(`.${styles.tabWrapper}`)
    const activeButton = tabsRef.current.querySelector(`[data-tab="${tabId}"]`)
    if (wrapper && activeButton) {
      const wrapperRect = wrapper.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()
      setIndicatorStyle({
        left: buttonRect.left - wrapperRect.left,
        width: buttonRect.width,
      })
    }
  }

  // 切换标签
  const handleTabClick = (id) => {
    if (isEditMode) return
    setActiveTab(id)
  }

  // 切换可见性（编辑模式）
  const toggleVisibility = (sectionId) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    )
    setSections(updated)
    saveQuickAccessSections(updated)
    if (activeTab === sectionId && updated.find(s => s.id === sectionId)?.visible === false) {
      const firstVisible = updated.find(s => s.visible)
      if (firstVisible) setActiveTab(firstVisible.id)
    }
  }

  // ========== 子分类拖拽排序 ==========
  const handleDragStart = (e, index) => {
    if (!isEditMode) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'qa-section',
      fromIndex: index,
    }))
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  const handleDragOver = (e) => {
    if (!isEditMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, toIndex) => {
    e.preventDefault()
    if (!isEditMode) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'qa-section' && data.fromIndex !== toIndex) {
        const newSections = [...sections]
        const [moved] = newSections.splice(data.fromIndex, 1)
        newSections.splice(toIndex, 0, moved)
        newSections.forEach((s, i) => { s.order = i })
        setSections(newSections)
        saveQuickAccessSections(newSections)
      }
    } catch (err) {
      console.log('QA section drop error:', err)
    }
  }

  // ========== 置顶网站拖拽排序 ==========
  const handlePinnedDragStart = (e, index) => {
    if (!isEditMode) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'qa-pinned',
      fromIndex: index,
    }))
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handlePinnedDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  const handlePinnedDragOver = (e) => {
    if (!isEditMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handlePinnedDrop = (e, toIndex) => {
    e.preventDefault()
    if (!isEditMode) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'qa-pinned' && data.fromIndex !== toIndex) {
        const pinned = [...sitesMap.pinned]
        const [moved] = pinned.splice(data.fromIndex, 1)
        pinned.splice(toIndex, 0, moved)
        reorderPinnedSites(pinned)
        setSitesMap(prev => ({ ...prev, pinned }))
      }
    } catch (err) {
      console.log('QA pinned drop error:', err)
    }
  }

  const currentSites = sitesMap[activeTab] || []
  const visibleSections = sections.filter(s => s.visible)
  const displaySections = isEditMode ? sections : visibleSections

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}><Zap size={16} /></div>
            <h2 className={styles.title}>快捷入口</h2>
          </div>

          {/* 分类快捷跳转按钮 */}
          {!isEditMode && allCategories.length > 0 && (
            <div className={styles.catShortcuts}>
              {allCategories.map(cat => (
                <button
                  key={cat.id}
                  className={styles.catShortcutBtn}
                  onClick={() => scrollToCategory(cat.id)}
                  title={cat.name}
                >
                  <span className={styles.catShortcutIcon}>{cat.name.charAt(0)}</span>
                  <span className={styles.catShortcutName}>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 子分类标签 - 水滴吸附动效 */}
        <div className={styles.tagContainer} ref={tabsRef}>
          <div className={styles.tabWrapper}>
            {displaySections.map((section, index) => {
              const Icon = SECTION_ICONS[section.id]
              const isHidden = !section.visible
              return (
                <button
                  key={section.id}
                  data-tab={section.id}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`${styles.tab} ${activeTab === section.id && !isEditMode ? styles.tabActive : ''} ${isEditMode ? styles.tabDraggable : ''} ${isHidden ? styles.tabHidden : ''}`}
                  onClick={() => handleTabClick(section.id)}
                >
                  {isEditMode && <GripVertical size={10} className={styles.dragIcon} />}
                  {Icon && <Icon size={12} className={styles.tabIcon} />}
                  <span>{section.name}</span>
                  {isEditMode && (
                    <span
                      className={styles.visibilityToggle}
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(section.id) }}
                      title={isHidden ? '显示' : '隐藏'}
                    >
                      {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </span>
                  )}
                </button>
              )
            })}

            {/* 水滴吸附指示器 */}
            {!isEditMode && (
              <div
                className={styles.tabIndicator}
                style={{
                  transform: `translateX(${indicatorStyle.left}px)`,
                  width: `${indicatorStyle.width}px`,
                }}
              />
            )}
          </div>
        </div>

        {/* 网站列表 */}
        {!isEditMode && activeTab && (
          <div className={styles.sitesList}>
            {currentSites.length > 0 ? (
              currentSites.map((site, index) => (
                <div
                  key={site.url || site.id}
                  draggable={isEditMode && activeTab === 'pinned'}
                  onDragStart={(e) => handlePinnedDragStart(e, index)}
                  onDragEnd={handlePinnedDragEnd}
                  onDragOver={handlePinnedDragOver}
                  onDrop={(e) => handlePinnedDrop(e, index)}
                  className={isEditMode && activeTab === 'pinned' ? styles.draggable : ''}
                >
                  <SiteCard
                    site={site}
                    isEditMode={isEditMode}
                    onContextMenu={onSiteContextMenu}
                    siteStatusEnabled={siteStatusEnabled}
                  />
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                {activeTab === 'recent' && '暂无最近使用记录，点击网站卡片即可记录'}
                {activeTab === 'most' && '暂无使用记录，多访问几次就会出现在这里'}
                {activeTab === 'new' && '暂无新添加的网站'}
                {activeTab === 'pinned' && '暂无置顶网站，右键点击网站卡片选择置顶'}
              </div>
            )}
          </div>
        )}

        {/* 编辑模式下的提示 */}
        {isEditMode && (
          <div className={styles.editHint}>
            编辑模式下可以拖拽排序子分类，点击眼睛图标可显示/隐藏子分类
          </div>
        )}
      </div>
    </section>
  )
}

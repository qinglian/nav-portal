import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, EyeOff, GripVertical } from 'lucide-react'
import SiteCard from './SiteCard'
import styles from './CategorySection.module.css'

export default function CategorySection({ 
  category, 
  isEditMode, 
  onAddSite, 
  onEditSite, 
  onDeleteSite,
  onEditCategory,
  onDeleteCategory,
  onReorderSites,
  onReorderTags,
  onReorderCategories,
  onToggleCategoryVisibility,
  categoryIndex,
  allCategories,
  onSiteContextMenu,
  siteStatusEnabled,
  isHidden,
  catDragId,
  catDropTargetId,
  onCatDragStart,
  onCatDragEnter,
  onCatDragEnd
}) {
  const [activeTag, setActiveTag] = useState('全部')
  const tagContainerRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [flash, setFlash] = useState(false)

  // 拖拽排序状态
  const [siteDragOverIndex, setSiteDragOverIndex] = useState(null)
  const siteDragIndex = useRef(null)

  // 监听滚动定位闪动
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.categoryId === category.id) {
        setFlash(true)
        setTimeout(() => setFlash(false), 1200)
      }
    }
    window.addEventListener('categoryFlash', handler)
    return () => window.removeEventListener('categoryFlash', handler)
  }, [category.id])

  const tagNames = category.tags || []
  
  const filteredSites = activeTag === '全部' 
    ? category.sites 
    : category.sites.filter(site => site.tag === activeTag)

  // 水滴吸附动效
  useEffect(() => {
    updateIndicator(activeTag)
  }, [activeTag, tagNames])

  const updateIndicator = (tag) => {
    if (!tagContainerRef.current) return
    const wrapper = tagContainerRef.current.querySelector(`.${styles.tagWrapper}`)
    const activeButton = tagContainerRef.current.querySelector(`[data-tag="${tag}"]`)
    if (wrapper && activeButton) {
      const wrapperRect = wrapper.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()
      setIndicatorStyle({
        left: buttonRect.left - wrapperRect.left,
        width: buttonRect.width,
      })
    }
  }

  // ========== 分类拖拽排序 - 使用 mouse events（避免 HTML5 DnD 嵌套问题）==========
  const isCatDragging = catDragId === category.id
  const isCatDropTarget = catDropTargetId === category.id

  const handleCatMouseDown = (e) => {
    if (!isEditMode) return
    e.stopPropagation()
    onCatDragStart && onCatDragStart(category.id)

    // 添加全局样式防止文本选择
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'

    let lastTargetId = null

    const handleMouseMove = (moveEvent) => {
      // 使用 elementFromPoint 精确检测鼠标下方的分类（更跟手）
      const elem = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)
      if (!elem) return
      const section = elem.closest('[data-cat-section]')
      if (section) {
        const targetId = section.dataset.catSection
        if (targetId && targetId !== lastTargetId && targetId !== category.id) {
          lastTargetId = targetId
          onCatDragEnter && onCatDragEnter(targetId)
        }
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      // 传递最终目标分类ID
      onCatDragEnd && onCatDragEnd(lastTargetId)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // ========== 子分类标签拖拽排序 - 实时预览 ==========
  const [tagDragOverIndex, setTagDragOverIndex] = useState(null)
  const tagDragIndex = useRef(null)

  const handleTagDragStart = (e, tagIndex) => {
    tagDragIndex.current = tagIndex
    e.dataTransfer.effectAllowed = 'move'
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const handleTagDragEnd = (e) => {
    tagDragIndex.current = null
    setTagDragOverIndex(null)
  }

  const handleTagDragOver = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (tagDragOverIndex !== index) {
      setTagDragOverIndex(index)
      if (tagDragIndex.current !== null && tagDragIndex.current !== index) {
        const newTags = [...tagNames]
        const [moved] = newTags.splice(tagDragIndex.current, 1)
        newTags.splice(index, 0, moved)
        onReorderTags(category.id, newTags)
        tagDragIndex.current = index
      }
    }
  }

  const handleTagDragLeave = (e) => {
    setTagDragOverIndex(null)
  }

  const handleTagDrop = (e, toIndex) => {
    e.preventDefault()
    tagDragIndex.current = null
    setTagDragOverIndex(null)
  }

  // ========== 网站拖拽排序 - 实时预览 ==========
  const handleSiteDragStart = (e, siteIndex) => {
    siteDragIndex.current = siteIndex
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/site-index', String(siteIndex))
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const handleSiteDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (siteDragOverIndex !== index) {
      setSiteDragOverIndex(index)
      if (siteDragIndex.current !== null && siteDragIndex.current !== index) {
        const newSites = [...category.sites]
        const [moved] = newSites.splice(siteDragIndex.current, 1)
        newSites.splice(index, 0, moved)
        onReorderSites(category.id, newSites)
        siteDragIndex.current = index
      }
    }
  }

  const handleSiteDragLeave = (e) => {
    setSiteDragOverIndex(null)
  }

  const handleSiteDrop = (e, toIndex) => {
    e.preventDefault()
    siteDragIndex.current = null
    setSiteDragOverIndex(null)
  }

  const handleSiteDragEnd = (e) => {
    siteDragIndex.current = null
    setSiteDragOverIndex(null)
  }

  return (
    <section 
      className={`${styles.section} ${flash ? styles.flash : ''} ${isCatDragging ? styles.catDragging : ''} ${isCatDropTarget ? styles.catDropTarget : ''}`}
      id={`category-${category.id}`}
      data-cat-section={category.id}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          {isEditMode && (
            <div 
              className={styles.catDragHandle}
              onMouseDown={handleCatMouseDown}
              onClick={(e) => e.stopPropagation()}
              title="拖动排序"
            >
              <GripVertical size={16} />
            </div>
          )}
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              {category.name.charAt(0)}
            </div>
            <h2 className={styles.title}>{category.name}</h2>
            <span className={styles.count}>{category.sites.length}</span>
          </div>
          
          {isEditMode && (
            <div className={styles.actions}>
              <button 
                onClick={() => onToggleCategoryVisibility && onToggleCategoryVisibility(category.id)} 
                className={`${styles.hideBtn} ${isHidden ? styles.hideBtnActive : ''}`} 
                title={isHidden ? '取消隐藏' : '隐藏分类'}
              >
                <EyeOff size={14} />
              </button>
              <button onClick={() => onAddSite(category.id)} className={styles.addBtn} title="添加网站">
                <Plus size={14} />
              </button>
              <button onClick={() => onEditCategory(category)} className={styles.editBtn} title="编辑分类">
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteCategory(category.id)} className={styles.deleteBtn} title="删除分类">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Tag Pills */}
        <div className={styles.tagContainer} ref={tagContainerRef}>
          <div className={styles.tagWrapper}>
            {/* "全部" 标签 - 不可拖拽 */}
            <button
              className={`${styles.tag} ${activeTag === '全部' ? styles.active : ''}`}
              data-tag="全部"
              onClick={() => setActiveTag('全部')}
            >
              全部
            </button>

            {/* 可拖拽的子分类标签 */}
            {tagNames.map((tag, index) => (
              <button
                key={tag}
                draggable={isEditMode}
                data-tag={tag}
                onClick={() => setActiveTag(tag)}
                onDragStart={(e) => handleTagDragStart(e, index)}
                onDragEnd={handleTagDragEnd}
                onDragOver={(e) => handleTagDragOver(e, index)}
                onDragLeave={handleTagDragLeave}
                onDrop={(e) => handleTagDrop(e, index)}
                className={`${styles.tag} ${activeTag === tag ? styles.active : ''} ${isEditMode ? styles.tagDraggable : ''} ${tagDragOverIndex === index ? styles.tagDragOver : ''}`}
              >
                {tag}
              </button>
            ))}

            {/* 水滴吸附指示器 */}
            <div 
              className={styles.tagIndicator}
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          </div>
        </div>

        {/* Sites */}
        <div className={styles.sitesList}>
          {filteredSites.map((site, index) => (
            <div
              key={site.id}
              draggable={isEditMode}
              onDragStart={(e) => handleSiteDragStart(e, index)}
              onDragOver={(e) => handleSiteDragOver(e, index)}
              onDragLeave={handleSiteDragLeave}
              onDrop={(e) => handleSiteDrop(e, index)}
              onDragEnd={handleSiteDragEnd}
              className={isEditMode ? styles.draggable : ''}
            >
              <SiteCard
                site={site}
                isEditMode={isEditMode}
                onEdit={() => onEditSite(category.id, site)}
                onDelete={() => onDeleteSite(category.id, site.id)}
                onContextMenu={onSiteContextMenu}
                siteStatusEnabled={siteStatusEnabled}
                dragOver={siteDragOverIndex === index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

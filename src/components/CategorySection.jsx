import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
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
  categoryIndex,
  allCategories,
  onSiteContextMenu,
  siteStatusEnabled
}) {
  const [activeTag, setActiveTag] = useState('全部')
  const tagContainerRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

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

  // ========== 分类拖拽排序 ==========
  const handleCatDragStart = (e) => {
    if (!isEditMode) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'category',
      fromIndex: categoryIndex
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCatDragOver = (e) => {
    if (!isEditMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleCatDrop = (e) => {
    e.preventDefault()
    if (!isEditMode) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'category' && data.fromIndex !== categoryIndex) {
        const newCats = [...allCategories]
        const [moved] = newCats.splice(data.fromIndex, 1)
        newCats.splice(categoryIndex, 0, moved)
        onReorderCategories(newCats)
      }
    } catch (err) {
      console.log('Drop error:', err)
    }
  }

  // ========== 子分类标签拖拽排序 ==========
  const handleTagDragStart = (e, tagIndex) => {
    if (!isEditMode) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'tag',
      categoryId: category.id,
      fromIndex: tagIndex
    }))
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handleTagDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  const handleTagDragOver = (e) => {
    if (!isEditMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleTagDrop = (e, toIndex) => {
    e.preventDefault()
    if (!isEditMode) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'tag' && data.categoryId === category.id && data.fromIndex !== toIndex) {
        const newTags = [...tagNames]
        const [moved] = newTags.splice(data.fromIndex, 1)
        newTags.splice(toIndex, 0, moved)
        onReorderTags(category.id, newTags)
      }
    } catch (err) {
      console.log('Tag drop error:', err)
    }
  }

  // ========== 网站拖拽排序 ==========
  const handleSiteDragStart = (e, siteIndex) => {
    if (!isEditMode) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'site',
      categoryId: category.id,
      fromIndex: siteIndex
    }))
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handleSiteDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  const handleSiteDragOver = (e) => {
    if (!isEditMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleSiteDrop = (e, toIndex) => {
    e.preventDefault()
    if (!isEditMode) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'site' && data.categoryId === category.id && data.fromIndex !== toIndex) {
        const newSites = [...category.sites]
        const [moved] = newSites.splice(data.fromIndex, 1)
        newSites.splice(toIndex, 0, moved)
        onReorderSites(category.id, newSites)
      }
    } catch (err) {
      console.log('Site drop error:', err)
    }
  }

  return (
    <section 
      className={styles.section}
      onDragOver={handleCatDragOver}
      onDrop={handleCatDrop}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div 
            className={styles.titleWrapper}
            draggable={isEditMode}
            onDragStart={handleCatDragStart}
          >
            {isEditMode && (
              <div className={styles.catDragHandle}>
                <GripVertical size={16} />
              </div>
            )}
            <div className={styles.titleIcon}>
              {category.name.charAt(0)}
            </div>
            <h2 className={styles.title}>{category.name}</h2>
            <span className={styles.count}>{category.sites.length}</span>
          </div>
          
          {isEditMode && (
            <div className={styles.actions}>
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
                onDragOver={handleTagDragOver}
                onDrop={(e) => handleTagDrop(e, index)}
                className={`${styles.tag} ${activeTag === tag ? styles.active : ''} ${isEditMode ? styles.tagDraggable : ''}`}
              >
                {isEditMode && <GripVertical size={10} className={styles.tagDragIcon} />}
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
              onDragEnd={handleSiteDragEnd}
              onDragOver={handleSiteDragOver}
              onDrop={(e) => handleSiteDrop(e, index)}
              className={isEditMode ? styles.draggable : ''}
            >
              <SiteCard
                site={site}
                isEditMode={isEditMode}
                onEdit={() => onEditSite(category.id, site)}
                onDelete={() => onDeleteSite(category.id, site.id)}
                onContextMenu={onSiteContextMenu}
                siteStatusEnabled={siteStatusEnabled}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

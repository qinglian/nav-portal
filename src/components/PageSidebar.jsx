import { useState, useRef, useEffect } from 'react'
import { Home, FileText, Plus, X, Pencil, GripVertical } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import styles from './PageSidebar.module.css'

const ICON_MAP = {
  Home,
  FileText,
}

export default function PageSidebar({
  pages,
  currentPageId,
  onPageChange,
  onAddPage,
  onEditPage,
  onDeletePage,
  onReorderPages,
}) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPage, setEditingPage] = useState(null)
  const [editName, setEditName] = useState('')
  const [displayPages, setDisplayPages] = useState(pages)
  const dragItemIndex = useRef(null)
  const sidebarRef = useRef(null)

  useEffect(() => {
    setDisplayPages(pages)
  }, [pages])

  // 鼠标移入左侧边缘展开
  const handleMouseEnter = () => setIsExpanded(true)
  const handleMouseLeave = () => {
    setIsExpanded(false)
    setEditingPage(null)
  }

  // 点击外部收起
  useEffect(() => {
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const getIcon = (iconName) => {
    const Icon = ICON_MAP[iconName] || Home
    return <Icon size={18} />
  }

  // 拖拽排序 - 实时预览（不跳变）
  const handleDragStart = (index) => {
    dragItemIndex.current = index
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragItemIndex.current === null) return
    if (dragItemIndex.current === index) return

    // 实时交换位置，不跳变
    const newPages = [...displayPages]
    const [moved] = newPages.splice(dragItemIndex.current, 1)
    newPages.splice(index, 0, moved)
    dragItemIndex.current = index
    setDisplayPages(newPages)
  }

  const handleDrop = () => {
    onReorderPages(displayPages)
    dragItemIndex.current = null
  }

  const handleDragEnd = () => {
    dragItemIndex.current = null
    setDisplayPages(pages)
  }

  const handleEditSubmit = (pageId) => {
    if (editName.trim()) {
      onEditPage(pageId, { name: editName.trim() })
    }
    setEditingPage(null)
    setEditName('')
  }

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 触发区域 */}
      <div className={styles.trigger} />

      {/* 菜单内容 */}
      <div className={styles.content}>
        {/* 顶部编辑小圆钮 */}
        <div className={styles.topActions}>
          <button
            className={`${styles.editToggleBtn} ${isEditMode ? styles.editToggleActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsEditMode(!isEditMode)
              setEditingPage(null)
            }}
            title={isEditMode ? '完成' : '编辑页面'}
          >
            <Pencil size={14} />
          </button>
        </div>

        <div className={styles.pageList}>
          {displayPages.map((page, index) => {
            const isDragging = dragItemIndex.current === index

            return (
              <div
                key={page.id}
                className={`${styles.pageItem} ${page.id === currentPageId ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
                onClick={() => {
                  if (dragItemIndex.current === null) onPageChange(page.id)
                }}
                draggable={isEditMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              >
                {isEditMode && (
                  <div className={styles.dragHandle}>
                    <GripVertical size={14} />
                  </div>
                )}
                <div className={styles.pageIcon}>{getIcon(page.icon)}</div>
                {editingPage === page.id ? (
                  <input
                    className={styles.editInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleEditSubmit(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(page.id)
                      if (e.key === 'Escape') {
                        setEditingPage(null)
                        setEditName('')
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={styles.pageName}>{page.name}</span>
                )}
                {isEditMode && editingPage !== page.id && (
                  <>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingPage(page.id)
                        setEditName(page.name)
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    {page.id !== 'default' && (
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('确定要删除这个页面吗？')) {
                            onDeletePage(page.id)
                          }
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {isEditMode && (
          <button
            className={styles.addBtn}
            onClick={() => {
              const name = prompt('请输入页面名称：')
              if (name?.trim()) {
                onAddPage(name.trim())
              }
            }}
          >
            <Plus size={16} />
            <span>添加页面</span>
          </button>
        )}
      </div>
    </div>
  )
}

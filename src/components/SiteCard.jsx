import { useState, useEffect } from 'react'
import { ExternalLink, Trash2, Edit2, GripVertical } from 'lucide-react'
import styles from './SiteCard.module.css'

// 自动获取网站图标
function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url)
    // 使用 Google 的 favicon 服务
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return null
  }
}

// 从 URL 生成颜色
function generateColor(url) {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  return `hsl(${h}, 70%, 55%)`
}

export default function SiteCard({ site, isEditMode, onEdit, onDelete }) {
  const [iconError, setIconError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const faviconUrl = getFaviconUrl(site.url)
  const fallbackColor = generateColor(site.url)

  const handleClick = () => {
    if (!isEditMode) {
      window.open(site.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={`${styles.card} ${isEditMode ? styles.editMode : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-accent': fallbackColor }}
    >
      {/* Edit Mode Handle */}
      {isEditMode && (
        <div className={styles.dragHandle}>
          <GripVertical size={16} />
        </div>
      )}

      {/* Icon */}
      <div className={styles.iconWrapper}>
        {faviconUrl && !iconError ? (
          <img
            src={faviconUrl}
            alt={site.name}
            className={styles.icon}
            onError={() => setIconError(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.fallbackIcon}>
            {site.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.name}>{site.name}</h3>
        <p className={styles.description}>{site.description}</p>
      </div>

      {/* External Link Indicator */}
      {!isEditMode && isHovered && (
        <div className={styles.externalIndicator}>
          <ExternalLink size={14} />
        </div>
      )}

      {/* Edit Actions */}
      {isEditMode && (
        <div className={styles.actions}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={styles.actionBtn}
            title="编辑"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`${styles.actionBtn} ${styles.delete}`}
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Hover Glow Effect */}
      <div className={styles.glow} />
    </div>
  )
}

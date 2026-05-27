import { useState } from 'react'
import { Edit2, Trash2, GripVertical } from 'lucide-react'
import styles from './SiteCard.module.css'

function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return null
  }
}

function generateColor(url) {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  return `hsl(${h}, 70%, 55%)`
}

export default function SiteCard({ site, isEditMode, onEdit, onDelete, dragHandleProps }) {
  const [iconError, setIconError] = useState(false)
  const faviconUrl = getFaviconUrl(site.url)
  const fallbackColor = generateColor(site.url)

  const handleClick = () => {
    if (!isEditMode) {
      window.open(site.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={styles.card} onClick={handleClick}>
      {isEditMode && (
        <div className={styles.dragHandle} {...dragHandleProps}>
          <GripVertical size={12} />
        </div>
      )}

      <div className={styles.iconWrapper} style={{ background: fallbackColor }}>
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

      <div className={styles.content}>
        <h3 className={styles.name}>{site.name}</h3>
      </div>

      {isEditMode && (
        <div className={styles.actions}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={styles.actionBtn}>
            <Edit2 size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Edit2, Trash2, GripVertical, Wifi, WifiOff } from 'lucide-react'
import { checkSiteStatus } from '../utils/siteStatus'
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

export default function SiteCard({ site, isEditMode, onEdit, onDelete, dragHandleProps, onContextMenu }) {
  const [iconError, setIconError] = useState(false)
  const [siteStatus, setSiteStatus] = useState(null) // null = 检测中, true = 在线, false = 离线
  const [showStatus, setShowStatus] = useState(false)
  const cardRef = useRef(null)
  const faviconUrl = getFaviconUrl(site.url)
  const fallbackColor = generateColor(site.url)

  // 检测网站状态
  useEffect(() => {
    let mounted = true
    const detect = async () => {
      const status = await checkSiteStatus(site.url)
      if (mounted) {
        setSiteStatus(status.online)
        setShowStatus(true)
      }
    }
    detect()
    return () => { mounted = false }
  }, [site.url])

  const handleClick = () => {
    if (!isEditMode) {
      window.open(site.url, '_blank', 'noopener,noreferrer')
    }
  }

  // 右键事件
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const handleContextMenu = (e) => {
      e.preventDefault()
      e.stopPropagation()
      onContextMenu && onContextMenu(e, site)
    }
    card.addEventListener('contextmenu', handleContextMenu)
    return () => card.removeEventListener('contextmenu', handleContextMenu)
  }, [site, onContextMenu])

  const isOffline = siteStatus === false

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isOffline ? styles.cardOffline : ''}`}
      data-site-card="true"
      onClick={handleClick}
      title={isOffline ? '该网站暂时无法访问' : site.url}
    >
      {/* 状态指示器 */}
      {showStatus && (
        <div className={`${styles.statusIndicator} ${isOffline ? styles.statusOffline : styles.statusOnline}`}>
          {isOffline ? <WifiOff size={10} /> : <Wifi size={10} />}
        </div>
      )}

      {isEditMode && (
        <div className={styles.dragHandle} {...dragHandleProps}>
          <GripVertical size={12} />
        </div>
      )}

      <div className={`${styles.iconWrapper} ${isOffline ? styles.iconWrapperOffline : ''}`} style={{ background: fallbackColor }}>
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
        <h3 className={`${styles.name} ${isOffline ? styles.nameOffline : ''}`}>{site.name}</h3>
        {site.description && <p className={styles.description}>{site.description}</p>}
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

import { useState, useEffect, useRef, useCallback } from 'react'
import { Edit2, Trash2, GripVertical, QrCode, X } from 'lucide-react'
import QRCode from 'qrcode'
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
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const cardRef = useRef(null)
  const faviconUrl = getFaviconUrl(site.url)
  const fallbackColor = generateColor(site.url)

  const handleClick = () => {
    if (!isEditMode) {
      window.open(site.url, '_blank', 'noopener,noreferrer')
    }
  }

  // 右键菜单 - 使用原生事件确保在捕获阶段处理
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleContextMenu = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenuPos({ x: e.clientX, y: e.clientY })
      setShowContextMenu(true)
    }

    // 使用捕获阶段，确保在全局监听器之前执行
    card.addEventListener('contextmenu', handleContextMenu, true)
    return () => card.removeEventListener('contextmenu', handleContextMenu, true)
  }, [])

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      // 如果点击的是右键菜单本身，不关闭
      if (e.target.closest(`.${styles.contextMenu}`)) return
      setShowContextMenu(false)
    }
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside, true)
      return () => document.removeEventListener('click', handleClickOutside, true)
    }
  }, [showContextMenu])

  // 生成二维码
  const generateQR = useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(site.url, {
        width: 240,
        margin: 2,
        color: {
          dark: '#333',
          light: '#fff'
        }
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error('QR生成失败:', err)
    }
  }, [site.url])

  const handleShowQR = () => {
    setShowContextMenu(false)
    setShowQRModal(true)
    generateQR()
  }

  const closeQRModal = () => {
    setShowQRModal(false)
    setQrDataUrl('')
  }

  return (
    <>
      <div
        ref={cardRef}
        className={styles.card}
        data-site-card="true"
        onClick={handleClick}
      >
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

      {/* 右键菜单 */}
      {showContextMenu && (
        <div
          className={styles.contextMenu}
          style={{
            left: contextMenuPos.x,
            top: contextMenuPos.y
          }}
        >
          <button className={styles.contextMenuItem} onClick={handleShowQR}>
            <QrCode size={14} />
            <span>二维码分享</span>
          </button>
        </div>
      )}

      {/* 二维码弹窗 */}
      {showQRModal && (
        <div className={styles.qrModalOverlay} onClick={closeQRModal}>
          <div className={styles.qrModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.qrModalClose} onClick={closeQRModal}>
              <X size={18} />
            </button>
            <h3 className={styles.qrModalTitle}>{site.name}</h3>
            <p className={styles.qrModalUrl}>{site.url}</p>
            <div className={styles.qrCodeWrapper}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="二维码" className={styles.qrCodeImage} />
              ) : (
                <div className={styles.qrCodeLoading}>生成中...</div>
              )}
            </div>
            <p className={styles.qrModalHint}>手机扫码即可访问</p>
          </div>
        </div>
      )}
    </>
  )
}

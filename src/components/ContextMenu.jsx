import { useEffect, useRef, useState } from 'react'
import { QrCode, Pin, PinOff } from 'lucide-react'
import { isPinned } from '../utils/quickAccess'
import styles from './ContextMenu.module.css'

// 全局右键菜单组件 - 使用 createPortal 挂载到 body
export default function ContextMenu({ visible, x, y, site, onAction, onClose }) {
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (site) {
      setPinned(isPinned(site.url))
    }
  }, [site])
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ x, y })

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [visible, onClose])

  // 边界检测
  useEffect(() => {
    if (!visible || !menuRef.current) {
      setPosition({ x, y })
      return
    }
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let newX = x
    let newY = y
    if (x + rect.width > vw - 10) newX = vw - rect.width - 10
    if (y + rect.height > vh - 10) newY = vh - rect.height - 10
    if (newX < 10) newX = 10
    if (newY < 10) newY = 10
    setPosition({ x: newX, y: newY })
  }, [visible, x, y])

  if (!visible || !site) return null

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: position.x, top: position.y }}
    >
      <button className={styles.contextMenuItem} onClick={() => onAction('pin')}>
        {pinned ? <PinOff size={14} /> : <Pin size={14} />}
        <span>{pinned ? '取消置顶' : '置顶到快捷入口'}</span>
      </button>
      <button className={styles.contextMenuItem} onClick={() => onAction('qr')}>
        <QrCode size={14} />
        <span>二维码分享</span>
      </button>
    </div>
  )
}

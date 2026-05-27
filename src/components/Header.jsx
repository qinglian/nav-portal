import { Search, Moon, Sun, Image, Edit3, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import styles from './Header.module.css'

export default function Header({ isEditMode, onToggleEdit, searchQuery, onSearch, onToggleBgMode }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Left - Logo */}
        <a href="/" className={styles.logo}>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>清炼导航</span>
            <span className={styles.logoUrl}>QingLian</span>
          </div>
        </a>

        {/* Center - Internal Site Search */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="搜索已添加的网站..."
            className={styles.searchInput}
          />
        </div>

        {/* Right - Actions */}
        <div className={styles.actions}>
          <button 
            className={`${styles.editBtn} ${isEditMode ? styles.active : ''}`}
            onClick={onToggleEdit}
          >
            {isEditMode ? <Check size={14} /> : <Edit3 size={14} />}
            <span>{isEditMode ? '完成' : '编辑'}</span>
          </button>
          <button className={styles.iconBtn} onClick={onToggleBgMode} title="切换背景">
            <Image size={16} />
          </button>
          <button className={styles.iconBtn} onClick={toggleTheme} title="切换主题">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}

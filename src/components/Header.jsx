import { Sun, Moon, Menu, X, Edit3, RotateCcw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { useState } from 'react'
import styles from './Header.module.css'

export default function Header({ onToggleEdit, isEditMode }) {
  const { theme, toggleTheme } = useTheme()
  const { resetData } = useData()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <a href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
              <path d="M10 22V10h4l4 6 4-6h4v12h-4v-6l-4 6-4-6v6h-4z" fill="white" />
            </svg>
          </div>
          <span className={styles.logoText}>导航门户</span>
        </a>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          {/* Edit Mode Toggle */}
          <button
            onClick={onToggleEdit}
            className={`${styles.actionBtn} ${isEditMode ? styles.active : ''}`}
            title={isEditMode ? '退出编辑模式' : '进入编辑模式'}
          >
            <Edit3 size={18} />
            <span>{isEditMode ? '完成' : '编辑'}</span>
          </button>

          {/* Reset Button */}
          {isEditMode && (
            <button
              onClick={resetData}
              className={styles.actionBtn}
              title="重置数据"
            >
              <RotateCcw size={18} />
              <span>重置</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={styles.themeBtn}
            title={theme === 'light' ? '切换到夜间模式' : '切换到日间模式'}
          >
            <div className={styles.themeIconWrapper}>
              <Sun size={18} className={`${styles.themeIcon} ${theme === 'light' ? styles.visible : ''}`} />
              <Moon size={18} className={`${styles.themeIcon} ${theme === 'dark' ? styles.visible : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={styles.menuBtn}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <button
            onClick={() => { onToggleEdit(); setIsMenuOpen(false); }}
            className={styles.mobileMenuItem}
          >
            <Edit3 size={18} />
            <span>{isEditMode ? '完成编辑' : '编辑模式'}</span>
          </button>
          <button
            onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
            className={styles.mobileMenuItem}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? '夜间模式' : '日间模式'}</span>
          </button>
        </div>
      )}
    </header>
  )
}

import { Search, Moon, Sun, Image, Edit3, Check, Sparkles, Settings2, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import DataManager from './DataManager'
import styles from './Header.module.css'

export default function Header({ isEditMode, onToggleEdit, searchQuery, onSearch, onToggleBgMode, animatedBg, onToggleAnimatedBg, onOpenEffectPicker, onLogoClick, siteStatusEnabled, onToggleSiteStatus }) {
  const { theme, toggleTheme } = useTheme()
  const [showSiteConfig, setShowSiteConfig] = useState(false)

  // 当编辑模式关闭时，自动关闭网站配置菜单
  useEffect(() => {
    if (!isEditMode) {
      setShowSiteConfig(false)
    }
  }, [isEditMode])

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Left - Logo */}
        <a href="javascript:void(0)" className={styles.logo} onClick={(e) => { e.preventDefault(); onLogoClick && onLogoClick() }}>
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
          <DataManager isEditMode={isEditMode} />
          
          {isEditMode && (
            <div className={styles.siteConfigWrapper}>
              <button
                className={styles.siteConfigBtn}
                onClick={(e) => { e.stopPropagation(); setShowSiteConfig(!showSiteConfig) }}
              >
                <Settings2 size={14} />
                <span>网站配置</span>
              </button>
              
              {showSiteConfig && (
                <div className={styles.siteConfigMenu}>
                  <div className={styles.configTitle}>网站配置</div>
                  
                  <label className={styles.configRow}>
                    <div className={styles.configLabel}>
                      <Activity size={14} />
                      <div>
                        <span className={styles.configName}>网站状态检测</span>
                        <span className={styles.configDesc}>自动检测网站是否可访问</span>
                      </div>
                    </div>
                    <button
                      className={`${styles.configToggle} ${siteStatusEnabled ? styles.configToggleOn : ''}`}
                      onClick={() => onToggleSiteStatus && onToggleSiteStatus()}
                    >
                      <span className={styles.configToggleThumb} />
                    </button>
                  </label>
                </div>
              )}
            </div>
          )}

          <button 
            className={`${styles.editBtn} ${isEditMode ? styles.active : ''}`}
            onClick={onToggleEdit}
          >
            {isEditMode ? <Check size={14} /> : <Edit3 size={14} />}
            <span>{isEditMode ? '完成' : '编辑'}</span>
          </button>
          <button
            className={`${styles.iconBtn} ${animatedBg ? styles.active : ''}`}
            onClick={onOpenEffectPicker}
            title="动效背景"
          >
            <Sparkles size={16} />
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

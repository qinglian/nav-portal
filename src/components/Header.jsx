import { Search, Moon, Sun, Image, Edit3, Check, Settings, ChevronDown, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import styles from './Header.module.css'

export default function Header({ isEditMode, onToggleEdit, searchQuery, onSearch, onToggleBgMode, animatedBg, onToggleAnimatedBg, onOpenEffectPicker }) {
  const { theme, toggleTheme } = useTheme()
  const { data } = useData()
  const [showDataMenu, setShowDataMenu] = useState(false)
  const fileInputRef = useRef(null)

  // 导出配置
  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      data: data,
      searchEngines: JSON.parse(localStorage.getItem('nav-search-engines') || 'null'),
      currentEngine: localStorage.getItem('nav-current-engine') || 'bing',
      theme: localStorage.getItem('nav-theme') || 'light',
      bgMode: localStorage.getItem('nav-bg-mode') || 'default'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `清炼导航_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowDataMenu(false)
  }

  // 导入配置
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result)
        
        if (!imported.data || !imported.data.categories) {
          alert('配置文件格式不正确')
          return
        }

        localStorage.setItem('nav-data-v2', JSON.stringify(imported.data))
        
        if (imported.searchEngines) {
          localStorage.setItem('nav-search-engines', JSON.stringify(imported.searchEngines))
        }
        
        if (imported.currentEngine) {
          localStorage.setItem('nav-current-engine', imported.currentEngine)
        }
        
        setShowDataMenu(false)
        
        if (confirm('配置导入成功！页面将刷新以应用新配置。')) {
          window.location.reload()
        }
      } catch (err) {
        alert('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

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
          {isEditMode && (
            <div className={styles.dataManager}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button 
                className={styles.dataBtn}
                onClick={() => setShowDataMenu(!showDataMenu)}
              >
                <Settings size={14} />
                <span>数据</span>
                <ChevronDown size={12} className={showDataMenu ? styles.rotated : ''} />
              </button>
              
              {showDataMenu && (
                <div className={styles.dataMenu}>
                  <button className={styles.dataMenuItem} onClick={handleExport}>
                    <span className={styles.dataMenuLabel}>导出配置</span>
                    <span className={styles.dataMenuDesc}>下载当前所有数据</span>
                  </button>
                  <button className={styles.dataMenuItem} onClick={handleImportClick}>
                    <span className={styles.dataMenuLabel}>导入配置</span>
                    <span className={styles.dataMenuDesc}>从文件恢复数据</span>
                  </button>
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
            onClick={animatedBg ? onOpenEffectPicker : onToggleAnimatedBg}
            title={animatedBg ? "切换动效" : "开启动效背景"}
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

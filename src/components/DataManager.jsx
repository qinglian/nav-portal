import { useRef, useState } from 'react'
import { Download, Upload, Settings, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { useData } from '../context/DataContext'
import styles from './DataManager.module.css'

export default function DataManager({ isEditMode }) {
  const { data, resetData } = useData()
  const fileInputRef = useRef(null)
  const [showMenu, setShowMenu] = useState(false)

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
    setShowMenu(false)
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

        // 导入数据
        localStorage.setItem('nav-data-v2', JSON.stringify(imported.data))
        
        // 导入搜索引擎配置
        if (imported.searchEngines) {
          localStorage.setItem('nav-search-engines', JSON.stringify(imported.searchEngines))
        }
        
        // 导入其他设置
        if (imported.currentEngine) {
          localStorage.setItem('nav-current-engine', imported.currentEngine)
        }
        
        setShowMenu(false)
        
        // 刷新页面应用配置
        if (confirm('配置导入成功！页面将刷新以应用新配置。')) {
          window.location.reload()
        }
      } catch (err) {
        alert('导入失败：文件格式错误')
        console.error('Import error:', err)
      }
    }
    reader.readAsText(file)
    
    // 清空 input，允许重复选择同一文件
    e.target.value = ''
  }

  // 点击外部关闭菜单
  const handleClickOutside = (e) => {
    if (!e.target.closest(`.${styles.container}`)) {
      setShowMenu(false)
    }
  }

  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {isEditMode && (
        <div className={styles.container}>
          <button 
            className={styles.menuBtn}
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          >
            <Settings size={14} />
            <span>数据</span>
            <ChevronDown size={12} className={showMenu ? styles.rotated : ''} />
          </button>
          
          {showMenu && (
            <div className={styles.menu}>
              <div className={styles.menuTitle}>数据管理</div>
              
              <button className={styles.menuItem} onClick={handleExport}>
                <Download size={15} />
                <div className={styles.menuItemText}>
                  <span className={styles.menuItemLabel}>导出配置</span>
                  <span className={styles.menuItemDesc}>下载当前所有数据</span>
                </div>
              </button>
              
              <button className={styles.menuItem} onClick={handleImportClick}>
                <Upload size={15} />
                <div className={styles.menuItemText}>
                  <span className={styles.menuItemLabel}>导入配置</span>
                  <span className={styles.menuItemDesc}>从文件恢复数据</span>
                </div>
              </button>
              
              <div className={styles.menuDivider} />
              
              <div className={styles.menuFooter}>
                <AlertCircle size={12} />
                <span>导入将覆盖现有数据</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

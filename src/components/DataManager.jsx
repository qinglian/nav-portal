import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { useData } from '../context/DataContext'
import styles from './DataManager.module.css'

export default function DataManager({ isEditMode }) {
  const { data, resetData } = useData()
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
    link.download = `清炼导航配置_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleExport}
            title="导出配置"
          >
            <Download size={14} />
            <span>导出</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleImportClick}
            title="导入配置"
          >
            <Upload size={14} />
            <span>导入</span>
          </button>
        </div>
      )}
    </>
  )
}

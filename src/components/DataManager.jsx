import { useRef, useState, useEffect } from 'react'
import { Download, Upload, Settings, ChevronDown, AlertCircle, Cloud, RefreshCw } from 'lucide-react'
import { useData } from '../context/DataContext'
import WebDAVClient, { getWebDAVConfig, saveWebDAVConfig, clearWebDAVConfig } from '../utils/webdav'
import styles from './DataManager.module.css'

export default function DataManager({ isEditMode }) {
  const { data, resetData } = useData()
  const fileInputRef = useRef(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showCloudPanel, setShowCloudPanel] = useState(false)

  // 云备份状态
  const [cloudUsername, setCloudUsername] = useState('')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudConnected, setCloudConnected] = useState(false)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudMsg, setCloudMsg] = useState('')
  const [cloudMsgType, setCloudMsgType] = useState('')
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('nav-auto-backup') === 'true')

  // 初始化检查云备份配置
  useEffect(() => {
    const config = getWebDAVConfig()
    if (config) {
      setCloudUsername(config.username)
      setCloudConnected(true)
    }
  }, [])

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

        localStorage.setItem('nav-data-v2', JSON.stringify(imported.data))
        
        if (imported.searchEngines) {
          localStorage.setItem('nav-search-engines', JSON.stringify(imported.searchEngines))
        }
        
        if (imported.currentEngine) {
          localStorage.setItem('nav-current-engine', imported.currentEngine)
        }
        
        setShowMenu(false)
        
        if (confirm('配置导入成功！页面将刷新以应用新配置。')) {
          window.location.reload()
        }
      } catch (err) {
        alert('导入失败：文件格式错误')
        console.error('Import error:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // 云备份：连接
  const handleCloudConnect = async () => {
    if (!cloudUsername || !cloudPassword) {
      showCloudMsg('请填写账号和密码', 'error')
      return
    }
    setCloudLoading(true)
    try {
      const client = new WebDAVClient(cloudUsername, cloudPassword)
      const ok = await client.testConnection()
      if (ok) {
        saveWebDAVConfig({ username: cloudUsername, password: cloudPassword })
        setCloudConnected(true)
        showCloudMsg('连接成功！')
      } else {
        showCloudMsg('连接失败，请检查账号密码', 'error')
      }
    } catch (err) {
      showCloudMsg('连接失败: ' + err.message, 'error')
    }
    setCloudLoading(false)
  }

  // 云备份：立即备份
  const handleCloudBackup = async () => {
    const config = getWebDAVConfig()
    if (!config) return
    setCloudLoading(true)
    try {
      const client = new WebDAVClient(config.username, config.password)
      const localData = localStorage.getItem('nav-data-v2')
      if (!localData) {
        showCloudMsg('没有数据需要备份', 'error')
        setCloudLoading(false)
        return
      }
      const result = await client.backup(JSON.parse(localData))
      showCloudMsg(result.success ? '云端备份成功！' : '备份失败: ' + result.error, result.success ? 'success' : 'error')
    } catch (err) {
      showCloudMsg('备份失败: ' + err.message, 'error')
    }
    setCloudLoading(false)
  }

  // 云备份：恢复
  const handleCloudRestore = async () => {
    const config = getWebDAVConfig()
    if (!config) return
    if (!confirm('从云端恢复将覆盖当前所有数据，确定继续吗？')) return
    setCloudLoading(true)
    try {
      const client = new WebDAVClient(config.username, config.password)
      const result = await client.restore()
      if (result.success) {
        localStorage.setItem('nav-data-v2', JSON.stringify(result.data))
        showCloudMsg('恢复成功！页面将刷新...')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        showCloudMsg('恢复失败: ' + result.error, 'error')
      }
    } catch (err) {
      showCloudMsg('恢复失败: ' + err.message, 'error')
    }
    setCloudLoading(false)
  }

  // 云备份：断开
  const handleCloudDisconnect = () => {
    clearWebDAVConfig()
    setCloudConnected(false)
    setCloudUsername('')
    setCloudPassword('')
    showCloudMsg('已断开云端连接')
  }

  // 云备份：自动备份开关
  const toggleAutoBackup = () => {
    const newVal = !autoBackup
    setAutoBackup(newVal)
    localStorage.setItem('nav-auto-backup', newVal.toString())
    showCloudMsg(newVal ? '已开启自动备份' : '已关闭自动备份')
  }

  const showCloudMsg = (msg, type = 'success') => {
    setCloudMsg(msg)
    setCloudMsgType(type)
    setTimeout(() => setCloudMsg(''), 3000)
  }

  // 点击外部关闭菜单
  const handleClickOutside = (e) => {
    if (!e.target.closest(`.${styles.container}`)) {
      setShowMenu(false)
      setShowCloudPanel(false)
    }
  }

  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
    if (showMenu || showCloudPanel) {
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
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowCloudPanel(false) }}
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

              {/* 云备份入口 */}
              <button 
                className={`${styles.menuItem} ${styles.cloudItem}`}
                onClick={(e) => { e.stopPropagation(); setShowCloudPanel(!showCloudPanel); setShowMenu(false) }}
              >
                <Cloud size={15} className={cloudConnected ? styles.cloudConnected : ''} />
                <div className={styles.menuItemText}>
                  <span className={styles.menuItemLabel}>
                    坚果云备份
                    {cloudConnected && <span className={styles.cloudBadge}>已连接</span>}
                  </span>
                  <span className={styles.menuItemDesc}>
                    {cloudConnected ? '点击管理云端备份' : '连接坚果云同步数据'}
                  </span>
                </div>
              </button>

              <div className={styles.menuDivider} />
              
              <div className={styles.menuFooter}>
                <AlertCircle size={12} />
                <span>导入将覆盖现有数据</span>
              </div>
            </div>
          )}

          {/* 云备份面板 */}
          {showCloudPanel && (
            <div className={styles.cloudPanel}>
              <div className={styles.cloudPanelHeader}>
                <Cloud size={16} />
                <span>坚果云备份</span>
              </div>

              {cloudMsg && (
                <div className={`${styles.cloudMsg} ${styles[cloudMsgType]}`}>
                  {cloudMsg}
                </div>
              )}

              {!cloudConnected ? (
                <>
                  <div className={styles.cloudInputGroup}>
                    <label>坚果云账号</label>
                    <input
                      type="text"
                      value={cloudUsername}
                      onChange={(e) => setCloudUsername(e.target.value)}
                      placeholder="邮箱或手机号"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.cloudInputGroup}>
                    <label>应用密码</label>
                    <input
                      type="password"
                      value={cloudPassword}
                      onChange={(e) => setCloudPassword(e.target.value)}
                      placeholder="安全选项中生成"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <p className={styles.cloudHelp}>
                    💡 坚果云官网 → 账户信息 → 安全选项 → 添加应用密码
                  </p>
                  <button
                    className={styles.cloudConnectBtn}
                    onClick={(e) => { e.stopPropagation(); handleCloudConnect() }}
                    disabled={cloudLoading}
                  >
                    {cloudLoading ? <RefreshCw size={14} className={styles.spin} /> : <Cloud size={14} />}
                    {cloudLoading ? '连接中...' : '连接坚果云'}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.cloudStatus}>
                    <span className={styles.cloudStatusDot} />
                    已连接: {cloudUsername}
                  </div>

                  <div className={styles.cloudActions}>
                    <button
                      className={styles.cloudActionBtn}
                      onClick={(e) => { e.stopPropagation(); handleCloudBackup() }}
                      disabled={cloudLoading}
                    >
                      <Upload size={14} />
                      立即备份
                    </button>
                    <button
                      className={styles.cloudActionBtn}
                      onClick={(e) => { e.stopPropagation(); handleCloudRestore() }}
                      disabled={cloudLoading}
                    >
                      <Download size={14} />
                      恢复数据
                    </button>
                  </div>

                  <label className={styles.cloudToggleRow} onClick={(e) => e.stopPropagation()}>
                    <span>自动备份</span>
                    <button
                      className={`${styles.cloudToggle} ${autoBackup ? styles.cloudToggleOn : ''}`}
                      onClick={toggleAutoBackup}
                    >
                      <span className={styles.cloudToggleThumb} />
                    </button>
                  </label>

                  <button
                    className={styles.cloudDisconnectBtn}
                    onClick={(e) => { e.stopPropagation(); handleCloudDisconnect() }}
                  >
                    断开连接
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

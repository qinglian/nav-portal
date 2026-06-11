import { Search, Moon, Sun, Image, Edit3, Check, Sparkles, Settings2, Activity, MapPin, Search as SearchIcon, Zap, Lock, Type } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import DataManager from './DataManager'
import { getSavedCity, saveCity as saveWeatherCity, searchCity, getWeatherEnabled, saveWeatherEnabled } from '../utils/weather'
import { getQuickAccessEnabled, saveQuickAccessEnabled } from '../utils/quickAccess'
import { getSafeBoxEnabled, saveSafeBoxEnabled, clearSafeBoxPassword, getSafeBoxPassword, saveSafeBoxPassword } from '../utils/safeBox'
import styles from './Header.module.css'

export default function Header({ isEditMode, onToggleEdit, searchQuery, onSearch, onToggleBgMode, animatedBg, onToggleAnimatedBg, onOpenEffectPicker, onLogoClick, siteStatusEnabled, onToggleSiteStatus, siteTitle, siteSubtitle, onUpdateSiteTitle, onUpdateSiteSubtitle }) {
  const { theme, toggleTheme } = useTheme()
  const [showSiteConfig, setShowSiteConfig] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [currentCity, setCurrentCity] = useState('')
  const [weatherEnabled, setWeatherEnabled] = useState(() => getWeatherEnabled())
  const [quickAccessEnabled, setQuickAccessEnabled] = useState(() => getQuickAccessEnabled())
  const [safeBoxEnabled, setSafeBoxEnabled] = useState(() => getSafeBoxEnabled())
  const [safeBoxPasswordInput, setSafeBoxPasswordInput] = useState('')
  const [safeBoxSettingUp, setSafeBoxSettingUp] = useState(false)
  const [showTitleSubmenu, setShowTitleSubmenu] = useState(false)
  const [pageTitle, setPageTitle] = useState(() => document.title)
  const [actionsFixedPos, setActionsFixedPos] = useState(null)
  const [actionsWidth, setActionsWidth] = useState(0)
  const actionsRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // 编辑模式下获取按钮原始位置、宽度并固定悬浮
  useEffect(() => {
    if (isEditMode && actionsRef.current) {
      const rect = actionsRef.current.getBoundingClientRect()
      setActionsFixedPos({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      })
      setActionsWidth(rect.width - 12) // 缩小间隙
    } else {
      setActionsFixedPos(null)
      setActionsWidth(0)
    }
  }, [isEditMode])

  // 监听保险箱弹窗内关闭/开启事件
  useEffect(() => {
    const handler = () => setSafeBoxEnabled(getSafeBoxEnabled())
    window.addEventListener('safeBoxToggled', handler)
    return () => window.removeEventListener('safeBoxToggled', handler)
  }, [])

  // 初始化城市
  useEffect(() => {
    const saved = getSavedCity()
    if (saved) {
      try {
        setCurrentCity(JSON.parse(saved).name)
      } catch {}
    }
  }, [])

  // 当编辑模式关闭时，自动关闭网站配置菜单
  useEffect(() => {
    if (!isEditMode) {
      setShowSiteConfig(false)
    }
  }, [isEditMode])

  // 点击外部关闭网站配置菜单
  useEffect(() => {
    if (!showSiteConfig) return
    const handleClick = (e) => {
      if (!e.target.closest(`.${styles.siteConfigWrapper}`)) {
        setShowSiteConfig(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showSiteConfig])

  // 监听其他菜单打开事件，关闭自己
  useEffect(() => {
    const handler = (e) => {
      if (e.detail !== 'siteConfig') {
        setShowSiteConfig(false)
      }
    }
    window.addEventListener('closeOtherMenus', handler)
    return () => window.removeEventListener('closeOtherMenus', handler)
  }, [])

  // 城市搜索
  const handleCitySearch = (value) => {
    setCitySearch(value)
    clearTimeout(searchTimeoutRef.current)
    if (!value.trim()) {
      setCityResults([])
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCity(value)
      setCityResults(results)
    }, 500)
  }

  const handleSelectCity = (city) => {
    saveWeatherCity({ id: city.id, name: city.name, lat: city.lat, lon: city.lon })
    setCurrentCity(city.name)
    setCitySearch('')
    setCityResults([])
    // 通知 TimeWidget 刷新
    window.dispatchEvent(new CustomEvent('weatherCityChanged'))
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Left - Logo */}
        <a href="javascript:void(0)" className={styles.logo} onClick={(e) => { e.preventDefault(); onLogoClick && onLogoClick() }}>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>{siteTitle}</span>
            <span className={styles.logoUrl}>{siteSubtitle}</span>
          </div>
        </a>

        {/* Center - Internal Site Search */}
        <div
          className={`${styles.searchBox} ${isEditMode ? styles.searchBoxEditMode : ''}`}
          style={isEditMode && actionsWidth ? { marginRight: actionsWidth + 'px' } : {}}
        >
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
        {isEditMode && <div className={styles.actionsSpacer} />}
        <div
          ref={actionsRef}
          className={`${styles.actions} ${isEditMode ? styles.actionsSticky : ''}`}
          style={isEditMode && actionsFixedPos ? {
            position: 'fixed',
            top: actionsFixedPos.top + 'px',
            left: actionsFixedPos.left + 'px',
            marginLeft: 0,
          } : {}}
        >
          <DataManager isEditMode={isEditMode} />
          
          {isEditMode && (
            <div className={styles.siteConfigWrapper}>
              <button
                className={styles.siteConfigBtn}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const willOpen = !showSiteConfig;
                  setShowSiteConfig(willOpen);
                  // 如果打开配置菜单，广播关闭其他菜单
                  if (willOpen) window.dispatchEvent(new CustomEvent('closeOtherMenus', { detail: 'siteConfig' }));
                }}
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

                  <div className={styles.configDivider} />

                  {/* 快捷入口开关 */}
                  <label className={styles.configRow}>
                    <div className={styles.configLabel}>
                      <Zap size={14} />
                      <div>
                        <span className={styles.configName}>快捷入口</span>
                        <span className={styles.configDesc}>显示最近使用、置顶等快捷分类</span>
                      </div>
                    </div>
                    <button
                      className={`${styles.configToggle} ${quickAccessEnabled ? styles.configToggleOn : ''}`}
                      onClick={() => {
                        const newVal = !quickAccessEnabled
                        setQuickAccessEnabled(newVal)
                        saveQuickAccessEnabled(newVal)
                        window.dispatchEvent(new CustomEvent('quickAccessToggleChanged'))
                      }}
                    >
                      <span className={styles.configToggleThumb} />
                    </button>
                  </label>

                  <div className={styles.configDivider} />

                  {/* 保险箱开关 */}
                  {!safeBoxEnabled && (
                    <>
                      <div className={styles.configSection}>
                        <div className={styles.configRow}>
                          <div className={styles.configLabel}>
                            <Lock size={14} />
                            <div>
                              <span className={styles.configName}>保险箱</span>
                              <span className={styles.configDesc}>搜索引擎输入密码打开隐藏网站</span>
                            </div>
                          </div>
                          <button
                            className={`${styles.configToggle} ${safeBoxSettingUp ? styles.configToggleOn : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSafeBoxSettingUp(!safeBoxSettingUp)
                              if (safeBoxSettingUp) {
                                setSafeBoxPasswordInput('')
                              }
                            }}
                          >
                            <span className={styles.configToggleThumb} />
                          </button>
                        </div>
                        {safeBoxSettingUp && (
                          <div style={{ marginTop: 8 }}>
                            <div className={styles.citySearchBox}>
                              <Lock size={12} className={styles.citySearchIcon} />
                              <input
                                type="password"
                                value={safeBoxPasswordInput}
                                onChange={(e) => setSafeBoxPasswordInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && safeBoxPasswordInput.trim()) {
                                    saveSafeBoxPassword(safeBoxPasswordInput.trim())
                                    setSafeBoxEnabled(true)
                                    saveSafeBoxEnabled(true)
                                    setSafeBoxPasswordInput('')
                                    setSafeBoxSettingUp(false)
                                  }
                                }}
                                placeholder="设置保险箱密码..."
                                className={styles.citySearchInput}
                              />
                            </div>
                            {safeBoxPasswordInput.trim() && (
                              <button
                                className={styles.cityResultItem}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  saveSafeBoxPassword(safeBoxPasswordInput.trim())
                                  setSafeBoxEnabled(true)
                                  saveSafeBoxEnabled(true)
                                  setSafeBoxPasswordInput('')
                                  setSafeBoxSettingUp(false)
                                }}
                                style={{ marginTop: 4 }}
                              >
                                <span className={styles.cityResultName}>确认并开启保险箱</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={styles.configDivider} />
                    </>
                  )}

                  {/* 网站标题编辑 - 二级菜单 */}
                  <div className={styles.configSection}>
                    <div 
                      className={styles.submenuToggle}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTitleSubmenu(!showTitleSubmenu)
                      }}
                    >
                      <div className={styles.configLabel}>
                        <Type size={14} />
                        <div>
                          <span className={styles.configName}>网站标题</span>
                          <span className={styles.configDesc}>{siteTitle} - {siteSubtitle}</span>
                        </div>
                      </div>
                      <span className={`${styles.submenuArrow} ${showTitleSubmenu ? styles.submenuArrowOpen : ''}`}>▼</span>
                    </div>
                    {showTitleSubmenu && (
                      <div className={styles.subMenu}>
                        <div className={styles.subMenuItem}>
                          <label className={styles.subMenuLabel}>网站标题</label>
                          <input
                            type="text"
                            value={siteTitle}
                            onChange={(e) => onUpdateSiteTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="网站标题..."
                            className={styles.subMenuInput}
                          />
                        </div>
                        <div className={styles.subMenuItem}>
                          <label className={styles.subMenuLabel}>副标题</label>
                          <input
                            type="text"
                            value={siteSubtitle}
                            onChange={(e) => onUpdateSiteSubtitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="副标题..."
                            className={styles.subMenuInput}
                          />
                        </div>
                        <div className={styles.subMenuItem}>
                          <label className={styles.subMenuLabel}>网页标题</label>
                          <input
                            type="text"
                            value={pageTitle}
                            onChange={(e) => {
                              const newTitle = e.target.value
                              setPageTitle(newTitle)
                              document.title = newTitle
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="浏览器标签页标题..."
                            className={styles.subMenuInput}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.configDivider} />

                  {/* 天气城市 + 开关 */}
                  <div className={styles.configSection}>
                    <div className={styles.configRow}>
                      <div className={styles.configLabel}>
                        <MapPin size={14} />
                        <div>
                          <span className={styles.configName}>天气城市</span>
                          <span className={styles.configDesc}>
                            {currentCity ? `当前: ${currentCity}` : '自动定位'}
                          </span>
                        </div>
                      </div>
                      <button
                        className={`${styles.configToggle} ${weatherEnabled ? styles.configToggleOn : ''}`}
                        onClick={() => {
                          const newVal = !weatherEnabled
                          setWeatherEnabled(newVal)
                          saveWeatherEnabled(newVal)
                          window.dispatchEvent(new CustomEvent('weatherToggleChanged'))
                        }}
                      >
                        <span className={styles.configToggleThumb} />
                      </button>
                    </div>
                    <div className={styles.citySearchBox}>
                      <SearchIcon size={12} className={styles.citySearchIcon} />
                      <input
                        type="text"
                        value={citySearch}
                        onChange={(e) => handleCitySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="搜索城市..."
                        className={styles.citySearchInput}
                      />
                    </div>
                    {cityResults.length > 0 && (
                      <div className={styles.cityResults}>
                        {cityResults.map(city => (
                          <button
                            key={city.id}
                            className={styles.cityResultItem}
                            onClick={(e) => { e.stopPropagation(); handleSelectCity(city) }}
                          >
                            <span className={styles.cityResultName}>{city.name}</span>
                            <span className={styles.cityResultAdm}>{city.admin1} {city.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

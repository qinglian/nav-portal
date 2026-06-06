import { useState, useMemo, useEffect, useRef } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { DataProvider, useData } from './context/DataContext'
import Header from './components/Header'
import TimeWidget from './components/TimeWidget'
import SearchEnginePicker from './components/SearchEnginePicker'
import CategorySection from './components/CategorySection'
import EditModal from './components/EditModal'
import AnimatedBackground from './components/AnimatedBackground'
import WallpaperPicker from './components/WallpaperPicker'
import EffectPicker from './components/EffectPicker'
import StartPage from './components/StartPage'
import CloudBackup from './components/CloudBackup'
import { Plus } from 'lucide-react'
import styles from './App.module.css'

function AppContent() {
  const { data, addCategory, updateCategory, deleteCategory, addSite, updateSite, deleteSite, reorderSites, reorderCategories, reorderTags } = useData()
  const { theme } = useTheme()
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [bgMode, setBgMode] = useState(() => localStorage.getItem('nav-bg-mode') || 'default')
  const [customWallpaper, setCustomWallpaper] = useState(() => localStorage.getItem('nav-custom-wallpaper') || '')
  const [showBgPicker, setShowBgPicker] = useState(false)
  
  const [animatedBg, setAnimatedBg] = useState(() => localStorage.getItem('nav-animated-bg') === 'true')
  const [bgEffect, setBgEffect] = useState(() => localStorage.getItem('nav-bg-effect') || 'particles')
  const [showEffectPicker, setShowEffectPicker] = useState(false)
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    data: null,
    categoryId: null,
    categoryTags: []
  })

  // 视图切换：'start' 起始页 | 'nav' 导航页
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('nav-current-view') || 'nav'
  })

  const switchToStart = () => {
    setCurrentView('start')
    localStorage.setItem('nav-current-view', 'start')
  }

  const switchToNav = () => {
    setCurrentView('nav')
    localStorage.setItem('nav-current-view', 'nav')
  }

  // Apply background mode
  useEffect(() => {
    const body = document.body
    
    const gradients = {
      'gradient1': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      'gradient2': 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #44318d 100%)',
      'gradient3': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'gradient4': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    }
    
    if (gradients[bgMode]) {
      body.style.setProperty('background', gradients[bgMode], 'important')
      body.style.backgroundAttachment = 'fixed'
    } else if (customWallpaper && bgMode === 'custom') {
      body.style.setProperty('background', `url(${customWallpaper}) center/cover no-repeat fixed`, 'important')
    } else if (bgMode === 'custom') {
      body.style.setProperty('background', '', 'important')
    } else {
      body.style.setProperty('background', '', 'important')
    }
  }, [bgMode, customWallpaper])

  const toggleBgMode = () => {
    setShowBgPicker(!showBgPicker)
  }

  const handleSelectPreset = (presetId) => {
    setBgMode(presetId)
    localStorage.setItem('nav-bg-mode', presetId)
    if (presetId !== 'custom') {
      setCustomWallpaper('')
      localStorage.removeItem('nav-custom-wallpaper')
    }
  }

  const handleUploadWallpaper = (dataUrl) => {
    setBgMode('custom')
    setCustomWallpaper(dataUrl)
    localStorage.setItem('nav-bg-mode', 'custom')
    localStorage.setItem('nav-custom-wallpaper', dataUrl)
  }

  const toggleAnimatedBg = () => {
    const newValue = !animatedBg
    setAnimatedBg(newValue)
    localStorage.setItem('nav-animated-bg', newValue.toString())
  }

  const handleSelectEffect = (effect) => {
    setBgEffect(effect)
    localStorage.setItem('nav-bg-effect', effect)
  }

  // Filter
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return data.categories
    return data.categories.map(category => ({
      ...category,
      sites: category.sites.filter(site => 
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.sites.length > 0)
  }, [data.categories, searchQuery])

  // Modal handlers
  const openAddSiteModal = (categoryId, categoryTags) => {
    setModalState({ isOpen: true, mode: 'site', data: null, categoryId, categoryTags })
  }
  const openEditSiteModal = (categoryId, site, categoryTags) => {
    setModalState({ isOpen: true, mode: 'site', data: site, categoryId, categoryTags })
  }
  const openAddCategoryModal = () => {
    setModalState({ isOpen: true, mode: 'category', data: null, categoryId: null, categoryTags: [] })
  }
  const openEditCategoryModal = (category) => {
    setModalState({ isOpen: true, mode: 'category', data: category, categoryId: category.id, categoryTags: category.tags || [] })
  }
  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, data: null, categoryId: null, categoryTags: [] })
  }

  const handleModalSave = (formData) => {
    if (modalState.mode === 'site') {
      if (modalState.data) {
        updateSite(modalState.categoryId, modalState.data.id, formData)
      } else {
        addSite(modalState.categoryId, { ...formData, id: Date.now().toString() })
      }
    } else if (modalState.mode === 'category') {
      if (modalState.data) {
        updateCategory(modalState.categoryId, { name: formData.name, tags: formData.tags })
      } else {
        addCategory({ name: formData.name, tags: formData.tags, id: Date.now().toString() })
      }
    }
  }

  const handleDeleteSite = (categoryId, siteId) => {
    if (confirm('确定要删除这个网站吗？')) deleteSite(categoryId, siteId)
  }
  const handleDeleteCategory = (categoryId) => {
    if (confirm('确定要删除这个分类吗？')) deleteCategory(categoryId)
  }

  // 起始页
  if (currentView === 'start') {
    return (
      <div className={styles.app}>
        <AnimatedBackground enabled={animatedBg} theme={theme} effect={bgEffect} />
        <StartPage onGoToNav={switchToNav} />
      </div>
    )
  }

  // 导航页
  return (
    <div className={styles.app}>
      <AnimatedBackground enabled={animatedBg} theme={theme} effect={bgEffect} />

      <Header
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        isEditMode={isEditMode}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onToggleBgMode={toggleBgMode}
        animatedBg={animatedBg}
        onToggleAnimatedBg={toggleAnimatedBg}
        onOpenEffectPicker={() => setShowEffectPicker(true)}
        onLogoClick={switchToStart}
      />

      {showBgPicker && (
        <WallpaperPicker
          currentWallpaper={bgMode === 'custom' && customWallpaper ? customWallpaper : bgMode}
          onSelect={handleSelectPreset}
          onUpload={handleUploadWallpaper}
          onClose={() => setShowBgPicker(false)}
        />
      )}

      {showEffectPicker && (
        <EffectPicker
          currentEffect={bgEffect}
          enabled={animatedBg}
          onToggle={toggleAnimatedBg}
          onSelect={handleSelectEffect}
          onClose={() => setShowEffectPicker(false)}
        />
      )}
      
      <main className={styles.main}>
        <div className={styles.content}>
          {!searchQuery && <TimeWidget />}
          {!searchQuery && <SearchEnginePicker isEditMode={isEditMode} />}
          {isEditMode && !searchQuery && (
            <button onClick={openAddCategoryModal} className={styles.addCategoryBtn}>
              <Plus size={18} />
              <span>添加新分类</span>
            </button>
          )}

          {filteredCategories.map((category, index) => (
            <CategorySection
              key={category.id}
              category={category}
              isEditMode={isEditMode}
              onAddSite={(id) => openAddSiteModal(id, category.tags || [])}
              onEditSite={(id, site) => openEditSiteModal(id, site, category.tags || [])}
              onDeleteSite={handleDeleteSite}
              onEditCategory={openEditCategoryModal}
              onDeleteCategory={handleDeleteCategory}
              onReorderSites={reorderSites}
              onReorderTags={reorderTags}
              onReorderCategories={reorderCategories}
              categoryIndex={index}
              allCategories={filteredCategories}
            />
          ))}

          {searchQuery && filteredCategories.length === 0 && (
            <div className={styles.noResults}>
              <p>没有找到匹配的网站</p>
              <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn}>
                清除搜索
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 云备份 */}
      <CloudBackup />

      <footer className={styles.footer}>
        <p>© 2024 清炼导航 · QingLian</p>
      </footer>

      <EditModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        mode={modalState.mode}
        data={modalState.data}
        categoryTags={modalState.categoryTags}
        onSave={handleModalSave}
      />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider, useData } from './context/DataContext'
import Header from './components/Header'
import TimeWidget from './components/TimeWidget'
import SearchEnginePicker from './components/SearchEnginePicker'
import CategorySection from './components/CategorySection'
import EditModal from './components/EditModal'
import DataManager from './components/DataManager'
import { Plus } from 'lucide-react'
import styles from './App.module.css'

function AppContent() {
  const { data, addCategory, updateCategory, deleteCategory, addSite, updateSite, deleteSite, reorderSites, reorderCategories, reorderTags } = useData()
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [bgMode, setBgMode] = useState(() => {
    return localStorage.getItem('nav-bg-mode') || 'default'
  })
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    data: null,
    categoryId: null,
    categoryTags: []
  })

  // Apply background mode
  useEffect(() => {
    if (bgMode === 'custom') {
      document.documentElement.setAttribute('data-bg', 'custom')
    } else {
      document.documentElement.removeAttribute('data-bg')
    }
  }, [bgMode])

  const toggleBgMode = () => {
    const modes = ['default', 'custom']
    const currentIndex = modes.indexOf(bgMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setBgMode(nextMode)
    localStorage.setItem('nav-bg-mode', nextMode)
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

  // 分类拖拽排序
  const handleCategoryDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'category', index }))
    e.currentTarget.style.opacity = '0.5'
  }
  const handleCategoryDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }
  const handleCategoryDragOver = (e) => {
    e.preventDefault()
  }
  const handleCategoryDrop = (e, targetIndex) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.type === 'category') {
        const cats = [...filteredCategories]
        const [moved] = cats.splice(data.index, 1)
        cats.splice(targetIndex, 0, moved)
        reorderCategories(cats)
      }
    } catch {}
  }

  return (
    <div className={styles.app}>
      <Header 
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        isEditMode={isEditMode}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onToggleBgMode={toggleBgMode}
      />
      
      {/* 导入导出管理器 */}
      <DataManager isEditMode={isEditMode} />

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

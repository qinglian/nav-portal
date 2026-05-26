import { useState, useMemo } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider, useData } from './context/DataContext'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategorySection from './components/CategorySection'
import EditModal from './components/EditModal'
import { Plus } from 'lucide-react'
import styles from './App.module.css'

function AppContent() {
  const { data, addCategory, updateCategory, deleteCategory, addSite, updateSite, deleteSite } = useData()
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'site' or 'category'
    data: null,
    categoryId: null
  })

  // Filter sites based on search query
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
  const openAddSiteModal = (categoryId) => {
    setModalState({
      isOpen: true,
      mode: 'site',
      data: null,
      categoryId
    })
  }

  const openEditSiteModal = (categoryId, site) => {
    setModalState({
      isOpen: true,
      mode: 'site',
      data: site,
      categoryId
    })
  }

  const openAddCategoryModal = () => {
    setModalState({
      isOpen: true,
      mode: 'category',
      data: null,
      categoryId: null
    })
  }

  const openEditCategoryModal = (category) => {
    setModalState({
      isOpen: true,
      mode: 'category',
      data: category,
      categoryId: category.id
    })
  }

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: null,
      data: null,
      categoryId: null
    })
  }

  const handleModalSave = (formData) => {
    if (modalState.mode === 'site') {
      if (modalState.data) {
        // Edit existing site
        updateSite(modalState.categoryId, modalState.data.id, formData)
      } else {
        // Add new site
        addSite(modalState.categoryId, {
          ...formData,
          id: Date.now().toString()
        })
      }
    } else if (modalState.mode === 'category') {
      if (modalState.data) {
        // Edit existing category
        updateCategory(modalState.categoryId, formData)
      } else {
        // Add new category
        addCategory({
          ...formData,
          id: Date.now().toString()
        })
      }
    }
  }

  const handleDeleteSite = (categoryId, siteId) => {
    if (confirm('确定要删除这个网站吗？')) {
      deleteSite(categoryId, siteId)
    }
  }

  const handleDeleteCategory = (categoryId) => {
    if (confirm('确定要删除这个分类吗？分类下的所有网站也会被删除。')) {
      deleteCategory(categoryId)
    }
  }

  return (
    <div className={styles.app}>
      {/* Background Decoration */}
      <div className={styles.bgDecoration} />

      {/* Header */}
      <Header 
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        isEditMode={isEditMode}
      />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            <span className={styles.gradientText}>高效实用</span>
            <br />
            的导航门户
          </h1>
          <p className={styles.heroSubtitle}>
            快速访问常用网站，提升工作效率
          </p>
          <SearchBar onSearch={setSearchQuery} />
        </section>

        {/* Categories */}
        <section className={styles.content}>
          {/* Add Category Button (Edit Mode) */}
          {isEditMode && (
            <button onClick={openAddCategoryModal} className={styles.addCategoryBtn}>
              <Plus size={20} />
              <span>添加新分类</span>
            </button>
          )}

          {/* Category Sections */}
          {filteredCategories.map((category, index) => (
            <CategorySection
              key={category.id}
              category={category}
              isEditMode={isEditMode}
              onAddSite={openAddSiteModal}
              onEditSite={openEditSiteModal}
              onDeleteSite={handleDeleteSite}
              onEditCategory={openEditCategoryModal}
              onDeleteCategory={handleDeleteCategory}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}

          {/* No Results */}
          {searchQuery && filteredCategories.length === 0 && (
            <div className={styles.noResults}>
              <p>没有找到匹配的网站</p>
              <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn}>
                清除搜索
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 导航门户 · 精心打造</p>
      </footer>

      {/* Edit Modal */}
      <EditModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        mode={modalState.mode}
        data={modalState.data}
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

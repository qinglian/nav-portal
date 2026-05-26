import { Sparkles, Code, Palette, Play, Users, Folder, Plus, Edit2, Trash2 } from 'lucide-react'
import SiteCard from './SiteCard'
import styles from './CategorySection.module.css'

const iconMap = {
  Sparkles,
  Code,
  Palette,
  Play,
  Users,
  Folder
}

export default function CategorySection({ 
  category, 
  isEditMode, 
  onAddSite, 
  onEditSite, 
  onDeleteSite,
  onEditCategory,
  onDeleteCategory 
}) {
  const Icon = iconMap[category.icon] || Folder

  return (
    <section className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.iconWrapper}>
            <Icon size={20} />
          </div>
          <h2 className={styles.title}>{category.name}</h2>
          <span className={styles.count}>{category.sites.length}</span>
        </div>
        
        {isEditMode && (
          <div className={styles.headerActions}>
            <button
              onClick={() => onAddSite(category.id)}
              className={styles.addBtn}
            >
              <Plus size={16} />
              <span>添加网站</span>
            </button>
            <button
              onClick={() => onEditCategory(category)}
              className={styles.editBtn}
              title="编辑分类"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDeleteCategory(category.id)}
              className={styles.deleteBtn}
              title="删除分类"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Sites Grid */}
      <div className={styles.grid}>
        {category.sites.map((site, index) => (
          <SiteCard
            key={site.id}
            site={site}
            isEditMode={isEditMode}
            onEdit={() => onEditSite(category.id, site)}
            onDelete={() => onDeleteSite(category.id, site.id)}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
        
        {/* Empty State */}
        {category.sites.length === 0 && (
          <div className={styles.empty}>
            <p>暂无网站</p>
            {isEditMode && (
              <button
                onClick={() => onAddSite(category.id)}
                className={styles.emptyAddBtn}
              >
                <Plus size={16} />
                <span>添加第一个网站</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

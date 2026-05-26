import { X, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import styles from './EditModal.module.css'

export default function EditModal({ isOpen, onClose, mode, data, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    icon: 'Folder'
  })
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && data) {
      setFormData({
        name: data.name || '',
        url: data.url || '',
        description: data.description || '',
        icon: data.icon || 'Folder'
      })
    } else if (isOpen && !data) {
      setFormData({
        name: '',
        url: '',
        description: '',
        icon: 'Folder'
      })
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, data])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    if (mode === 'site' && !formData.url.trim()) return
    onSave(formData)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'site' 
              ? (data ? '编辑网站' : '添加网站')
              : (data ? '编辑分类' : '添加分类')
            }
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'site' ? (
            <>
              <div className={styles.field}>
                <label className={styles.label}>名称 *</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="网站名称"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>网址 *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简短描述..."
                  className={styles.textarea}
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>分类名称 *</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="分类名称"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>图标</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className={styles.select}
                >
                  <option value="Folder">文件夹</option>
                  <option value="Sparkles">AI</option>
                  <option value="Code">代码</option>
                  <option value="Palette">设计</option>
                  <option value="Play">播放</option>
                  <option value="Users">用户</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              取消
            </button>
            <button type="submit" className={styles.saveBtn}>
              <Plus size={18} />
              <span>{data ? '保存' : '添加'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

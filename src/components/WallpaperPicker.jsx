import { useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import styles from './WallpaperPicker.module.css'

const presets = [
  { id: 'default', name: '默认', color: '#f2f2f7', icon: ImageIcon },
  { id: 'gradient1', name: '炫光紫', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' },
  { id: 'gradient2', name: '深海蓝', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #44318d 100%)' },
  { id: 'gradient3', name: '日落橙', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'gradient4', name: '森林绿', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
]

export default function WallpaperPicker({ currentWallpaper, onSelect, onUpload, onClose }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      onUpload(event.target?.result)
      onClose()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSelect = (id) => {
    onSelect(id)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>选择背景</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>预设背景</div>
          <div className={styles.wallpapers}>
            {presets.map(preset => {
              const Icon = preset.icon
              const isActive = currentWallpaper === preset.id ||
                (preset.id === 'default' && !presets.find(p => p.id === currentWallpaper || currentWallpaper?.startsWith('data:')))

              return (
                <button
                  key={preset.id}
                  className={`${styles.wallpaper} ${isActive ? styles.active : ''}`}
                  onClick={() => handleSelect(preset.id)}
                  style={{
                    background: preset.color || preset.gradient,
                  }}
                >
                  {preset.icon && <Icon size={20} color="#999" />}
                  <span>{preset.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>自定义图片</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {currentWallpaper?.startsWith('data:') ? (
            <div className={styles.customPreview}>
              <img src={currentWallpaper} alt="自定义壁纸" className={styles.previewImage} />
              <div className={styles.previewActions}>
                <button
                  className={styles.changeBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  更换图片
                </button>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleSelect('default')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              <span>上传图片作为壁纸</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

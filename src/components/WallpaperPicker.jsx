import { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import styles from './WallpaperPicker.module.css'

export default function WallpaperPicker({ currentWallpaper, onSelect, onUpload }) {
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
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const presets = [
    { id: 'default', name: '默认', color: '#f2f2f7' },
    { id: 'gradient1', name: '炫光紫', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' },
    { id: 'gradient2', name: '深海蓝', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #44318d 100%)' },
    { id: 'gradient3', name: '日落橙', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'gradient4', name: '森林绿', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  ]

  return (
    <div className={styles.picker}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>预设背景</div>
        <div className={styles.presets}>
          {presets.map(preset => (
            <button
              key={preset.id}
              className={`${styles.preset} ${currentWallpaper === preset.id ? styles.active : ''}`}
              onClick={() => onSelect(preset.id)}
              style={{
                background: preset.color || preset.gradient,
              }}
              title={preset.name}
            >
              {currentWallpaper === preset.id && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
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
                onClick={() => onSelect('default')}
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
  )
}

import { Sparkles, Star, Waves, Snowflake, Circle, Bug, Zap, Mountain, Hexagon, RotateCw } from 'lucide-react';
import styles from './EffectPicker.module.css';

const effects = [
  { id: 'particles', name: '粒子', icon: Sparkles, group: '2D' },
  { id: 'stars', name: '星空', icon: Star, group: '2D' },
  { id: 'waves', name: '波浪', icon: Waves, group: '2D' },
  { id: 'snow', name: '雪花', icon: Snowflake, group: '2D' },
  { id: 'bubbles', name: '气泡', icon: Circle, group: '2D' },
  { id: 'fireflies', name: '萤火虫', icon: Bug, group: '2D' },
  { id: 'meteors', name: '流星', icon: Zap, group: '2D' },
  { id: 'aurora', name: '极光', icon: Mountain, group: '2D' },
  { id: 'lightweb', name: '光网', icon: Hexagon, group: '3D' },
  { id: 'vortex', name: '漩涡', icon: RotateCw, group: '3D' },
];

export default function EffectPicker({ currentEffect, enabled, onToggle, onSelect, onClose }) {
  const groups = [
    { name: '2D 效果', items: effects.filter(e => e.group === '2D') },
    { name: '3D 效果', items: effects.filter(e => e.group === '3D') },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>动效背景</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* 开关 */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>启用动效</span>
          <button
            className={`${styles.toggle} ${enabled ? styles.on : ''}`}
            onClick={onToggle}
          >
            <span className={styles.toggleDot} />
          </button>
        </div>

        {enabled && groups.map(group => (
          <div key={group.name}>
            <div className={styles.groupTitle}>{group.name}</div>
            <div className={styles.effects}>
              {group.items.map(effect => {
                const Icon = effect.icon;
                return (
                  <button
                    key={effect.id}
                    className={`${styles.effect} ${currentEffect === effect.id ? styles.active : ''}`}
                    onClick={() => onSelect(effect.id)}
                  >
                    <Icon size={22} />
                    <span>{effect.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Sparkles, Star, Waves, Snowflake, Circle } from 'lucide-react';
import styles from './EffectPicker.module.css';

const effects = [
  { id: 'particles', name: '粒子', icon: Sparkles },
  { id: 'stars', name: '星空', icon: Star },
  { id: 'waves', name: '波浪', icon: Waves },
  { id: 'snow', name: '雪花', icon: Snowflake },
  { id: 'bubbles', name: '气泡', icon: Circle },
];

export default function EffectPicker({ currentEffect, onSelect, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>选择动效</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.effects}>
          {effects.map(effect => {
            const Icon = effect.icon;
            return (
              <button
                key={effect.id}
                className={`${styles.effect} ${currentEffect === effect.id ? styles.active : ''}`}
                onClick={() => onSelect(effect.id)}
              >
                <Icon size={24} />
                <span>{effect.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import styles from './AnimatedBackground.module.css';

export default function AnimatedBackground({ enabled, theme }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const themeRef = useRef(theme);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const initParticles = (w, h) => {
      const p = [];
      const count = Math.min(Math.floor((w * h) / 25000), 50);
      for (let i = 0; i < count; i++) {
        p.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.5 + 0.5,
          o: Math.random() * 0.25 + 0.08,
        });
      }
      return p;
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      
      if (enabledRef.current) {
        const isDark = themeRef.current === 'dark';
        const c = isDark ? '255,255,255' : '0,122,255';
        
        particlesRef.current.forEach((p, i) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${c},${p.o})`;
          ctx.fill();
          
          particlesRef.current.slice(i + 1).forEach(p2 => {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 100) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(${c},${0.05 * (1 - d / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        });
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = initParticles(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);
    animationRef.current = requestAnimationFrame(draw);
    
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.canvas}
      style={{ pointerEvents: 'none' }}
    />
  );
}

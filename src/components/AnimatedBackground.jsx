import { useEffect, useRef, useCallback } from 'react';
import styles from './AnimatedBackground.module.css';

export default function AnimatedBackground({ enabled, theme }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const initParticles = useCallback((width, height) => {
    const particleCount = Math.min(Math.floor((width * height) / 15000), 100);
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    
    return particles;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const particles = particlesRef.current;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 根据主题设置颜色
    const isDark = theme === 'dark';
    const particleColor = isDark ? '255, 255, 255' : '0, 122, 255';
    const lineColor = isDark ? '255, 255, 255' : '0, 122, 255';
    
    // 更新和绘制粒子
    particles.forEach((particle, i) => {
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 边界反弹
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      
      // 绘制粒子
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
      ctx.fill();
      
      // 绘制连线
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(${lineColor}, ${0.1 * (1 - distance / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    
    animationRef.current = requestAnimationFrame(draw);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = initParticles(canvas.width, canvas.height);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    animationRef.current = requestAnimationFrame(draw);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, draw, initParticles]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}
    />
  );
}

import { useEffect, useRef, useState } from 'react';
import styles from './AnimatedBackground.module.css';

// 粒子连线效果
function drawParticles(ctx, canvas, particles, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '0, 122, 255';

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 0.5)`;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${color}, ${0.15 * (1 - dist / 120)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  });
}

// 星空效果
function drawStars(ctx, canvas, stars, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '0, 122, 255';

  stars.forEach(star => {
    star.twinkle += star.twinkleSpeed;
    const opacity = 0.3 + Math.sin(star.twinkle) * 0.3;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${opacity})`;
    ctx.fill();

    // 星光十字
    if (star.radius > 1.5) {
      ctx.beginPath();
      ctx.moveTo(star.x - star.radius * 2, star.y);
      ctx.lineTo(star.x + star.radius * 2, star.y);
      ctx.moveTo(star.x, star.y - star.radius * 2);
      ctx.lineTo(star.x, star.y + star.radius * 2);
      ctx.strokeStyle = `rgba(${color}, ${opacity * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  });
}

// 波浪效果
function drawWaves(ctx, canvas, waves, theme, time) {
  const isDark = theme === 'dark';
  const colors = isDark 
    ? ['rgba(100, 150, 255, 0.3)', 'rgba(150, 100, 255, 0.2)', 'rgba(100, 200, 200, 0.15)']
    : ['rgba(0, 122, 255, 0.2)', 'rgba(88, 86, 214, 0.15)', 'rgba(0, 200, 200, 0.1)'];

  waves.forEach((wave, index) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let x = 0; x <= canvas.width; x += 10) {
      const y = wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
  });
}

// 雪花效果
function drawSnow(ctx, canvas, snowflakes, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '200, 200, 255';

  snowflakes.forEach(flake => {
    flake.y += flake.speed;
    flake.x += Math.sin(flake.y * 0.01) * 0.5;

    if (flake.y > canvas.height) {
      flake.y = -10;
      flake.x = Math.random() * canvas.width;
    }

    ctx.save();
    ctx.translate(flake.x, flake.y);
    ctx.rotate(flake.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${flake.opacity})`;
    ctx.fill();

    ctx.restore();
  });
}

// 气泡效果
function drawBubbles(ctx, canvas, bubbles, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '100, 200, 255' : '0, 150, 255';

  bubbles.forEach(bubble => {
    bubble.y -= bubble.speed;
    bubble.x += Math.sin(bubble.y * 0.02) * 0.3;

    if (bubble.y < -50) {
      bubble.y = canvas.height + 50;
      bubble.x = Math.random() * canvas.width;
    }

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${bubble.opacity})`;
    ctx.fill();

    // 高光
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.5})`;
    ctx.fill();
  });
}

export default function AnimatedBackground({ enabled, theme, effect = 'particles' }) {
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const itemsRef = useRef([]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initItems();
    };

    const initItems = () => {
      const items = [];
      const w = canvas.width;
      const h = canvas.height;

      switch (effect) {
        case 'particles':
          for (let i = 0; i < 40; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
              radius: Math.random() * 2 + 0.5,
            });
          }
          break;
        case 'stars':
          for (let i = 0; i < 60; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              radius: Math.random() * 2 + 0.5,
              twinkle: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.03,
            });
          }
          break;
        case 'waves':
          for (let i = 0; i < 3; i++) {
            items.push({
              y: h * (0.6 + i * 0.15),
              amplitude: 30 + i * 10,
              frequency: 0.003 + i * 0.001,
              speed: 0.02 + i * 0.01,
              offset: i * 2,
            });
          }
          break;
        case 'snow':
          for (let i = 0; i < 50; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              radius: Math.random() * 2 + 1,
              speed: 0.5 + Math.random() * 1.5,
              rotation: Math.random() * Math.PI * 2,
              opacity: 0.3 + Math.random() * 0.4,
            });
          }
          break;
        case 'bubbles':
          for (let i = 0; i < 30; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              radius: 5 + Math.random() * 15,
              speed: 0.3 + Math.random() * 0.7,
              opacity: 0.1 + Math.random() * 0.2,
            });
          }
          break;
      }
      itemsRef.current = items;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      switch (effect) {
        case 'particles':
          drawParticles(ctx, canvas, itemsRef.current, theme);
          break;
        case 'stars':
          drawStars(ctx, canvas, itemsRef.current, theme);
          break;
        case 'waves':
          drawWaves(ctx, canvas, itemsRef.current, theme, time);
          break;
        case 'snow':
          drawSnow(ctx, canvas, itemsRef.current, theme);
          break;
        case 'bubbles':
          drawBubbles(ctx, canvas, itemsRef.current, theme);
          break;
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    setIsReady(true);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [enabled, theme, effect]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}

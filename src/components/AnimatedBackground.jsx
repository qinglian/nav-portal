import { useEffect, useRef, useState } from 'react';
import styles from './AnimatedBackground.module.css';

// 粒子连线效果
function drawParticles(ctx, canvas, particles, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '100, 200, 255' : '0, 122, 255';
  const lineColor = isDark ? '150, 200, 255' : '0, 150, 255';

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    // 发光粒子
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 0.8)`;
    ctx.fill();

    // 发光效果
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
    gradient.addColorStop(0, `rgba(${color}, 0.4)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 连线
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${lineColor}, ${0.3 * (1 - dist / 150)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  });
}

// 星空效果
function drawStars(ctx, canvas, stars, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '0, 100, 200';

  stars.forEach(star => {
    star.twinkle += star.twinkleSpeed;
    const opacity = 0.4 + Math.sin(star.twinkle) * 0.4;

    // 发光星星
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${opacity})`;
    ctx.fill();

    // 光晕
    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
    gradient.addColorStop(0, `rgba(${color}, ${opacity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 星光十字
    if (star.radius > 1) {
      ctx.beginPath();
      ctx.moveTo(star.x - star.radius * 3, star.y);
      ctx.lineTo(star.x + star.radius * 3, star.y);
      ctx.moveTo(star.x, star.y - star.radius * 3);
      ctx.lineTo(star.x, star.y + star.radius * 3);
      ctx.strokeStyle = `rgba(${color}, ${opacity * 0.6})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

// 波浪效果
function drawWaves(ctx, canvas, waves, theme, time) {
  const isDark = theme === 'dark';
  const colors = isDark
    ? ['rgba(100, 150, 255, 0.5)', 'rgba(150, 100, 255, 0.4)', 'rgba(100, 200, 200, 0.3)']
    : ['rgba(0, 122, 255, 0.4)', 'rgba(88, 86, 214, 0.3)', 'rgba(0, 200, 200, 0.25)'];

  waves.forEach((wave, index) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let x = 0; x <= canvas.width; x += 5) {
      const y = wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    // 波浪顶部发光线
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 5) {
      const y = wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors[index % colors.length].replace(/[\d.]+\)$/, '0.8)');
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// 雪花效果
function drawSnow(ctx, canvas, snowflakes, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '200, 230, 255' : '150, 200, 255';

  snowflakes.forEach(flake => {
    flake.y += flake.speed;
    flake.x += Math.sin(flake.y * 0.01 + flake.rotation) * 0.8;
    flake.rotation += 0.02;

    if (flake.y > canvas.height) {
      flake.y = -10;
      flake.x = Math.random() * canvas.width;
    }

    ctx.save();
    ctx.translate(flake.x, flake.y);
    ctx.rotate(flake.rotation);

    // 雪花形状
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, flake.radius * 2);
      ctx.moveTo(0, flake.radius);
      ctx.lineTo(-flake.radius * 0.5, flake.radius * 1.5);
      ctx.moveTo(0, flake.radius);
      ctx.lineTo(flake.radius * 0.5, flake.radius * 1.5);
    }
    ctx.strokeStyle = `rgba(${color}, ${flake.opacity})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  });
}

// 气泡效果
function drawBubbles(ctx, canvas, bubbles, theme) {
  const isDark = theme === 'dark';
  const colors = isDark
    ? ['100, 200, 255', '150, 150, 255', '100, 255, 200']
    : ['0, 150, 255', '100, 100, 255', '0, 200, 150'];

  bubbles.forEach((bubble, i) => {
    bubble.y -= bubble.speed;
    bubble.x += Math.sin(bubble.y * 0.02 + i) * 0.5;

    if (bubble.y < -50) {
      bubble.y = canvas.height + 50;
      bubble.x = Math.random() * canvas.width;
    }

    const color = colors[i % colors.length];

    // 气泡主体
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      bubble.x - bubble.radius * 0.3,
      bubble.y - bubble.radius * 0.3,
      0,
      bubble.x,
      bubble.y,
      bubble.radius
    );
    gradient.addColorStop(0, `rgba(${color}, ${bubble.opacity * 0.8})`);
    gradient.addColorStop(0.5, `rgba(${color}, ${bubble.opacity * 0.4})`);
    gradient.addColorStop(1, `rgba(${color}, ${bubble.opacity * 0.1})`);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 边框
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${color}, ${bubble.opacity * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 高光
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`;
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
          for (let i = 0; i < 50; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              radius: Math.random() * 2.5 + 1,
            });
          }
          break;
        case 'stars':
          for (let i = 0; i < 80; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              radius: Math.random() * 2 + 0.5,
              twinkle: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.04,
            });
          }
          break;
        case 'waves':
          for (let i = 0; i < 3; i++) {
            items.push({
              y: h * (0.5 + i * 0.2),
              amplitude: 40 + i * 15,
              frequency: 0.002 + i * 0.0005,
              speed: 0.03 + i * 0.015,
              offset: i * 2,
            });
          }
          break;
        case 'snow':
          for (let i = 0; i < 60; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              radius: Math.random() * 2 + 1.5,
              speed: 1 + Math.random() * 2,
              rotation: Math.random() * Math.PI * 2,
              opacity: 0.5 + Math.random() * 0.4,
            });
          }
          break;
        case 'bubbles':
          for (let i = 0; i < 40; i++) {
            items.push({
              x: Math.random() * w,
              y: Math.random() * h,
              radius: 8 + Math.random() * 20,
              speed: 0.5 + Math.random() * 1,
              opacity: 0.15 + Math.random() * 0.25,
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

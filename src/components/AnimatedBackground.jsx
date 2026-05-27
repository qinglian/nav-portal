import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import styles from './AnimatedBackground.module.css';

// ========== Canvas 2D 效果 ==========

function drawParticles(ctx, canvas, particles, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '100, 200, 255' : '0, 122, 255';

  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 0.8)`;
    ctx.fill();

    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
    g.addColorStop(0, `rgba(${color}, 0.4)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x, dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${color}, ${0.3 * (1 - dist / 150)})`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  });
}

function drawStars(ctx, canvas, stars, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '0, 100, 200';
  stars.forEach(star => {
    star.twinkle += star.twinkleSpeed;
    const opacity = 0.4 + Math.sin(star.twinkle) * 0.4;
    ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${opacity})`; ctx.fill();
    const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
    g.addColorStop(0, `rgba(${color}, ${opacity * 0.5})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    if (star.radius > 1) {
      ctx.beginPath();
      ctx.moveTo(star.x - star.radius * 3, star.y); ctx.lineTo(star.x + star.radius * 3, star.y);
      ctx.moveTo(star.x, star.y - star.radius * 3); ctx.lineTo(star.x, star.y + star.radius * 3);
      ctx.strokeStyle = `rgba(${color}, ${opacity * 0.6})`; ctx.lineWidth = 1; ctx.stroke();
    }
  });
}

function drawWaves(ctx, canvas, waves, theme, time) {
  const isDark = theme === 'dark';
  const colors = isDark
    ? ['rgba(100, 150, 255, 0.5)', 'rgba(150, 100, 255, 0.4)', 'rgba(100, 200, 200, 0.3)']
    : ['rgba(0, 122, 255, 0.4)', 'rgba(88, 86, 214, 0.3)', 'rgba(0, 200, 200, 0.25)'];
  waves.forEach((wave, index) => {
    ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 5) {
      ctx.lineTo(x, wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude);
    }
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath();
    ctx.fillStyle = colors[index % colors.length]; ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 5) {
      const y = wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors[index % colors.length].replace(/[\d.]+\)$/, '0.8)');
    ctx.lineWidth = 2; ctx.stroke();
  });
}

function drawSnow(ctx, canvas, snowflakes, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '200, 230, 255' : '150, 200, 255';
  snowflakes.forEach(flake => {
    flake.y += flake.speed; flake.x += Math.sin(flake.y * 0.01 + flake.rotation) * 0.8; flake.rotation += 0.02;
    if (flake.y > canvas.height) { flake.y = -10; flake.x = Math.random() * canvas.width; }
    ctx.save(); ctx.translate(flake.x, flake.y); ctx.rotate(flake.rotation);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3); ctx.moveTo(0, 0); ctx.lineTo(0, flake.radius * 2);
      ctx.moveTo(0, flake.radius); ctx.lineTo(-flake.radius * 0.5, flake.radius * 1.5);
      ctx.moveTo(0, flake.radius); ctx.lineTo(flake.radius * 0.5, flake.radius * 1.5);
    }
    ctx.strokeStyle = `rgba(${color}, ${flake.opacity})`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  });
}

function drawBubbles(ctx, canvas, bubbles, theme) {
  const isDark = theme === 'dark';
  const colors = isDark ? ['100, 200, 255', '150, 150, 255', '100, 255, 200'] : ['0, 150, 255', '100, 100, 255', '0, 200, 150'];
  bubbles.forEach((bubble, i) => {
    bubble.y -= bubble.speed; bubble.x += Math.sin(bubble.y * 0.02 + i) * 0.5;
    if (bubble.y < -50) { bubble.y = canvas.height + 50; bubble.x = Math.random() * canvas.width; }
    const color = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, 0, bubble.x, bubble.y, bubble.radius);
    g.addColorStop(0, `rgba(${color}, ${bubble.opacity * 0.8})`);
    g.addColorStop(0.5, `rgba(${color}, ${bubble.opacity * 0.4})`);
    g.addColorStop(1, `rgba(${color}, ${bubble.opacity * 0.1})`);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${color}, ${bubble.opacity * 0.6})`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`; ctx.fill();
  });
}

// 萤火虫效果
function drawFireflies(ctx, canvas, fireflies, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '180, 255, 100' : '100, 200, 50';
  fireflies.forEach(f => {
    f.x += Math.sin(f.angle) * f.speed;
    f.y += Math.cos(f.angle) * f.speed * 0.6;
    f.angle += (Math.random() - 0.5) * 0.1;
    f.glow += f.glowSpeed;
    const opacity = 0.3 + Math.sin(f.glow) * 0.5;
    if (f.x < -20) f.x = canvas.width + 20;
    if (f.x > canvas.width + 20) f.x = -20;
    if (f.y < -20) f.y = canvas.height + 20;
    if (f.y > canvas.height + 20) f.y = -20;

    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 5);
    g.addColorStop(0, `rgba(${color}, ${opacity})`);
    g.addColorStop(0.3, `rgba(${color}, ${opacity * 0.4})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius * 5, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${opacity + 0.3})`; ctx.fill();
  });
}

// 流星效果
function drawMeteors(ctx, canvas, meteors, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '100, 150, 255';
  meteors.forEach(m => {
    m.x += m.vx; m.y += m.vy; m.life -= 0.008;
    if (m.life <= 0) {
      m.x = Math.random() * canvas.width * 1.5;
      m.y = -20;
      m.vx = -(3 + Math.random() * 4);
      m.vy = 3 + Math.random() * 4;
      m.life = 0.6 + Math.random() * 0.4;
      m.length = 60 + Math.random() * 80;
    }
    const tailX = m.x - m.vx * m.length * 0.3;
    const tailY = m.y - m.vy * m.length * 0.3;
    const g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
    g.addColorStop(0, `rgba(${color}, ${m.life})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${m.life})`; ctx.fill();
  });
}

// 极光效果
function drawAurora(ctx, canvas, time, theme) {
  const isDark = theme === 'dark';
  const colors = isDark
    ? ['rgba(0, 255, 128, 0.15)', 'rgba(0, 200, 255, 0.12)', 'rgba(150, 0, 255, 0.1)']
    : ['rgba(0, 200, 100, 0.12)', 'rgba(0, 150, 255, 0.1)', 'rgba(120, 0, 200, 0.08)'];

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 8) {
      const y = canvas.height * 0.3 +
        Math.sin(x * 0.003 + time * (0.5 + i * 0.2) + i * 1.5) * 80 +
        Math.sin(x * 0.007 + time * (0.3 + i * 0.1)) * 40 +
        Math.cos(x * 0.002 + time * 0.2 + i) * 60;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
  }
}

// ========== Three.js 3D 效果 ==========

function ThreeScene({ effect, theme }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;
    sceneRef.current = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const isDark = theme === 'dark';
    let objects = [];

    if (effect === 'geometry') {
      // 旋转几何体
      const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(0.8, 0),
        new THREE.TetrahedronGeometry(0.7, 0),
        new THREE.TorusGeometry(0.6, 0.2, 8, 16),
        new THREE.DodecahedronGeometry(0.7, 0),
        new THREE.TorusKnotGeometry(0.5, 0.15, 64, 8),
      ];
      const colors = isDark ? [0x00aaff, 0xaa00ff, 0x00ffaa, 0xff6600, 0xff00aa, 0xffff00] : [0x0077cc, 0x7700cc, 0x00cc77, 0xcc5500, 0xcc0077, 0xcccc00];

      for (let i = 0; i < 20; i++) {
        const geo = geometries[i % geometries.length];
        const mat = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          wireframe: true,
          transparent: true,
          opacity: 0.3 + Math.random() * 0.3,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10 - 5
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
          rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02 },
          floatSpeed: Math.random() * 0.005 + 0.002,
          floatOffset: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        };
        scene.add(mesh);
        objects.push(mesh);
      }
      camera.position.z = 8;

    } else if (effect === 'galaxy') {
      // 星系旋涡
      const count = 3000;
      const positions = new Float32Array(count * 3);
      const colors_arr = new Float32Array(count * 3);
      const color1 = new THREE.Color(isDark ? 0x00aaff : 0x0066cc);
      const color2 = new THREE.Color(isDark ? 0xaa00ff : 0x6600cc);
      const color3 = new THREE.Color(isDark ? 0x00ffaa : 0x00cc77);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 8;
        const radius = Math.random() * 5 + 0.5;
        const armOffset = (i % 3) * (Math.PI * 2 / 3);
        positions[i * 3] = Math.cos(angle + armOffset) * radius + (Math.random() - 0.5) * 0.8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = Math.sin(angle + armOffset) * radius + (Math.random() - 0.5) * 0.8;

        const mixColor = new THREE.Color();
        const t = Math.random();
        if (t < 0.33) mixColor.lerpColors(color1, color2, t * 3);
        else if (t < 0.66) mixColor.lerpColors(color2, color3, (t - 0.33) * 3);
        else mixColor.lerpColors(color3, color1, (t - 0.66) * 3);
        colors_arr[i * 3] = mixColor.r;
        colors_arr[i * 3 + 1] = mixColor.g;
        colors_arr[i * 3 + 2] = mixColor.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors_arr, 3));
      const mat = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.8 });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      objects.push(points);
      camera.position.set(0, 4, 6);
      camera.lookAt(0, 0, 0);
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;

      if (effect === 'geometry') {
        objects.forEach(mesh => {
          mesh.rotation.x += mesh.userData.rotSpeed.x;
          mesh.rotation.y += mesh.userData.rotSpeed.y;
          mesh.position.y = mesh.userData.baseY + Math.sin(t * mesh.userData.floatSpeed * 100 + mesh.userData.floatOffset) * 0.5;
        });
      } else if (effect === 'galaxy') {
        objects.forEach(p => { p.rotation.y += 0.002; });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      sceneRef.current = false;
    };
  }, [effect, theme]);

  return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ========== 主组件 ==========

const CANVAS_EFFECTS = ['particles', 'stars', 'waves', 'snow', 'bubbles', 'fireflies', 'meteors', 'aurora'];
const THREE_EFFECTS = ['geometry', 'galaxy'];

export default function AnimatedBackground({ enabled, theme, effect = 'particles' }) {
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const itemsRef = useRef([]);

  const isThreeEffect = THREE_EFFECTS.includes(effect);

  // Canvas 2D 效果
  useEffect(() => {
    if (!enabled || isThreeEffect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId = null;
    let time = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initItems(); };

    const initItems = () => {
      const items = [];
      const w = canvas.width, h = canvas.height;
      switch (effect) {
        case 'particles':
          for (let i = 0; i < 50; i++) items.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, radius: Math.random() * 2.5 + 1 });
          break;
        case 'stars':
          for (let i = 0; i < 80; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: Math.random() * 2 + 0.5, twinkle: Math.random() * Math.PI * 2, twinkleSpeed: 0.02 + Math.random() * 0.04 });
          break;
        case 'waves':
          for (let i = 0; i < 3; i++) items.push({ y: h * (0.5 + i * 0.2), amplitude: 40 + i * 15, frequency: 0.002 + i * 0.0005, speed: 0.03 + i * 0.015, offset: i * 2 });
          break;
        case 'snow':
          for (let i = 0; i < 60; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: Math.random() * 2 + 1.5, speed: 1 + Math.random() * 2, rotation: Math.random() * Math.PI * 2, opacity: 0.5 + Math.random() * 0.4 });
          break;
        case 'bubbles':
          for (let i = 0; i < 40; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: 8 + Math.random() * 20, speed: 0.5 + Math.random() * 1, opacity: 0.15 + Math.random() * 0.25 });
          break;
        case 'fireflies':
          for (let i = 0; i < 35; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: 1.5 + Math.random() * 1.5, speed: 0.3 + Math.random() * 0.5, angle: Math.random() * Math.PI * 2, glow: Math.random() * Math.PI * 2, glowSpeed: 0.03 + Math.random() * 0.04 });
          break;
        case 'meteors':
          for (let i = 0; i < 8; i++) items.push({ x: Math.random() * w * 1.5, y: Math.random() * h * 0.5, vx: -(3 + Math.random() * 4), vy: 3 + Math.random() * 4, life: Math.random(), length: 60 + Math.random() * 80 });
          break;
        case 'aurora':
          break;
      }
      itemsRef.current = items;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;
      switch (effect) {
        case 'particles': drawParticles(ctx, canvas, itemsRef.current, theme); break;
        case 'stars': drawStars(ctx, canvas, itemsRef.current, theme); break;
        case 'waves': drawWaves(ctx, canvas, itemsRef.current, theme, time); break;
        case 'snow': drawSnow(ctx, canvas, itemsRef.current, theme); break;
        case 'bubbles': drawBubbles(ctx, canvas, itemsRef.current, theme); break;
        case 'fireflies': drawFireflies(ctx, canvas, itemsRef.current, theme); break;
        case 'meteors': drawMeteors(ctx, canvas, itemsRef.current, theme); break;
        case 'aurora': drawAurora(ctx, canvas, time, theme); break;
      }
      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);
    setIsReady(true);
    return () => { window.removeEventListener('resize', resize); if (animationId) cancelAnimationFrame(animationId); };
  }, [enabled, theme, effect, isThreeEffect]);

  if (!enabled) return null;

  if (isThreeEffect) {
    return <ThreeScene effect={effect} theme={theme} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease',
      }}
    />
  );
}

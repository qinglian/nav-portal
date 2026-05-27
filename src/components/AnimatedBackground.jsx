import { useEffect, useRef, useState } from 'react';
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
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
    g.addColorStop(0, `rgba(${color}, 0.6)`);
    g.addColorStop(0.4, `rgba(${color}, 0.2)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 1)`; ctx.fill();
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x, dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${color}, ${0.25 * (1 - dist / 120)})`;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
  });
}

function drawStars(ctx, canvas, stars, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '255, 255, 255' : '0, 100, 200';
  stars.forEach(star => {
    star.twinkle += star.twinkleSpeed;
    const opacity = 0.5 + Math.sin(star.twinkle) * 0.5;
    const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 6);
    g.addColorStop(0, `rgba(${color}, ${opacity})`);
    g.addColorStop(0.3, `rgba(${color}, ${opacity * 0.3})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(star.x, star.y, star.radius * 6, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${opacity})`; ctx.fill();
    if (star.radius > 1.2) {
      ctx.beginPath();
      ctx.moveTo(star.x - star.radius * 4, star.y); ctx.lineTo(star.x + star.radius * 4, star.y);
      ctx.moveTo(star.x, star.y - star.radius * 4); ctx.lineTo(star.x, star.y + star.radius * 4);
      ctx.strokeStyle = `rgba(${color}, ${opacity * 0.7})`; ctx.lineWidth = 1; ctx.stroke();
    }
  });
}

function drawWaves(ctx, canvas, waves, theme, time) {
  const isDark = theme === 'dark';
  const colors = isDark
    ? ['rgba(0, 200, 255, 0.6)', 'rgba(150, 0, 255, 0.5)', 'rgba(0, 255, 150, 0.4)']
    : ['rgba(0, 150, 255, 0.5)', 'rgba(100, 50, 200, 0.4)', 'rgba(0, 200, 200, 0.35)'];
  waves.forEach((wave, index) => {
    ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 4) {
      ctx.lineTo(x, wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude);
    }
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath();
    const g = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, canvas.height);
    g.addColorStop(0, colors[index]);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 4) {
      const y = wave.y + Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors[index].replace(/[\d.]+\)$/, '1)'); ctx.lineWidth = 2; ctx.stroke();
  });
}

function drawSnow(ctx, canvas, snowflakes, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '220, 240, 255' : '180, 210, 255';
  snowflakes.forEach(flake => {
    flake.y += flake.speed; flake.x += Math.sin(flake.y * 0.008 + flake.rotation) * 0.6; flake.rotation += 0.015;
    if (flake.y > canvas.height) { flake.y = -15; flake.x = Math.random() * canvas.width; }
    ctx.save(); ctx.translate(flake.x, flake.y); ctx.rotate(flake.rotation);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, flake.radius * 2);
      ctx.strokeStyle = `rgba(${color}, ${flake.opacity})`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, flake.radius * 0.6); ctx.lineTo(-flake.radius * 0.4, flake.radius * 1.2);
      ctx.moveTo(0, flake.radius * 0.6); ctx.lineTo(flake.radius * 0.4, flake.radius * 1.2);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, flake.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${flake.opacity * 0.8})`; ctx.fill();
    ctx.restore();
  });
}

function drawBubbles(ctx, canvas, bubbles, theme) {
  const isDark = theme === 'dark';
  const colors = isDark ? ['80, 200, 255', '180, 100, 255', '100, 255, 200'] : ['0, 150, 255', '150, 100, 255', '50, 200, 200'];
  bubbles.forEach((b, i) => {
    b.y -= b.speed; b.x += Math.sin(b.y * 0.015 + i) * 0.4;
    if (b.y < -b.radius * 2) { b.y = canvas.height + b.radius * 2; b.x = Math.random() * canvas.width; }
    const color = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(b.x - b.radius * 0.35, b.y - b.radius * 0.35, 0, b.x, b.y, b.radius);
    g.addColorStop(0, `rgba(${color}, ${b.opacity})`);
    g.addColorStop(0.7, `rgba(${color}, ${b.opacity * 0.4})`);
    g.addColorStop(1, `rgba(${color}, ${b.opacity * 0.1})`);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${color}, ${b.opacity * 0.8})`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${b.opacity})`; ctx.fill();
  });
}

function drawFireflies(ctx, canvas, fireflies, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '200, 255, 100' : '150, 220, 50';
  fireflies.forEach(f => {
    f.x += Math.sin(f.angle) * f.speed; f.y += Math.cos(f.angle) * f.speed * 0.5;
    f.angle += (Math.random() - 0.5) * 0.15; f.glow += f.glowSpeed;
    const opacity = 0.4 + Math.sin(f.glow) * 0.5;
    if (f.x < -30) f.x = canvas.width + 30; if (f.x > canvas.width + 30) f.x = -30;
    if (f.y < -30) f.y = canvas.height + 30; if (f.y > canvas.height + 30) f.y = -30;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 8);
    g.addColorStop(0, `rgba(${color}, ${opacity})`);
    g.addColorStop(0.2, `rgba(${color}, ${opacity * 0.5})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius * 8, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, ${opacity + 0.3})`; ctx.fill();
  });
}

function drawMeteors(ctx, canvas, meteors, theme) {
  const isDark = theme === 'dark';
  const color = isDark ? '200, 220, 255' : '100, 150, 255';
  meteors.forEach(m => {
    m.x += m.vx; m.y += m.vy; m.life -= 0.006;
    if (m.life <= 0) {
      m.x = Math.random() * canvas.width * 1.5; m.y = -30;
      m.vx = -(4 + Math.random() * 5); m.vy = 4 + Math.random() * 5;
      m.life = 0.7 + Math.random() * 0.3; m.length = 80 + Math.random() * 100;
    }
    const tailX = m.x - m.vx * m.length * 0.25; const tailY = m.y - m.vy * m.length * 0.25;
    const g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
    g.addColorStop(0, `rgba(255,255,255,${m.life})`);
    g.addColorStop(0.3, `rgba(${color}, ${m.life * 0.8})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.stroke();
    const g2 = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 15);
    g2.addColorStop(0, `rgba(255,255,255,${m.life})`);
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(m.x, m.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = g2; ctx.fill();
  });
}

function drawAurora(ctx, canvas, time, theme) {
  const isDark = theme === 'dark';
  const colors = isDark
    ? ['rgba(0, 255, 150, 0.25)', 'rgba(0, 200, 255, 0.2)', 'rgba(180, 0, 255, 0.18)', 'rgba(0, 150, 255, 0.15)']
    : ['rgba(0, 180, 100, 0.15)', 'rgba(0, 150, 200, 0.12)', 'rgba(100, 0, 180, 0.1)', 'rgba(0, 120, 180, 0.08)'];
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 6) {
      const y = canvas.height * (0.25 + i * 0.08) +
        Math.sin(x * 0.002 + time * (0.3 + i * 0.15) + i * 1.2) * (60 + i * 20) +
        Math.sin(x * 0.005 + time * (0.2 + i * 0.1)) * 30 +
        Math.cos(x * 0.001 + time * 0.15 + i * 0.8) * 40;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height); ctx.closePath();
    ctx.fillStyle = colors[i]; ctx.fill();
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
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const isDark = theme === 'dark';
    let objects = [];

    if (effect === 'geometry') {
      // 精美几何体 - 使用材质发光效果
      const geometryData = [
        { geo: new THREE.IcosahedronGeometry(1.2, 1), pos: [-4, 2, -8], color: isDark ? 0x00ffff : 0x0099ff },
        { geo: new THREE.OctahedronGeometry(1, 0), pos: [3, -1, -6], color: isDark ? 0xff00ff : 0x9900ff },
        { geo: new THREE.TetrahedronGeometry(0.9, 0), pos: [-2, -2, -5], color: isDark ? 0x00ff88 : 0x00cc66 },
        { geo: new THREE.TorusGeometry(0.8, 0.25, 16, 32), pos: [4, 2, -7], color: isDark ? 0xff6600 : 0xcc4400 },
        { geo: new THREE.DodecahedronGeometry(0.9, 0), pos: [0, 3, -9], color: isDark ? 0xffff00 : 0xcccc00 },
        { geo: new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16), pos: [-3, 0, -4], color: isDark ? 0xff0066 : 0xcc0044 },
      ];

      geometryData.forEach((item, i) => {
        const mat = new THREE.MeshPhongMaterial({
          color: item.color,
          emissive: item.color,
          emissiveIntensity: 0.3,
          shininess: 100,
          transparent: true,
          opacity: 0.9,
          wireframe: false,
        });
        const mesh = new THREE.Mesh(item.geo, mat);
        mesh.position.set(...item.pos);
        mesh.userData = {
          rotSpeed: { x: 0.003 + i * 0.001, y: 0.005 + i * 0.002, z: 0.002 },
          floatSpeed: 0.8 + i * 0.1,
          floatOffset: i * 1.2,
          baseY: item.pos[1],
        };
        scene.add(mesh);
        objects.push(mesh);

        // 边框
        const edges = new THREE.EdgesGeometry(item.geo);
        const lineMat = new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.6 });
        const wireframe = new THREE.LineSegments(edges, lineMat);
        wireframe.position.copy(mesh.position);
        wireframe.rotation.copy(mesh.rotation);
        wireframe.userData = mesh.userData;
        scene.add(wireframe);
        objects.push(wireframe);
      });

      // 光源
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);
      const pointLight1 = new THREE.PointLight(isDark ? 0x00ffff : 0x0099ff, 1, 20);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);
      const pointLight2 = new THREE.PointLight(isDark ? 0xff00ff : 0x9900ff, 1, 20);
      pointLight2.position.set(-5, -3, 5);
      scene.add(pointLight2);

      camera.position.set(0, 0, 8);

    } else if (effect === 'galaxy') {
      // 华丽星系
      const count = 5000;
      const positions = new Float32Array(count * 3);
      const colors_arr = new Float32Array(count * 3);
      const coreColors = [
        new THREE.Color(isDark ? 0xffd700 : 0xffaa00), // 金色核心
        new THREE.Color(isDark ? 0xffffff : 0xffffee), // 白色核心
        new THREE.Color(isDark ? 0x00ffff : 0x0099ff), // 青色
      ];
      const armColors = [
        new THREE.Color(isDark ? 0x0066ff : 0x0044cc),
        new THREE.Color(isDark ? 0xff00ff : 0xcc00cc),
        new THREE.Color(isDark ? 0x00ffcc : 0x00cc99),
      ];

      for (let i = 0; i < count; i++) {
        const arm = i % 3;
        const t = i / count;
        const angle = t * Math.PI * 12 + arm * (Math.PI * 2 / 3);
        const radius = Math.pow(t, 0.6) * 12;
        const spread = (1 - t) * 2 + Math.random() * 0.5;

        positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * (1 - t) * 1.5;
        positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;

        const mixColor = new THREE.Color();
        if (t < 0.15) {
          mixColor.lerpColors(coreColors[0], coreColors[1], t / 0.15);
        } else {
          const armColor = armColors[arm];
          const blend = (t - 0.15) / 0.85;
          mixColor.lerpColors(coreColors[1], armColor, blend * 0.8);
        }
        colors_arr[i * 3] = mixColor.r;
        colors_arr[i * 3 + 1] = mixColor.g;
        colors_arr[i * 3 + 2] = mixColor.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors_arr, 3));
      const mat = new THREE.PointsMaterial({
        size: isDark ? 0.08 : 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      objects.push(points);

      // 中心光晕
      const glowGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0xffd700 : 0xffaa00,
        transparent: true,
        opacity: 0.6,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glow);

      // 外层光晕
      const outerGlowGeo = new THREE.SphereGeometry(1.5, 32, 32);
      const outerGlowMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0xff6600 : 0xff8800,
        transparent: true,
        opacity: 0.2,
      });
      const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
      scene.add(outerGlow);

      camera.position.set(0, 8, 14);
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
        objects.forEach(obj => {
          obj.rotation.x += obj.userData.rotSpeed.x;
          obj.rotation.y += obj.userData.rotSpeed.y;
          obj.rotation.z += obj.userData.rotSpeed.z;
          if (obj.userData.baseY !== undefined) {
            obj.position.y = obj.userData.baseY + Math.sin(t * obj.userData.floatSpeed + obj.userData.floatOffset) * 0.8;
          }
        });
      } else if (effect === 'galaxy') {
        objects.forEach(p => { p.rotation.y += 0.003; p.rotation.x += 0.001; });
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

const THREE_EFFECTS = ['geometry', 'galaxy'];

export default function AnimatedBackground({ enabled, theme, effect = 'particles' }) {
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const itemsRef = useRef([]);
  const isThreeEffect = THREE_EFFECTS.includes(effect);

  useEffect(() => {
    if (!enabled || isThreeEffect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId = null;
    let time = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initItems(); };

    const initItems = () => {
      const items = []; const w = canvas.width, h = canvas.height;
      switch (effect) {
        case 'particles':
          for (let i = 0; i < 45; i++) items.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, radius: Math.random() * 2.5 + 1 });
          break;
        case 'stars':
          for (let i = 0; i < 100; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: Math.random() * 2.5 + 0.8, twinkle: Math.random() * Math.PI * 2, twinkleSpeed: 0.015 + Math.random() * 0.03 });
          break;
        case 'waves':
          for (let i = 0; i < 3; i++) items.push({ y: h * (0.45 + i * 0.2), amplitude: 50 + i * 20, frequency: 0.0015 + i * 0.0003, speed: 0.025 + i * 0.01, offset: i * 2.5 });
          break;
        case 'snow':
          for (let i = 0; i < 70; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: Math.random() * 2.5 + 1.5, speed: 0.8 + Math.random() * 1.8, rotation: Math.random() * Math.PI * 2, opacity: 0.5 + Math.random() * 0.4 });
          break;
        case 'bubbles':
          for (let i = 0; i < 35; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: 10 + Math.random() * 25, speed: 0.4 + Math.random() * 0.8, opacity: 0.12 + Math.random() * 0.2 });
          break;
        case 'fireflies':
          for (let i = 0; i < 30; i++) items.push({ x: Math.random() * w, y: Math.random() * h, radius: 2 + Math.random() * 2, speed: 0.25 + Math.random() * 0.4, angle: Math.random() * Math.PI * 2, glow: Math.random() * Math.PI * 2, glowSpeed: 0.025 + Math.random() * 0.03 });
          break;
        case 'meteors':
          for (let i = 0; i < 6; i++) items.push({ x: Math.random() * w * 1.5, y: Math.random() * h * 0.4, vx: -(4 + Math.random() * 5), vy: 4 + Math.random() * 5, life: Math.random(), length: 80 + Math.random() * 100 });
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

    resize(); window.addEventListener('resize', resize); animationId = requestAnimationFrame(draw); setIsReady(true);
    return () => { window.removeEventListener('resize', resize); if (animationId) cancelAnimationFrame(animationId); };
  }, [enabled, theme, effect, isThreeEffect]);

  if (!enabled) return null;

  if (isThreeEffect) return <ThreeScene effect={effect} theme={theme} />;

  return (
    <canvas ref={canvasRef} className={styles.canvas} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease' }} />
  );
}

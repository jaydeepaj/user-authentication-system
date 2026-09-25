import React, { useRef, useEffect } from 'react';

/**
 * CyberBackground: Reusable high-performance canvas background.
 * Supported modes:
 * - 'particles': Zero-trust glowing mesh particles + subtle grid + aurora
 * - 'matrix': Matrix digital code rain + aurora
 * - 'grid': Flat cyber scanning grid + aurora
 * - 'aurora': Minimal drifting auroras for low distractions (ideal for dashboards)
 */
const CyberBackground = ({ mode = 'particles', opacity = 0.25 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // ────────────────────────────────────────────────────────────────
    // 1. PARTICLES MODE SETUP
    // ────────────────────────────────────────────────────────────────
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#00E5FF' : '#7C3AED',
      });
    }

    // ────────────────────────────────────────────────────────────────
    // 2. MATRIX MODE SETUP
    // ────────────────────────────────────────────────────────────────
    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    const drops = Array(columns).fill(1);
    const chars = '01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%-+*';

    // ────────────────────────────────────────────────────────────────
    // 3. DRIFTING AURORA GLOWS SETUP
    // ────────────────────────────────────────────────────────────────
    const auroras = [
      { x: width * 0.25, y: height * 0.2, vx: 0.15, vy: 0.1, radius: 350, colorStart: 'rgba(0, 229, 255, 0.05)', colorEnd: 'rgba(0, 0, 0, 0)' },
      { x: width * 0.75, y: height * 0.7, vx: -0.1, vy: -0.15, radius: 450, colorStart: 'rgba(124, 58, 237, 0.06)', colorEnd: 'rgba(0, 0, 0, 0)' },
      { x: width * 0.5, y: height * 0.5, vx: 0.08, vy: -0.08, radius: 400, colorStart: 'rgba(34, 211, 238, 0.04)', colorEnd: 'rgba(0, 0, 0, 0)' },
    ];

    let gridOffset = 0;

    // ────────────────────────────────────────────────────────────────
    // RENDERING LOOP
    // ────────────────────────────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- Draw Aurora Gradients ---
      auroras.forEach((a) => {
        // Move auroras using vx/vy + bounds check
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;

        // Draw radial glow
        const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius);
        grad.addColorStop(0, a.colorStart);
        grad.addColorStop(1, a.colorEnd);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- Draw Grid Background ---
      if (mode === 'grid' || mode === 'particles') {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.025)';
        ctx.lineWidth = 1;
        const gridSize = 60;

        // Scroll horizontal grid lines
        gridOffset = (gridOffset + 0.15) % gridSize;

        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = gridOffset; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Horizontal scanner line
        const scanY = (gridOffset * 15) % height;
        const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
        scanGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        scanGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.08)');
        scanGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 4, width, 8);
      }

      // --- Draw Particles (Mesh Network) ---
      if (mode === 'particles') {
        particles.forEach((p, idx) => {
          // Move
          p.x += p.vx;
          p.y += p.vy;

          // Boundary bounce
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          // Draw node
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0; // reset shadow

          // Connect nearby points
          for (let j = idx + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 110) {
              const alpha = (1 - dist / 110) * 0.12;
              ctx.strokeStyle = p.color === p2.color 
                ? p.color === '#00E5FF' ? `rgba(0, 229, 255, ${alpha})` : `rgba(124, 58, 237, ${alpha})`
                : `rgba(34, 211, 238, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });
      }

      // --- Draw Matrix Rain ---
      if (mode === 'matrix') {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Alternate text colors for cyber glow look
          ctx.fillStyle = i % 8 === 0 ? '#7C3AED' : '#00E5FF';

          ctx.fillText(text, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none transition-opacity duration-1000 z-0"
      style={{ opacity, mixBlendMode: 'screen', background: '#0A0F1C' }}
    />
  );
};

export default CyberBackground;

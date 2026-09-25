import React, { useRef, useEffect } from 'react';

/**
 * CyberShield: Highly interactive 3D-looking canvas illustration of a security shield.
 * Perfect for the authentication splash screen.
 * Displays:
 * - Concentric rotating zero-trust shield rings
 * - Radar sweep security sweep lines
 * - Orbiting sentinel nodes (databases, keys, user tokens)
 * - Attack vectors (dots) shooting toward the shield and getting blocked (dissolving)
 */
const CyberShield = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const centerX = width / 2;
    const centerY = height / 2 - 30;

    let angle1 = 0;
    let angle2 = 0;
    let sweepAngle = 0;

    // Sentinel nodes orbiting
    const orbitRadius = 155;
    const nodes = [
      { name: 'DB', angle: 0, speed: 0.007, color: '#00E5FF', size: 6, label: 'DATABASE' },
      { name: 'KEY', angle: 2.1, speed: 0.005, color: '#7C3AED', size: 6, label: 'MFA_AUTH' },
      { name: 'TOKEN', angle: 4.2, speed: 0.009, color: '#22D3EE', size: 6, label: 'JWT_ROTATION' },
    ];

    // Threat pings (attack vectors blocked by shield)
    const threats = [];
    const maxThreats = 8;

    const createThreat = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(width, height) * 0.7;
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        targetX: centerX,
        targetY: centerY,
        speed: Math.random() * 2.5 + 1.5,
        angle,
        size: Math.random() * 2.5 + 1.5,
        isBlocked: false,
        fade: 1.0,
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- Drifting Grid Base (Perspective Grid) ---
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // --- Draw Radar Sweep (Zero Trust Scanning) ---
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbitRadius + 50);
      sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      sweepGrad.addColorStop(0.8, 'rgba(0, 229, 255, 0.015)');
      sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.08)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, orbitRadius + 40, -0.3, 0.3);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
      sweepAngle += 0.008;

      // --- Draw Rotating Shield Rings ---
      // Outer Orbit Ring
      ctx.strokeStyle = 'rgba(124, 90, 237, 0.07)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Shield Ring (Dashed, Rotating Clockwise)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15, 5, 15]);
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, angle1, angle1 + Math.PI * 2);
      ctx.stroke();

      // Inner Shield Ring (Dashed, Rotating Counter-Clockwise)
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 12]);
      ctx.shadowColor = '#7C3AED';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 75, -angle2, -angle2 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
      ctx.shadowBlur = 0; // Reset shadow

      // Center Shield Core Glow
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 55);
      coreGrad.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
      coreGrad.addColorStop(0.6, 'rgba(124, 58, 237, 0.05)');
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
      ctx.fill();

      // Vector Shield Icon in the absolute center
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      // Shield path
      ctx.moveTo(centerX, centerY - 22);
      ctx.lineTo(centerX - 16, centerY - 14);
      ctx.lineTo(centerX - 16, centerY + 2);
      ctx.quadraticCurveTo(centerX - 16, centerY + 18, centerX, centerY + 25);
      ctx.quadraticCurveTo(centerX + 16, centerY + 18, centerX + 16, centerY + 2);
      ctx.lineTo(centerX + 16, centerY - 14);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw check inside shield
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY + 1);
      ctx.lineTo(centerX - 1, centerY + 6);
      ctx.lineTo(centerX + 8, centerY - 4);
      ctx.stroke();

      // --- Orbiting Nodes ---
      nodes.forEach((n) => {
        n.angle += n.speed;
        const nx = centerX + Math.cos(n.angle) * orbitRadius;
        const ny = centerY + Math.sin(n.angle) * orbitRadius;

        // Draw Connector Line from core to node
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Node Glow Ring
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, n.size + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Node fill
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
        ctx.fill();

        // Label text
        ctx.fillStyle = '#9098af';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, nx, ny - 14);
      });

      // --- Attack Vector Block Simulation ---
      if (threats.length < maxThreats && Math.random() < 0.015) {
        threats.push(createThreat());
      }

      threats.forEach((t, idx) => {
        if (!t.isBlocked) {
          // Travel toward core
          const dx = centerX - t.x;
          const dy = centerY - t.y;
          const distance = Math.hypot(dx, dy);

          if (distance <= 100) {
            // Impact with outer shield ring! Trigger block dissolve
            t.isBlocked = true;
          } else {
            t.x += Math.cos(t.angle) * t.speed;
            t.y += Math.sin(t.angle) * t.speed;

            // Draw vector trail
            const trailX = t.x - Math.cos(t.angle) * 20;
            const trailY = t.y - Math.sin(t.angle) * 20;

            const lineGrad = ctx.createLinearGradient(t.x, t.y, trailX, trailY);
            lineGrad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
            lineGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = t.size;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
          }
        } else {
          // Blocked: draw dissolving sparks
          t.fade -= 0.06;
          if (t.fade <= 0) {
            threats.splice(idx, 1);
            return;
          }

          ctx.strokeStyle = `rgba(0, 229, 255, ${t.fade})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(t.x, t.y, (1 - t.fade) * 16, 0, Math.PI * 2);
          ctx.stroke();

          // Text feedback
          ctx.fillStyle = `rgba(16, 185, 129, ${t.fade})`;
          ctx.font = '8px monospace';
          ctx.fillText('BLOCKED', t.x, t.y - 10);
        }
      });

      // Rotate angles
      angle1 += 0.005;
      angle2 += 0.008;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-96 max-w-lg flex items-center justify-center relative select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default CyberShield;

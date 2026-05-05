import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  size: number;
  phase: number;
  speed: number;
}

export function OpportunitySignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Configuration
    const IS_MOBILE = window.innerWidth < 768;
    const PARTICLE_COUNT = IS_MOBILE ? 400 : 1500;
    const COLORS = {
      base: '#1F2933',
      cyan: '#00F5D4',
      green: '#7CFF8A',
      amber: '#FFD166',
      red: '#FF6B6B',
      blue: '#7AA2FF',
    };

    // State
    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const resize = () => {
      // Clamp pixel ratio for performance
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Tilted elliptical field distribution
        const radius = Math.random() * (Math.random() > 0.5 ? 400 : 800) + 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.4; // flat disc

        const x = radius * Math.cos(theta) * Math.cos(phi);
        const y = radius * Math.sin(phi);
        const z = radius * Math.sin(theta) * Math.cos(phi);

        // Assign colors based on probability
        const rand = Math.random();
        let color = COLORS.base;
        let size = Math.random() * 1.5 + 0.5;
        
        if (rand > 0.98) {
          color = COLORS.cyan; // Primary signal
          size *= 1.5;
        } else if (rand > 0.95) {
          color = COLORS.green; // Ready
          size *= 1.5;
        } else if (rand > 0.93) {
          color = COLORS.amber; // Review
          size *= 1.2;
        } else if (rand > 0.92) {
          color = COLORS.blue; // Tracking
        } else if (rand > 0.915) {
          color = COLORS.red; // Risk (very rare)
        }

        particles.push({
          x, y, z,
          baseX: x,
          baseY: y,
          baseZ: z,
          color,
          size,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0005 + 0.0001
        });
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      // Center the origin, shift right to put the field behind the console preview
      const cx = width * 0.7;
      const cy = height * 0.5;

      // Sort particles by Z for fake depth
      particles.sort((a, b) => b.z - a.z);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Gentle drift if not reduced motion
        if (!prefersReducedMotion) {
          p.phase += p.speed;
          // Very slow breathing motion
          p.x = p.baseX + Math.cos(p.phase) * 50;
          p.y = p.baseY + Math.sin(p.phase * 0.8) * 30;
          p.z = p.baseZ + Math.sin(p.phase * 1.2) * 50;
        }

        // Perspective projection
        const focalLength = 1000;
        const zOff = p.z + 1000;
        
        if (zOff <= 0) continue; // Behind camera
        
        const scale = focalLength / zOff;
        
        // Rotation around Y axis to tilt the field
        const rotY = time * 0.0001; // extremely slow rotation
        const rx = p.x * Math.cos(rotY) - p.z * Math.sin(rotY);
        // We do not actually reassign z to not mess up sorting, just for rendering position
        
        const screenX = cx + rx * scale;
        const screenY = cy + p.y * scale;
        
        // Draw
        ctx.fillStyle = p.color;
        
        // Base particles are more transparent
        const alpha = p.color === COLORS.base ? 0.2 : 0.8;
        ctx.globalAlpha = alpha * Math.min(1, scale);
        
        const renderSize = Math.max(0.1, p.size * scale);
        ctx.beginPath();
        ctx.arc(screenX, screenY, renderSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    
    window.addEventListener('resize', resize);
    
    if (prefersReducedMotion) {
      draw(0); // Draw static frame
    } else {
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050608]">
      <canvas 
        ref={canvasRef} 
        className="block"
        style={{ opacity: 0.8 }}
      />
      {/* Masking gradients to fade edges and ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050608] via-transparent to-[#050608]/80"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050608] via-transparent to-[#050608]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(5,6,8,0.7),transparent_50%)]"></div>
    </div>
  );
}

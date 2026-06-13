import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SmhpScene } from './SmhpScene';

/* ─── Particle types ─────────────────────────────────────────────── */
type ParticlePhase = 'source' | 'waste' | 'captured' | 'h2';
type EnergyType = 'wind' | 'solar' | 'hydro';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: EnergyType;
  phase: ParticlePhase;
  alpha: number;
  decided: boolean;
  flashRed: number; // frames of red flash remaining
}

/* ─── EnergyCanvas ───────────────────────────────────────────────── */
const EnergyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* ── resize ─────────────────────────────────────────────────── */
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── animation state ────────────────────────────────────────── */
    let turbineAngle = 0;
    let hydroPhase   = 0;
    let capturedKg   = 0;
    let wastedMWh    = 0;

    /* ── particles ───────────────────────────────────────────────── */
    const PARTICLE_COUNT = 220;
    const particles: Particle[] = [];

    const spawnParticle = (scatter = false): Particle => {
      const W = canvas.width;
      const H = canvas.height;
      const type = (['wind', 'solar', 'hydro'] as EnergyType[])[Math.floor(Math.random() * 3)];

      // spawn y depends on energy type – staggered vertically
      const spawnYMap: Record<EnergyType, number> = {
        wind:  H * 0.22,
        solar: H * 0.50,
        hydro: H * 0.78,
      };
      const sy = spawnYMap[type] + (Math.random() - 0.5) * H * 0.12;
      const sx = scatter ? Math.random() * W * 0.40 : W * 0.02 + Math.random() * W * 0.05;

      return {
        x:        sx,
        y:        sy,
        vx:       0.6 + Math.random() * 0.8,
        vy:       (Math.random() - 0.5) * 0.4,
        life:     scatter ? Math.floor(Math.random() * 120) : 0,
        maxLife:  180 + Math.random() * 120,
        size:     1.5 + Math.random() * 2,
        type,
        phase:    'source',
        alpha:    scatter ? Math.random() * 0.6 : 0,
        decided:  false,
        flashRed: 0,
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(spawnParticle(true));
    }

    /* ── colour helpers ──────────────────────────────────────────── */
    const typeColor: Record<EnergyType, string> = {
      wind:  'rgba(148,163,184,0.7)',
      solar: 'rgba(251,191,36,0.8)',
      hydro: 'rgba(56,189,248,0.8)',
    };

    /* ── draw wind turbine ──────────────────────────────────────── */
    const drawTurbine = (cx: number, cy: number, r: number) => {
      const W = canvas.width;
      const showLabels = W >= 600;
      ctx.save();

      // pole
      ctx.strokeStyle = 'rgba(148,163,184,0.55)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + r * 1.8);
      ctx.stroke();

      // hub
      ctx.fillStyle   = 'rgba(148,163,184,0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // 3 blades
      for (let b = 0; b < 3; b++) {
        const angle = turbineAngle + (b * Math.PI * 2) / 3;
        const bx = cx + Math.cos(angle) * r;
        const by = cy + Math.sin(angle) * r;
        const perp = angle + Math.PI / 2;
        ctx.strokeStyle = 'rgba(148,163,184,0.65)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(perp) * r * 0.08,
          cy + Math.sin(perp) * r * 0.08,
        );
        ctx.quadraticCurveTo(
          cx + Math.cos(angle) * r * 0.55 + Math.cos(perp) * r * 0.22,
          cy + Math.sin(angle) * r * 0.55 + Math.sin(perp) * r * 0.22,
          bx, by,
        );
        ctx.stroke();
      }

      if (showLabels) {
        ctx.font         = 'bold 9px monospace';
        ctx.fillStyle    = 'rgba(148,163,184,0.6)';
        ctx.textAlign    = 'center';
        ctx.fillText('WIND', cx, cy + r * 2.2);
      }
      ctx.restore();
    };

    /* ── draw solar panel ────────────────────────────────────────── */
    const drawSolar = (cx: number, cy: number, size: number) => {
      const W = canvas.width;
      const showLabels = W >= 600;
      ctx.save();
      const cols = 3, rows = 3;
      const cellW = size / cols;
      const cellH = size / rows * 0.75;
      const ox = cx - size / 2;
      const oy = cy - (size * 0.75) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * cellW + 1;
          const y = oy + r * cellH + 1;
          const w = cellW - 2;
          const h = cellH - 2;
          ctx.fillStyle   = 'rgba(59,130,246,0.18)';
          ctx.strokeStyle = 'rgba(251,191,36,0.55)';
          ctx.lineWidth   = 0.8;
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
          // internal cross lines
          ctx.strokeStyle = 'rgba(251,191,36,0.25)';
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w / 2, y + h);
          ctx.moveTo(x, y + h / 2);
          ctx.lineTo(x + w, y + h / 2);
          ctx.stroke();
        }
      }
      if (showLabels) {
        ctx.font      = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(251,191,36,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('SOLAR', cx, oy + size * 0.75 + 12);
      }
      ctx.restore();
    };

    /* ── draw hydro waves ────────────────────────────────────────── */
    const drawHydro = (cx: number, cy: number, w: number) => {
      const W = canvas.width;
      const showLabels = W >= 600;
      ctx.save();
      const waveColors = [
        'rgba(56,189,248,0.65)',
        'rgba(56,189,248,0.45)',
        'rgba(56,189,248,0.30)',
      ];
      for (let wv = 0; wv < 3; wv++) {
        const yOff = (wv - 1) * 7;
        ctx.strokeStyle = waveColors[wv];
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        const steps = 40;
        for (let s = 0; s <= steps; s++) {
          const px = cx - w / 2 + (s / steps) * w;
          const py = cy + yOff + Math.sin(s * 0.5 + hydroPhase + wv * 0.8) * 4;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      if (showLabels) {
        ctx.font      = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(56,189,248,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('HYDRO', cx, cy + 20);
      }
      ctx.restore();
    };

    /* ── draw SMHP box ───────────────────────────────────────────── */
    const drawSMHP = (
      cx: number, cy: number, bw: number, bh: number, orbitAngle: number,
    ) => {
      ctx.save();

      // dashed border box
      ctx.strokeStyle = 'rgba(0,214,143,0.55)';
      ctx.lineWidth   = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
      ctx.setLineDash([]);

      // corner accent brackets
      const bl = 8;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      ctx.strokeStyle = 'rgba(0,214,143,0.85)';
      ctx.lineWidth   = 2;
      const corners: [number, number, number, number][] = [
        [bx, by, bl, bl],
        [bx + bw, by, -bl, bl],
        [bx, by + bh, bl, -bl],
        [bx + bw, by + bh, -bl, -bl],
      ];
      for (const [x, y, dx, dy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy);
        ctx.stroke();
      }

      // spinning orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(orbitAngle);
      ctx.strokeStyle = 'rgba(0,214,143,0.30)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, bw * 0.38, bh * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // dot on orbit
      const dotX = Math.cos(orbitAngle) * bw * 0.38;
      const dotY = Math.sin(orbitAngle) * bh * 0.22;
      ctx.fillStyle = 'rgba(0,214,143,0.9)';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // labels
      ctx.font      = 'bold 10px monospace';
      ctx.fillStyle = 'rgba(0,214,143,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText('SMHP', cx, cy - 3);

      ctx.font      = '8px monospace';
      ctx.fillStyle = 'rgba(0,214,143,0.55)';
      ctx.fillText('ELECTROLYSER', cx, cy + 9);

      ctx.restore();
    };

    /* ── counters ────────────────────────────────────────────────── */
    const drawCounters = (x: number, y: number) => {
      ctx.save();
      ctx.font      = '9px monospace';
      ctx.textAlign = 'right';

      ctx.fillStyle = 'rgba(0,214,143,0.75)';
      ctx.fillText(`CAPTURED: ${capturedKg.toFixed(2)} kg H₂`, x, y);

      ctx.fillStyle = 'rgba(255,80,50,0.70)';
      ctx.fillText(`WASTED: ${wastedMWh.toFixed(3)} MWh`, x, y + 14);

      ctx.restore();
    };

    /* ── main render loop ────────────────────────────────────────── */
    let raf = 0;
    let orbitAngle = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);

      const W = canvas.width;
      const H = canvas.height;
      const showLabels = W >= 600;

      // layout constants (derived from canvas size each frame)
      const gridLineX  = W * 0.50;       // dashed "GRID LIMIT" line
      const smhpCX     = W * 0.57;       // SMHP box centre-x
      const smhpCY     = H * 0.62;       // SMHP box centre-y (lower half)
      const smhpW      = W * 0.13;
      const smhpH      = H * 0.18;
      const iconZoneX  = W * 0.06;       // icon centre x
      const iconR      = Math.min(H * 0.07, 22);

      // icon Y centres
      const windCY  = H * 0.22;
      const solarCY = H * 0.50;
      const hydroCY = H * 0.78;

      // animate angles
      turbineAngle += 0.005;
      hydroPhase   += 0.05;
      orbitAngle   += 0.022;
      capturedKg   += 0.003;
      wastedMWh    += 0.008;

      /* clear */
      ctx.clearRect(0, 0, W, H);

      /* ── draw source icons ─────────────────────────────────────── */
      drawTurbine(iconZoneX, windCY,  iconR);
      drawSolar  (iconZoneX, solarCY, iconR * 2.2);
      drawHydro  (iconZoneX, hydroCY, iconR * 2.8);

      /* ── grid limit dashed vertical line ──────────────────────── */
      ctx.save();
      ctx.strokeStyle = 'rgba(255,64,32,0.50)';
      ctx.lineWidth   = 1.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(gridLineX, 0);
      ctx.lineTo(gridLineX, H);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showLabels) {
        ctx.font      = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(255,64,32,0.70)';
        ctx.textAlign = 'center';
        ctx.fillText('GRID LIMIT', gridLineX, 14);
      }
      ctx.restore();

      /* ── WASTED label (lower section near waste fall zone) ─────── */
      if (showLabels) {
        ctx.save();
        ctx.font      = '8px monospace';
        ctx.fillStyle = 'rgba(255,64,32,0.55)';
        ctx.textAlign = 'center';
        ctx.fillText('WASTED', gridLineX + 18, H * 0.88);
        ctx.restore();
      }

      /* ── draw SMHP box ─────────────────────────────────────────── */
      drawSMHP(smhpCX, smhpCY, smhpW, smhpH, orbitAngle);

      /* ── H₂ label at far right ─────────────────────────────────── */
      if (showLabels) {
        ctx.save();
        ctx.font      = 'bold 14px monospace';
        ctx.fillStyle = 'rgba(0,214,143,0.80)';
        ctx.textAlign = 'right';
        ctx.fillText('H₂', W - 10, H * 0.50);
        ctx.restore();
      }

      /* ── update & draw particles ──────────────────────────────── */
      for (const p of particles) {
        p.life++;
        const W2 = W;
        const H2 = H;

        /* ── phase: source ────────────────────────────────────────── */
        if (p.phase === 'source') {
          p.vx += 0.012;
          p.vy += Math.sin(p.life * 0.09) * 0.015;
          p.vx  = Math.min(p.vx, 1.8);
          p.vx *= 0.992;
          p.vy *= 0.975;
          p.alpha = Math.min(p.alpha + 0.025, 0.85);

          // decide fate at grid line
          if (p.x >= gridLineX && !p.decided) {
            p.decided = true;
            if (Math.random() < 0.40) {
              // 40% wasted: hit grid, fall
              p.phase    = 'waste';
              p.flashRed = 12;
              p.vx       = 0.2 + Math.random() * 0.3;
              p.vy       = 0.8 + Math.random() * 0.6;
            } else {
              // 60% captured: deflect into SMHP
              p.phase = 'captured';
              const dx = smhpCX - p.x;
              const dy = smhpCY - p.y;
              const d  = Math.sqrt(dx * dx + dy * dy) || 1;
              p.vx = (dx / d) * 1.6;
              p.vy = (dy / d) * 1.6;
            }
          }
        }

        /* ── phase: waste ─────────────────────────────────────────── */
        else if (p.phase === 'waste') {
          p.vy   += 0.06;   // gravity
          p.vx   *= 0.970;
          p.vy   *= 0.985;
          p.alpha = Math.max(p.alpha - 0.012, 0);
          if (p.flashRed > 0) p.flashRed--;
          if (p.y > H2 * 1.05 || p.alpha <= 0) {
            Object.assign(p, spawnParticle(false));
          }
        }

        /* ── phase: captured ──────────────────────────────────────── */
        else if (p.phase === 'captured') {
          const dx = smhpCX - p.x;
          const dy = smhpCY - p.y;
          const d  = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (dx / d) * 0.12;
          p.vy += (dy / d) * 0.12;
          p.vx *= 0.975;
          p.vy *= 0.975;
          p.alpha = Math.min(p.alpha + 0.02, 0.90);

          // inside SMHP box → transition to h2
          const inBox = Math.abs(p.x - smhpCX) < smhpW / 2
                     && Math.abs(p.y - smhpCY) < smhpH / 2;
          if (inBox) {
            p.phase = 'h2';
            p.vx    = 1.4 + Math.random() * 0.8;
            p.vy    = (Math.random() - 0.5) * 0.5;
          }
        }

        /* ── phase: h2 ────────────────────────────────────────────── */
        else if (p.phase === 'h2') {
          p.vx  = Math.max(p.vx - 0.004, 1.0);
          p.vy += Math.sin(p.life * 0.12) * 0.018;
          p.vy *= 0.978;
          if (p.x > W2 * 0.82) p.alpha = Math.max(p.alpha - 0.016, 0);
          if (p.x > W2 * 1.05 || p.alpha <= 0) {
            Object.assign(p, spawnParticle(false));
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        /* ── draw particle ─────────────────────────────────────────── */
        if (p.alpha <= 0.01) continue;

        let color: string;
        if (p.flashRed > 0) {
          color = `rgba(255,60,20,${p.alpha.toFixed(2)})`;
        } else if (p.phase === 'h2') {
          color = `rgba(0,214,143,${p.alpha.toFixed(2)})`;
        } else if (p.phase === 'captured') {
          // transition from source colour toward green
          color = `rgba(56,189,248,${p.alpha.toFixed(2)})`;
        } else if (p.phase === 'waste') {
          color = `rgba(255,80,40,${p.alpha.toFixed(2)})`;
        } else {
          // source colour based on type
          const base = typeColor[p.type];
          // bake alpha into the colour string
          const alphaBase = p.alpha.toFixed(2);
          if (p.type === 'wind')  color = `rgba(148,163,184,${alphaBase})`;
          else if (p.type === 'solar') color = `rgba(251,191,36,${alphaBase})`;
          else                         color = `rgba(56,189,248,${alphaBase})`;
          void base; // suppress unused warning
        }

        ctx.save();
        ctx.fillStyle = color;

        // soft glow for h2 particles
        if (p.phase === 'h2') {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          grad.addColorStop(0, `rgba(0,214,143,${p.alpha.toFixed(2)})`);
          grad.addColorStop(1, 'rgba(0,214,143,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* ── counters ─────────────────────────────────────────────── */
      if (showLabels) {
        drawCounters(W - 10, H - 28);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
};

/* ─── Hero ─────────────────────────────────────────────────────────── */
export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex flex-col justify-start overflow-hidden" style={{ minHeight: '72vh' }}>

      {/* WebGL background (R3F scene) */}
      <div className="absolute inset-0" style={{ background: '#070608' }}>
        <SmhpScene />
      </div>

      {/* Strong center vignette so text is readable */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(7,6,8,0.55) 0%, rgba(7,6,8,0.88) 60%, rgba(7,6,8,0.97) 100%)' }} />
      <div className="absolute bottom-0 inset-x-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #070608, transparent)' }} />
      <div className="absolute top-0 inset-x-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #070608, transparent)' }} />

      {/* CENTERED content */}
      <div className="relative z-10 flex flex-col items-center text-center"
        style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(88px, 6.5vw, 108px) 2rem 32px' }}>

        {/* Pre-headline tag */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
        >
          <div style={{ width: 24, height: 1, background: '#00D68F' }} />
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#00D68F' }}>
            Green Hydrogen · Global
          </span>
          <div style={{ width: 24, height: 1, background: '#00D68F' }} />
        </motion.div>

        {/* HEADLINE — DM Serif Display, much smaller than before */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(52px, 7.5vw, 104px)',
            fontWeight: 400,
            lineHeight: 1.02,
            color: '#F0EBE0',
            letterSpacing: '-0.01em',
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          Clean energy,<br />
          <span style={{
            background: 'linear-gradient(135deg, #00A86B 0%, #00D68F 50%, #00E5B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            captured.
          </span>
        </motion.h1>

        {/* ONE LINE tagline only — no long paragraph */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          style={{
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: 'clamp(18px, 1.8vw, 22px)',
            fontWeight: 300,
            color: '#A8A3B3',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
            marginBottom: 32,
            maxWidth: 580,
            textAlign: 'center',
          }}
        >
          We capture curtailed wind, solar and hydro — and convert it to green hydrogen at the source.
        </motion.p>

        {/* Two CTA buttons — centered row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}
        >
          <button
            onClick={() => navigate('/solution')}
            style={{
              background: 'linear-gradient(135deg, #00A86B, #00D68F)',
              color: '#0D0C0F',
              border: 'none',
              borderRadius: 9999,
              padding: '13px 28px',
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              boxShadow: '0 0 28px rgba(0,214,143,0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 48px rgba(0,214,143,0.45)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(0,214,143,0.25)'; }}
          >
            See how it works →
          </button>

          <button
            onClick={() => navigate('/contact')}
            style={{
              background: 'transparent',
              color: '#00D68F',
              border: '1px solid rgba(0,214,143,0.35)',
              borderRadius: 9999,
              padding: '12px 26px',
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,214,143,0.6)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,214,143,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,214,143,0.35)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Get in touch
          </button>
        </motion.div>

        {/* Partner badges removed — shown in dedicated <Partners /> strip below */}

      </div>
    </section>
  );
};

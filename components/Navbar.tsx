import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Problem',   to: '/problem'  },
  { label: 'Solution',  to: '/solution' },
  { label: 'Business',  to: '/business' },
  { label: 'Traction',  to: '/traction' },
  { label: 'Team',      to: '/team'     },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: scrolled ? 'rgba(7,6,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,214,143,0.08)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: scrolled ? '14px 32px' : '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'padding 0.4s ease' }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/fluxero-logo.svg" alt="Fluxero" style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
              const span = document.createElement('span');
              span.style.cssText = 'font-family:"IBM Plex Sans Condensed",sans-serif;font-weight:900;font-size:20px;letter-spacing:0.18em;color:#F0EBE0;';
              span.textContent = 'FLUXERO';
              (e.target as HTMLImageElement).parentElement!.appendChild(span);
            }}
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => {
            const isActive = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '0.03em',
                color: isActive ? '#00D68F' : 'rgba(148,163,184,0.85)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = '#F0EBE0'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.85)'; }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/calculator" style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 15, color: 'rgba(148,163,184,0.7)', textDecoration: 'none', letterSpacing: '0.03em' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0EBE0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.7)'}
          >
            Calculator
          </Link>
          <Link to="/contact" style={{
            background: 'linear-gradient(135deg, #00A86B, #00D68F)',
            color: '#0D0C0F',
            borderRadius: 9999,
            padding: '9px 20px',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: '"IBM Plex Sans", sans-serif',
            textDecoration: 'none',
            letterSpacing: '0.03em',
            boxShadow: '0 0 20px rgba(0,214,143,0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(0,214,143,0.35)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,214,143,0.15)'; }}
          >
            Contact us
          </Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Menu">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ display: 'block', height: 1, width: 24, background: '#F0EBE0', transition: 'all 0.3s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', height: 1, width: 16, background: '#00D68F', opacity: open ? 0 : 1, transition: 'all 0.3s' }} />
            <span style={{ display: 'block', height: 1, width: 24, background: '#F0EBE0', transition: 'all 0.3s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
            style={{ background: 'rgba(7,6,8,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,214,143,0.08)' }}
          >
            <div style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={l.to} style={{
                    display: 'block',
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: 28,
                    color: location.pathname === l.to ? '#00D68F' : '#F0EBE0',
                    textDecoration: 'none',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
                <Link to="/calculator" style={{ display: 'block', fontFamily: '"DM Serif Display", serif', fontSize: 28, color: '#F0EBE0', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Calculator
                </Link>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} style={{ marginTop: 20 }}>
                <Link to="/contact" style={{
                  display: 'block', textAlign: 'center',
                  background: 'linear-gradient(135deg, #00A86B, #00D68F)',
                  color: '#0D0C0F', borderRadius: 12, padding: '16px',
                  fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 600, fontSize: 17,
                  textDecoration: 'none',
                }}>
                  Contact us
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

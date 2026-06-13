import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hero }            from './components/Hero';
import { ProcessChips }    from './components/ProcessChips';
import { EnergyExplainer } from './components/EnergyExplainer';
import { Partners }        from './components/Partners';
import { Contact }         from './components/Contact';

const EXPLORE_CARDS = [
  { title: 'The Problem',     desc: 'Why 470 TWh of clean energy gets wasted every year',              to: '/problem'  },
  { title: 'Our Solution',    desc: 'Small Modular Hydrogen Plants that capture energy at source',      to: '/solution' },
  { title: 'Business Model',  desc: 'Unit economics, ROI calculator, and how we scale like software',  to: '/business' },
  { title: 'Traction',        desc: 'Nvidia Inception, Barclays Eagle Labs, and proof points',         to: '/traction' },
];

export default function Home() {
  return (
    <>
      <Hero />
      {/* Partners moved up — credibility ("Backed by & in partnership with")
          appears before the "How it works" section. */}
      <Partners />
      <ProcessChips />
      <EnergyExplainer />

      {/* Explore section */}
      <section style={{ background: '#0D0C0F', padding: '6rem 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 32, height: 1, background: '#00D68F' }} />
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#00D68F' }}>Explore</span>
            </div>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(28px, 3.5vw, 48px)', color: '#F0EBE0', marginBottom: 48, lineHeight: 1.1 }}>
              Everything you need to know.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {EXPLORE_CARDS.map((card, i) => (
              <motion.div key={card.to} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <Link to={card.to} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    background: '#131116',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderTop: '2px solid #00D68F',
                    borderRadius: 12,
                    padding: '28px',
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,214,143,0.3)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,214,143,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                  >
                    <h3 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#F0EBE0', marginBottom: 10, lineHeight: 1.2 }}>{card.title}</h3>
                    <p style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 16, color: '#A8A3B3', lineHeight: 1.6, fontWeight: 300, marginBottom: 20 }}>{card.desc}</p>
                    <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: '#00D68F', letterSpacing: '0.1em' }}>Explore →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Contact />
    </>
  );
}

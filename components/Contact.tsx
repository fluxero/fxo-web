import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FOUNDERS = [
  { name: 'Kieran Purvis',    role: 'CEO',  email: 'kieran@fluxero.uk',  initial: 'KP', color: '#00D0E8' },
  { name: 'Shivansh Mishra',  role: 'CIO',  email: 'shiv@fluxero.uk',    initial: 'SM', color: '#00D68F' },
  { name: 'Euan Thomson',     role: 'CTO',  email: 'euan@fluxero.uk',    initial: 'ET', color: '#00E5B8' },
];

export const Contact: React.FC = () => {
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');
  const [type,    setType]    = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      // FormSubmit.co — sends to founders@fluxero.uk team inbox
      // Individual founders CC'd for redundancy
      const res = await fetch('https://formsubmit.co/ajax/founders@fluxero.uk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name:    `${form.firstName} ${form.lastName}`.trim(),
          email:   form.email,
          type,
          message: form.message,
          _subject: `[Fluxero] New enquiry from ${form.firstName} ${form.lastName}`,
          _cc:     'shiv@fluxero.uk,kieran@fluxero.uk,euan@fluxero.uk',
          _captcha: 'false',
          _template: 'box',
        }),
      });

      const data = await res.json();
      if (data.success === 'true' || data.success === true) {
        setSent(true);
      } else {
        setError('Something went wrong. Please email us directly.');
      }
    } catch {
      setError('Something went wrong. Please email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <footer id="contact" className="relative overflow-hidden" style={{ background: '#0D0C0F' }}>
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 600, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,214,143,0.4), transparent)', filter: 'blur(1px)' }} />
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(0,214,143,0.04) 0%, transparent 60%)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-14">

        {/* Big headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2
            className="font-display font-black text-cream mb-6"
            style={{ fontSize: 'clamp(44px, 7vw, 108px)', lineHeight: 0.9 }}
          >
            STOP WASTING<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #00D68F 0%, #00E5B8 50%, #00D0E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              CLEAN ENERGY.
            </span>
          </h2>
          <p className="font-body text-mist text-xl font-light max-w-xl mx-auto leading-relaxed">
            Whether you're a renewable generator, energy developer, or investor —
            all three founders are directly reachable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">

          {/* Left — contact info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* General team email */}
            <a
              href="mailto:founders@fluxero.uk"
              className="group flex items-center gap-4 mb-6 rounded-xl transition-all"
              style={{
                background: 'rgba(0,214,143,0.06)',
                border: '1px solid rgba(0,214,143,0.18)',
                padding: '16px 20px',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,214,143,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,214,143,0.06)')}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,214,143,0.12)', border: '1px solid rgba(0,214,143,0.28)' }}>
                <span style={{ color: '#00E5B8', fontSize: 17 }}>✉</span>
              </div>
              <div className="flex-1">
                <p className="font-mono text-base uppercase tracking-[0.2em] mb-0.5" style={{ color: '#475569' }}>General enquiries</p>
                <p className="font-body font-semibold text-xl" style={{ color: '#00E5B8' }}>founders@fluxero.uk</p>
              </div>
              <span className="font-mono text-base text-steel opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </a>

            {/* Individual founder emails */}
            <div
              className="mb-10"
              style={{
                background: 'rgba(19,17,22,0.5)',
                border: '1px solid rgba(0,214,143,0.1)',
                borderRadius: 14,
                padding: '24px',
              }}
            >
              <p className="font-mono text-base uppercase tracking-[0.2em] mb-5" style={{ color: '#475569' }}>Reach a founder directly</p>
              <div className="space-y-3">
                {FOUNDERS.map(f => (
                  <a
                    key={f.email}
                    href={`mailto:${f.email}`}
                    className="flex items-center gap-4 group transition-all rounded-lg p-3 -mx-3"
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,214,143,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-mono text-lg font-bold"
                      style={{ background: `${f.color}15`, border: `1px solid ${f.color}30`, color: f.color }}
                    >
                      {f.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-cream text-lg">{f.name}</p>
                      <p className="font-mono text-base" style={{ color: f.color }}>{f.email}</p>
                    </div>
                    <span className="font-mono text-base text-steel flex-shrink-0">{f.role}</span>
                    <span className="font-mono text-base text-steel opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Book a call */}
            <a
              href={`mailto:kieran@fluxero.uk?subject=Meeting%20Request%20%E2%80%94%20Fluxero&body=Hi%20Kieran%2C%0A%0AI'd%20like%20to%20schedule%2030%20minutes%20to%20discuss%20...`}
              className="group flex items-start gap-5 mb-10"
              style={{ textDecoration: 'none' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,214,143,0.06)', border: '1px solid rgba(0,214,143,0.15)' }}>
                <span style={{ color: '#00D68F', fontSize: 20 }}>◷</span>
              </div>
              <div>
                <p className="font-mono text-base text-steel uppercase tracking-widest mb-1">Book a call</p>
                <p className="font-body font-semibold text-cream text-2xl group-hover:text-green transition-colors">
                  Schedule 30 min with the team →
                </p>
              </div>
            </a>


          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: '#131116',
              border: '1px solid rgba(0,214,143,0.08)',
              borderRadius: 14,
              padding: '40px',
            }}
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                  style={{ background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.3)' }}
                >
                  <span style={{ color: '#00D68F', fontSize: 24 }}>✓</span>
                </div>
                <h4 className="font-display font-black text-cream text-2xl mb-3">Message sent.</h4>
                <p className="font-body text-mist text-lg">All three founders have been notified. We'll reply within 24 hours.</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-base text-steel uppercase tracking-widest block mb-2">First name</label>
                    <input type="text" required value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full font-body text-cream rounded-lg px-4 py-3 border placeholder-steel/40 focus:border-green/40 transition-colors"
                      style={{ background: 'rgba(13,12,15,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EBE0', fontSize: '1rem' }}
                      placeholder="First name" />
                  </div>
                  <div>
                    <label className="font-mono text-base text-steel uppercase tracking-widest block mb-2">Last name</label>
                    <input type="text" required value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full font-body text-cream rounded-lg px-4 py-3 border placeholder-steel/40 focus:border-green/40 transition-colors"
                      style={{ background: 'rgba(13,12,15,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EBE0', fontSize: '1rem' }}
                      placeholder="Last name" />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-base text-steel uppercase tracking-widest block mb-2">Email</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full font-body text-cream rounded-lg px-4 py-3 border placeholder-steel/40 focus:border-green/40 transition-colors"
                    style={{ background: 'rgba(13,12,15,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EBE0', fontSize: '1rem' }}
                    placeholder="you@company.com" />
                </div>

                <div>
                  <label className="font-mono text-base text-steel uppercase tracking-widest block mb-2">I am a...</label>
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full font-body rounded-lg px-4 py-3 border focus:border-green/40 transition-colors cursor-pointer appearance-none"
                    style={{ background: 'rgba(13,12,15,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EBE0', fontSize: '1rem' }}>
                    <option value="">Select one</option>
                    <option value="generator">Renewable energy generator</option>
                    <option value="developer">Energy developer / project developer</option>
                    <option value="investor">Investor</option>
                    <option value="industrial">Industrial park / hydrogen offtaker</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-base text-steel uppercase tracking-widest block mb-2">Message</label>
                  <textarea rows={4} required value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full font-body text-cream rounded-lg px-4 py-3 border focus:border-green/40 transition-colors resize-none placeholder-steel/40"
                    style={{ background: 'rgba(13,12,15,0.8)', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EBE0', fontSize: '1rem' }}
                    placeholder="Tell us about your site, interest, or project..." />
                </div>

                {error && (
                  <p className="font-mono text-base" style={{ color: '#EF4444' }}>
                    {error}{' '}
                    <a href="mailto:founders@fluxero.uk" style={{ color: '#00D68F' }}>founders@fluxero.uk</a>
                  </p>
                )}

                <button type="submit" disabled={sending}
                  className="w-full font-body font-semibold py-4 rounded-lg transition-all tracking-wide text-lg hover:scale-[1.01]"
                  style={{
                    background: sending ? 'rgba(0,214,143,0.3)' : 'linear-gradient(135deg, #00A86B, #00D68F)',
                    color: '#F0EBE0',
                    border: 'none',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    boxShadow: sending ? 'none' : '0 0 20px rgba(0,214,143,0.15)',
                  }}
                >
                  {sending ? 'Sending…' : 'Send message →'}
                </button>

                <p className="font-mono text-[10px] text-center" style={{ color: '#334155' }}>
                  Sends to all three founders · Replies within 24 hours
                </p>
              </form>
            )}
          </motion.div>
        </div>

        {/* Footer bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <img src="/fluxero-logo.svg" alt="Fluxero" className="h-6 w-auto object-contain opacity-60"
              onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
            <span className="font-mono text-base text-steel">© 2025 Fluxero Ltd</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="mailto:founders@fluxero.uk"
              className="font-mono text-base hover:text-green transition-colors"
              style={{ color: '#475569', textDecoration: 'none' }}>
              founders@fluxero.uk
            </a>
            {FOUNDERS.map(f => (
              <a key={f.email} href={`mailto:${f.email}`}
                className="font-mono text-base hover:text-green transition-colors"
                style={{ color: '#334155', textDecoration: 'none' }}>
                {f.email}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

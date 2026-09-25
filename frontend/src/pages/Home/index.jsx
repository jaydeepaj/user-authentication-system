import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import CyberBackground from '../../components/CyberBackground/CyberBackground';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- Stat Counter Component ---
const StatCounter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = parseFloat(value);
    if (isNaN(target)) {
      setCount(value);
      return;
    }
    let start = 0;
    const duration = 2000;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = progress * (target - start) + start;
      setCount(target % 1 === 0 ? Math.floor(current) : current.toFixed(1));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span>{count}{suffix}</span>;
};

// --- 3D Hover Tilt Component ---
const TiltContainer = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const handleMouseMove = (e) => {
    const card = containerRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Limit rotation to max 8 degrees
    const factor = 20;
    card.style.transform = `perspective(1000px) rotateX(${-y / factor}deg) rotateY(${x / factor}deg) scale(1.01)`;
  };

  const handleMouseLeave = () => {
    const card = containerRef.current;
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-all duration-300 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
};

const features = [
  {
    icon: '🔐',
    title: 'Multi-Factor Authentication',
    description: 'TOTP via authenticator apps, automated email token fallbacks, and recovery codes.',
    color: 'cyan',
  },
  {
    icon: '🔄',
    title: 'Dynamic JWT Rotation',
    description: 'Secure HTTP-only refresh tokens with replay detection and instant session revokes.',
    color: 'purple',
  },
  {
    icon: '🛡️',
    title: 'Threat Detection Feed',
    description: 'Real-time monitoring of malicious logins, lockout states, and validation audits.',
    color: 'red',
  },
  {
    icon: '📋',
    title: 'Granular Audit Logging',
    description: 'Immutable database logging of every authentication event and organization-level changes.',
    color: 'green',
  },
  {
    icon: '💻',
    title: 'Live Device Monitoring',
    description: 'Instantly view active login states with browser, OS, IP address, and remote termination.',
    color: 'yellow',
  },
  {
    icon: '⚡',
    title: 'Sub-50ms Auth Engine',
    description: 'Optimized Zero-Trust architecture built on Node.js, Express, and MongoDB.',
    color: 'cyan',
  },
];

const colorMap = {
  cyan:   'from-primary-500/10 to-primary-500/5 border-primary-500/20 text-primary-400 hover:border-primary-500/50',
  purple: 'from-secondary-500/10 to-secondary-500/5 border-secondary-500/20 text-secondary-400 hover:border-secondary-500/50',
  red:    'from-danger-500/10 to-danger-500/5 border-danger-500/20 text-danger-400 hover:border-danger-500/50',
  green:  'from-success-500/10 to-success-500/5 border-success-500/20 text-success-400 hover:border-success-500/50',
  yellow: 'from-warning-500/10 to-warning-500/5 border-warning-500/20 text-warning-400 hover:border-warning-500/50',
};

const mockGraphData = [
  { value: 120 }, { value: 180 }, { value: 150 }, { value: 310 },
  { value: 240 }, { value: 390 }, { value: 320 }, { value: 480 },
  { value: 410 }, { value: 520 }
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [bgMode, setBgMode] = useState('particles');

  const testimonials = [
    {
      quote: "SecureAuth X enabled our team to roll out Zero-Trust authentication and MFA in less than a week. The threat feeds are absolute lifesavers.",
      author: "Elena Rostova",
      role: "VP of Cyber Security, CloudFlow",
      initials: "ER"
    },
    {
      quote: "The interface is gorgeous, and the underlying JWT rotation protects our API endpoints with absolute certainty. Apple-level design engineering.",
      author: "Marcus Vance",
      role: "Lead Infrastructure Architect, DevScale",
      initials: "MV"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-hidden relative">
      <CyberBackground mode={bgMode} opacity={0.35} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-dark-800 bg-dark-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-dark-900">
              <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" fill="currentColor"/>
              <path d="M9 12l2 2 4-4" stroke="#0c101b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-wider text-gradient">SECUREAUTH X</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-dark-950/80 border border-dark-700/60 rounded-xl font-mono text-xs">
          {[
            { id: 'particles', label: '✨ Particles' },
            { id: 'matrix', label: '💻 Matrix Rain' },
            { id: 'grid', label: '🌐 Cyber Grid' },
            { id: 'aurora', label: '🌌 Aurora' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setBgMode(mode.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                bgMode === mode.id
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 shadow-glow-sm'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm font-mono tracking-wide">
              GO TO DASHBOARD
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm font-mono text-xs tracking-wider">SIGN IN</Link>
              <Link to="/register" className="btn btn-primary btn-sm font-mono text-xs tracking-wider">GET STARTED</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 lg:px-20 pt-20 pb-16 max-w-7xl mx-auto gap-12">
        {/* Left column */}
        <div className="flex-1 text-left">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs font-mono mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
            SECURE NODE IDENTITY VERIFICATION
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight"
          >
            Future-Proof Identity.
            <br />
            <span className="text-gradient">Zero Trust Security.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-dark-300 text-base sm:text-lg max-w-xl mb-8 leading-relaxed"
          >
            Protect enterprise accounts with rotatable credentials, multi-factor codes, 
            session threat detection, and comprehensive organization analytics dashboards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <Link to="/register" className="btn btn-primary btn-lg font-mono text-xs tracking-wider shadow-glow-cyan">
              INITIALIZE GATEWAY ACCESS
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg font-mono text-xs tracking-wider">
              ACCESS CONSOLE
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 border-t border-dark-800 pt-8"
          >
            {[
              { value: '99.9', suffix: '%', label: 'UPTIME SLA' },
              { value: '180', suffix: 'K+', label: 'THREATS DEFENDED' },
              { value: '45', suffix: 'ms', label: 'AUTH LATENCY' },
            ].map((stat) => (
              <div key={stat.label} className="text-left font-mono">
                <p className="text-2xl font-bold text-gradient">
                  <StatCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[10px] text-dark-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right column - Interactive 3D Tilting Preview */}
        <div className="flex-1 w-full max-w-xl">
          <TiltContainer className="glass-card border border-white/10 p-4 shadow-card-hover rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-4">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-danger-500" />
                <span className="w-3 h-3 rounded-full bg-warning-500" />
                <span className="w-3 h-3 rounded-full bg-success-500" />
              </div>
              <span className="font-mono text-[9px] text-dark-400">SECUREAUTH_CON_PANEL.SH</span>
            </div>
            
            {/* Mock Dashboard Widget preview */}
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-950/80 p-3 rounded-xl border border-dark-800 text-left">
                  <span className="text-[10px] text-dark-400">THREAT STATUS</span>
                  <p className="text-sm font-bold text-success-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                    SECURE_NODE_OK
                  </p>
                </div>
                <div className="bg-dark-950/80 p-3 rounded-xl border border-dark-800 text-left">
                  <span className="text-[10px] text-dark-400">ACTIVE SCRANS</span>
                  <p className="text-sm font-bold text-primary-400 mt-1">12,492 / SEC</p>
                </div>
              </div>

              {/* Glowing Area Chart preview */}
              <div className="bg-dark-950/80 p-4 rounded-xl border border-dark-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-dark-400">INTRUSION ATTEMPTS INJECTED</span>
                  <span className="text-[10px] text-danger-400">BLOCKED</span>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockGraphData}>
                      <defs>
                        <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#glowColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mock System Logs */}
              <div className="bg-dark-950/90 p-3 rounded-xl border border-dark-800 text-left text-[10px] space-y-1 text-dark-300">
                <p><span className="text-success-400">[OK]</span> JWT ROTATION VERIFIED FOR USER_SESSION: sax_9821</p>
                <p><span className="text-primary-400">[INFO]</span> MFA COMPLETED FOR ROOT_ADMINISTRATOR</p>
                <p><span className="text-danger-400">[BLOCKED]</span> RATE_LIMIT BLOCK TO IP: 198.51.100.42</p>
              </div>
            </div>
          </TiltContainer>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 sm:px-12 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Defensive Security, <span className="text-gradient">Engineered Simply</span>
          </h2>
          <p className="text-dark-300 text-sm max-w-lg mx-auto">
            Zero trust verification infrastructure designed with Apple-level simplicity for enterprise organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`p-6 rounded-2xl border transition-all duration-300 bg-gradient-to-br ${colorMap[feature.color]} flex flex-col items-start text-left group`}
            >
              <div className="text-3xl p-3 bg-dark-950/60 rounded-xl border border-white/5 mb-5 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-2 group-hover:text-primary-400 transition-colors">{feature.title}</h3>
              <p className="text-dark-300 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 sm:px-12 py-16 max-w-4xl mx-auto text-center border-t border-dark-800">
        <div className="mb-8">
          <span className="font-mono text-xs text-secondary-400">TESTIMONIAL LOGS</span>
        </div>
        
        <div className="glass-card p-8 sm:p-12 border border-white/5 shadow-card rounded-3xl relative">
          <div className="text-lg sm:text-xl text-dark-100 font-medium italic leading-relaxed mb-8">
            "{testimonials[activeTestimonial].quote}"
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-dark-900 font-bold">
              {testimonials[activeTestimonial].initials}
            </div>
            <div className="text-left font-mono">
              <p className="text-sm font-semibold text-white">{testimonials[activeTestimonial].author}</p>
              <p className="text-[10px] text-dark-400">{testimonials[activeTestimonial].role}</p>
            </div>
          </div>

          {/* Testimonial dot switchers */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeTestimonial === idx ? 'bg-primary-500 w-6' : 'bg-dark-600'}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 sm:px-12 py-20 max-w-4xl mx-auto">
        <div className="glass-card p-10 sm:p-14 text-center rounded-3xl overflow-hidden border border-primary-500/20 relative shadow-glow-cyan/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Authorize Your Systems Today
            </h2>
            <p className="text-dark-300 text-sm mb-10 max-w-md mx-auto">
              Join enterprise organizations securing their workforce nodes using zero-trust protocols.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary btn-lg font-mono text-xs tracking-wider shadow-glow-cyan">
                INITIALIZE SECURE ACCOUNT
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg font-mono text-xs tracking-wider">
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-800 py-8 text-center text-dark-500 text-[10px] font-mono tracking-widest bg-dark-950/30">
        © {new Date().getFullYear()} SECUREAUTH X // SYSTEM DESIGN VERIFIED BY INTERNAL AUDIT.
      </footer>
    </div>
  );
};

export default Home;


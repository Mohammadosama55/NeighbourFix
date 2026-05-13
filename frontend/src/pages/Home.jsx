import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';
import api from '../api/axios';
import './Home.css';

const CAT_ICONS  = { road:'🛣️', water:'💧', garbage:'🗑️', drainage:'🚿', power:'⚡', other:'📋' };
const HERO_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80';

const SEED_TESTIMONIALS = [
  {
    _id: 's1', rating: 5, name: 'Aarav Patel',
    role: 'Resident, Bangalore',
    message: 'NeighbourFix helped me report a huge pothole near my street. The issue was resolved in just 3 days — I couldn\'t believe how fast the ward team responded!',
  },
  {
    _id: 's2', rating: 5, name: 'Meera Sharma',
    role: 'Teacher, Chennai',
    message: 'I love how simple and fast this platform is. I reported broken streetlights on my road and within a week, they were all fixed. Clean streets and working lights again!',
  },
  {
    _id: 's3', rating: 4, name: 'Rajesh Kumar',
    role: 'Shop Owner, Mumbai',
    message: 'The drainage outside my shop was overflowing for months. After posting on NeighbourFix and getting 12 upvotes, the authorities finally came and fixed it properly.',
  },
  {
    _id: 's4', rating: 5, name: 'Priya Singh',
    role: 'Homemaker, Delhi',
    message: 'The upvoting feature is brilliant. My neighbours all rallied together and our garbage collection frequency doubled. Real community power in action!',
  },
  {
    _id: 's5', rating: 5, name: 'Suresh Nair',
    role: 'Engineer, Kochi',
    message: 'Transparent, fast, and actually works. I can track my complaint\'s status live. No more calling the corporation helpline and waiting on hold for hours.',
  },
  {
    _id: 's6', rating: 4, name: 'Divya Reddy',
    role: 'Student, Hyderabad',
    message: 'Reported a water leakage near my college. The GPS pin feature made it so easy for the authorities to find the exact spot. Fixed within 5 days!',
  },
];

const STAGGER_DELAYS = [0, 80, 160, 240, 320, 400];

export default function Home() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [liveFeed,     setLiveFeed]     = useState([]);
  const [stats,        setStats]        = useState({ total: 0, reported: 0, inProgress: 0, resolved: 0 });
  const [wardInput,    setWardInput]    = useState('');
  const [testimonials, setTestimonials] = useState(SEED_TESTIMONIALS);

  useEffect(() => {
    api.get('/complaints').then(res => {
      const all = res.data;
      setStats({
        total:      all.length,
        reported:   all.filter(c => c.status === 'reported').length,
        inProgress: all.filter(c => c.status === 'in_progress').length,
        resolved:   all.filter(c => c.status === 'resolved').length,
      });
      setLiveFeed([...all].filter(c => c.status === 'resolved').slice(0, 3));
    }).catch(() => {});

    api.get('/feedback').then(res => {
      const real = res.data.filter(f => f.rating >= 4 && f.message && f.name);
      if (real.length >= 3) setTestimonials(real.slice(0, 6));
    }).catch(() => {});
  }, []);

  const handleWardSearch = (e) => {
    e.preventDefault();
    const ward = wardInput.trim();
    if (!ward) return;
    navigate(`/complaints?ward=${encodeURIComponent(ward)}`);
  };

  return (
    <div className="home-page">

      {/* ══════════════════════════
          HERO
         ══════════════════════════ */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-inner">

            <ScrollReveal className="hero-left" direction="up" delay={0}>
              <div className="hero-eyebrow">🇮🇳 Civic Platform for Indian Residents</div>

              <h1>
                Report Local Issues.<br />
                <span>Make Your City Better.</span>
              </h1>

              <p className="hero-sub">
                NeighbourFix helps citizens report and track local civic issues like potholes, broken lights, and garbage collection. Join thousands making their communities better.
              </p>

              <div className="hero-cta">
                {user ? (
                  <Link to="/create" className="btn-primary-lg">Get Started →</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary-lg">Get Started →</Link>
                    <a href="#how-it-works" className="btn-outline-lg">
                      <span className="play-icon">▶</span>
                      How It Works
                    </a>
                  </>
                )}
              </div>

              <div className="hero-social-proof">
                <div className="stars">
                  <span className="star full">★</span><span className="star full">★</span>
                  <span className="star full">★</span><span className="star full">★</span>
                  <span className="star half">★</span>
                </div>
                <span className="proof-text"><strong>4.8/5</strong> from 2,500+ users</span>
              </div>

              {liveFeed.length > 0 && (
                <div className="live-feed">
                  <div className="live-feed-header">
                    <span className="live-feed-dot"></span>
                    <span className="live-feed-label">Recently Resolved</span>
                  </div>
                  <div className="live-feed-cards">
                    {liveFeed.map(c => {
                      const daysAgo = Math.floor((Date.now() - new Date(c.createdAt)) / 86400000);
                      const timeStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
                      return (
                        <Link key={c._id} to={`/complaint/${c._id}`} className="lf-card">
                          <span className="lf-icon">{CAT_ICONS[c.category] || '📋'}</span>
                          <div className="lf-body">
                            <span className="lf-title">{c.title}</span>
                            <span className="lf-meta">Ward {c.wardNumber} · {timeStr}</span>
                          </div>
                          <span className="lf-check">✓</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </ScrollReveal>

            <ScrollReveal className="hero-right" direction="right" delay={120}>
              <div className="hero-img-wrap">
                <img src={HERO_IMAGE} alt="City skyline — NeighbourFix civic platform" loading="eager" />
                <div className="live-demo-badge">
                  <span className="live-dot"></span>
                  Live Demo
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════
          HOW IT WORKS
         ══════════════════════════ */}
      <section id="how-it-works" className="how-section">
        <div className="container">
          <ScrollReveal direction="up" delay={0}>
            <div className="how-header">
              <p className="section-eyebrow">How It Works</p>
              <h2>Three steps to fix your neighbourhood</h2>
              <p className="section-sub">No paperwork. No queues. Just report and watch it get resolved.</p>
            </div>
          </ScrollReveal>

          <div className="how-steps">
            <ScrollReveal className="how-step" direction="up" delay={0}>
              <div className="step-num">1</div>
              <div className="step-icon">📍</div>
              <h3>Pin It</h3>
              <p>Take a photo and drop a GPS pin on the map. Your report is logged instantly with full location data.</p>
            </ScrollReveal>
            <div className="how-connector">→</div>
            <ScrollReveal className="how-step" direction="up" delay={120}>
              <div className="step-num">2</div>
              <div className="step-icon">▲</div>
              <h3>Rally Votes</h3>
              <p>Neighbours upvote issues they care about. 10 upvotes triggers an automatic escalation to your ward officer.</p>
            </ScrollReveal>
            <div className="how-connector">→</div>
            <ScrollReveal className="how-step" direction="up" delay={240}>
              <div className="step-num">3</div>
              <div className="step-icon">✅</div>
              <h3>Watch It Get Fixed</h3>
              <p>Track status updates in real time. When resolved, you get notified and the ward's accountability score updates.</p>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="up" delay={80}>
            <div className="ward-hook">
              <div className="ward-hook-content">
                <div className="ward-hook-icon">🔍</div>
                <div>
                  <h3>Check Your Area</h3>
                  <p>Enter your ward number to instantly see all civic issues reported near you.</p>
                </div>
              </div>
              <form className="ward-hook-form" onSubmit={handleWardSearch}>
                <input
                  type="text"
                  className="ward-hook-input"
                  placeholder="Enter Ward # (e.g. 16)"
                  value={wardInput}
                  onChange={e => setWardInput(e.target.value)}
                />
                <button type="submit" className="ward-hook-btn">
                  See Issues Near Me →
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════
          TESTIMONIALS
         ══════════════════════════ */}
      <section className="testimonials-section">
        <div className="container">
          <ScrollReveal direction="up" delay={0}>
            <div className="testimonials-header">
              <p className="section-eyebrow">What Citizens Say</p>
              <h2>Real stories from community members<br />who are making a difference</h2>
              <p className="section-sub">
                Thousands of residents across India are using NeighbourFix to hold their wards accountable.
              </p>
            </div>
          </ScrollReveal>

          <div className="testimonials-grid">
            {testimonials.map((t, idx) => {
              const initials = (t.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const stars = Math.round(t.rating || 5);
              return (
                <ScrollReveal
                  key={t._id}
                  className="tcard hover-lift"
                  direction="up"
                  delay={STAGGER_DELAYS[idx % 3]}
                >
                  <div className="tcard-quote">"</div>
                  <p className="tcard-message">"{t.message}"</p>
                  <div className="tcard-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < stars ? 'tstar filled' : 'tstar'}>★</span>
                    ))}
                  </div>
                  <div className="tcard-author">
                    <div className="tcard-avatar">{initials}</div>
                    <div className="tcard-author-info">
                      <strong>{t.name || 'Anonymous'}</strong>
                      {t.role && <span>{t.role}</span>}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          STATS BAR
         ══════════════════════════ */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <ScrollReveal className="sbar-item s-orange" direction="up" delay={0}>
            <span className="sbar-num">{stats.reported}</span>
            <span className="sbar-label">Reported</span>
          </ScrollReveal>
          <ScrollReveal className="sbar-item s-amber" direction="up" delay={80}>
            <span className="sbar-num">{stats.inProgress}</span>
            <span className="sbar-label">In Progress</span>
          </ScrollReveal>
          <ScrollReveal className="sbar-item s-green" direction="up" delay={160}>
            <span className="sbar-num">{stats.resolved}</span>
            <span className="sbar-label">Resolved</span>
          </ScrollReveal>
          <ScrollReveal className="sbar-item" direction="up" delay={240}>
            <span className="sbar-num">{stats.total}</span>
            <span className="sbar-label">Total Issues</span>
          </ScrollReveal>
        </div>
      </div>

      {/* ══════════════════════════
          ABOUT
         ══════════════════════════ */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <ScrollReveal direction="up" delay={0}>
            <p className="about-label">About NeighbourFix</p>
            <h2>Making civic accountability<br />accessible to everyone</h2>
            <p>We built NeighbourFix so every resident has a voice. Report issues, rally community upvotes, and watch your ward authorities respond — all in one transparent platform.</p>
          </ScrollReveal>

          <div className="about-features">
            {[
              { icon:'📍', title:'GPS-Pinned Reports',   body:'Pin the exact location of any issue on an interactive map so authorities know precisely where to act.' },
              { icon:'▲',  title:'Community Upvoting',   body:'Neighbours upvote issues they care about. High-priority complaints auto-escalate to ward officers at 10 votes.' },
              { icon:'📊', title:'Ward Heatmap',          body:'A public accountability dashboard showing resolution rates ward-by-ward.' },
              { icon:'📧', title:'Auto Escalation',       body:'When an issue reaches the threshold, a formal PDF complaint letter is emailed directly to your ward officer.' },
            ].map((f, i) => (
              <ScrollReveal key={f.title} className="about-feat" direction="up" delay={i * 80}>
                <div className="about-feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

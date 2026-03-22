import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Home, Activity, Shield, Globe, ArrowRight } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
      {/* Sticky Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800, color: scrolled ? 'var(--primary)' : 'white' }}>
          <Building2 size={32} />
          {t('app_title')}
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" style={{ color: scrolled ? 'var(--text-main)' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>Features</a>
          <a href="#stats" style={{ color: scrolled ? 'var(--text-main)' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>Impact</a>
          <button 
            className="btn btn-primary" 
            style={{ fontWeight: 600, padding: '0.5rem 1.5rem', borderRadius: '50px' }}
            onClick={() => navigate('/login')}
          >
            {t('login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="home" style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 2rem',
        backgroundImage: `url('/img/hero_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', animation: 'slideInUp 0.8s ease-out' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', color: 'var(--secondary)', fontWeight: 600, marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            ✨ The Next Generation of Property Management
          </div>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', textShadow: '0 4px 6px rgba(0,0,0,0.5)' }}>
            Elevate Your Real Estate Portfolio
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.85)', marginBottom: '3rem', fontWeight: 400, lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            A powerful, all-in-one Property Management System supporting global users, dynamic rent calculation, and comprehensive expense tracking. Start scaling today.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '1.25rem 3rem', fontSize: '1.125rem', fontWeight: 700, borderRadius: '50px', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              onClick={() => navigate('/login')}
            >
              Get Started Free <ArrowRight size={20} />
            </button>
            <button 
              className="btn" 
              style={{ padding: '1.25rem 3rem', fontSize: '1.125rem', fontWeight: 600, borderRadius: '50px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section id="stats" style={{ padding: '6rem 2rem', background: 'var(--surface-color)', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>10k+</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Activity size={24}/> Active Monthly Visitors</div>
          </div>
          <div>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>5,000+</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Home size={24}/> Properties Managed</div>
          </div>
          <div>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.5rem' }}>12,000+</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Users size={24}/> Happy Tenants</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '8rem 2rem', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.2 }}>Everything you need to succeed</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Manage your entire real estate portfolio securely from a single, intuitive dashboard securely powered by the cloud.</p>
        </div>

        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.3s ease', cursor: 'default' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1.25rem', borderRadius: '16px', color: 'var(--primary)', marginBottom: '2rem' }}>
              <Globe size={36} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Multi-Calendar Support</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.125rem' }}>Natively supports both Gregorian and Hijri calendars with precise pro-rata rent calculations engineered for global usability.</p>
          </div>
          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.3s ease', cursor: 'default' }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1.25rem', borderRadius: '16px', color: 'var(--secondary)', marginBottom: '2rem' }}>
              <Shield size={36} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Cloud Security</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.125rem' }}>Your data is securely synchronized and backed up instantly to the robust Supabase cloud infrastructure.</p>
          </div>
          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.3s ease', cursor: 'default' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: '16px', color: 'var(--success)', marginBottom: '2rem' }}>
              <Activity size={36} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Financial Analytics</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.125rem' }}>Track dynamic rent collection and organizational expenses seamlessly using beautiful automated visualizations.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer style={{ padding: '6rem 2rem', background: '#0f172a', color: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>Ready to transform your properties?</h2>
        <button 
          className="btn btn-primary" 
          style={{ padding: '1.25rem 3.5rem', fontSize: '1.25rem', borderRadius: '50px', background: 'var(--secondary)', color: 'white', border: 'none' }}
          onClick={() => navigate('/dashboard')}
        >
          {t('login')} / Register Account
        </button>
        <div style={{ marginTop: '4rem', color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
          &copy; {new Date().getFullYear()} Global PMS. All rights reserved. Built for the modern landowner.
        </div>
      </footer>
    </div>
  );
};

export default Landing;

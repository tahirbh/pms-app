import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Home, Activity, Shield, Globe, ArrowRight, Info, CheckCircle2, Cloud, Calendar, Layout, ShieldCheck } from 'lucide-react';

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
          <a href="#features" style={{ color: scrolled ? 'var(--text-main)' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>{t('nav_features')}</a>
          <a href="#stats" style={{ color: scrolled ? 'var(--text-main)' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>{t('nav_impact')}</a>
          <a href="#about" style={{ color: scrolled ? 'var(--text-main)' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>{t('about') || 'About'}</a>
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
            {t('hero_badge')}
          </div>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', textShadow: '0 4px 6px rgba(0,0,0,0.5)' }}>
            {t('hero_title')}
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.85)', marginBottom: '3rem', fontWeight: 400, lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {t('hero_subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '1.25rem 3rem', fontSize: '1.125rem', fontWeight: 700, borderRadius: '50px', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              onClick={() => navigate('/login')}
            >
              {t('btn_get_started')} <ArrowRight size={20} />
            </button>
            <button 
              className="btn" 
              style={{ padding: '1.25rem 3rem', fontSize: '1.125rem', fontWeight: 600, borderRadius: '50px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('btn_learn_more')}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section id="stats" style={{ padding: '6rem 2rem', background: 'var(--surface-color)', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('stat_1_val')}</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Activity size={24}/> {t('stat_1_label')}</div>
          </div>
          <div>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>{t('stat_2_val')}</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Home size={24}/> {t('stat_2_label')}</div>
          </div>
          <div>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.5rem' }}>{t('stat_3_val')}</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Users size={24}/> {t('stat_3_label')}</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '8rem 2rem', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.2 }}>{t('features_title')}</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{t('features_subtitle')}</p>
        </div>

        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.3s ease', cursor: 'default' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1.25rem', borderRadius: '16px', color: 'var(--primary)', marginBottom: '2rem' }}>
              <Globe size={36} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('feat_1_title')}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.125rem' }}>{t('feat_1_desc')}</p>
          </div>
          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.3s ease', cursor: 'default' }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1.25rem', borderRadius: '16px', color: 'var(--secondary)', marginBottom: '2rem' }}>
              <Shield size={36} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('feat_2_title')}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.125rem' }}>{t('feat_2_desc')}</p>
          </div>
          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'transform 0.3s ease', cursor: 'default' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: '16px', color: 'var(--success)', marginBottom: '2rem' }}>
              <Activity size={36} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('financial_analytics')}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.125rem' }}>{t('feat_3_desc')}</p>
          </div>
        </div>
      </section>

      {/* About / Lifecycle Section */}
      <section id="about" style={{ padding: '8rem 2rem', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '4rem' }}>
          <h2 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            margin: 0,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {t('about_title')}
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('about_subtitle')}
          </p>
        </div>

        {/* Lifecycle Steps */}
        <div style={{ 
          maxWidth: '1200px', 
          width: '100%',
          display: 'flex', 
          justifyContent: 'space-between', 
          position: 'relative', 
          marginBottom: '6rem',
          padding: '0 2rem'
        }}>
          {/* Connector Line */}
          <div style={{ 
            position: 'absolute', 
            top: '40px', 
            left: '100px', 
            right: '100px', 
            height: '4px', 
            background: 'var(--glass-border)', 
            zIndex: 0 
          }} />

          {[
            { id: '01', titleKey: 'about_step1_title', descKey: 'about_step1_desc', icon: Layout },
            { id: '02', titleKey: 'about_step2_title', descKey: 'about_step2_desc', icon: Calendar },
            { id: '03', titleKey: 'about_step3_title', descKey: 'about_step3_desc', icon: CheckCircle2 },
            { id: '04', titleKey: 'about_step4_title', descKey: 'about_step4_desc', icon: Cloud },
            { id: '05', titleKey: 'about_step5_title', descKey: 'about_step5_desc', icon: Info },
          ].map((step, idx) => (
            <div key={step.id} style={{ 
              position: 'relative', 
              zIndex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              width: '18%', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'var(--card-bg, var(--surface-color))', 
                border: `4px solid ${idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'}`, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 800, 
                fontSize: '1.5rem', 
                color: idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)', 
                marginBottom: '1.5rem',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease'
              }}>
                {step.id}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                {t(step.titleKey)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t(step.descKey)}
              </div>
            </div>
          ))}
        </div>

        {/* Technical Matrix */}
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Calendar size={24} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('about_tech1_title')}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {t('about_tech1_desc')}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <ShieldCheck size={24} color="var(--secondary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('about_tech2_title')}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {t('about_tech2_desc')}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Layout size={24} color="var(--success)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('about_tech3_title')}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {t('about_tech3_desc')}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Info size={24} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('about_tech4_title')}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {t('about_tech4_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer style={{ padding: '6rem 2rem', background: '#0f172a', color: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}>{t('cta_title')}</h2>
        <button 
          className="btn btn-primary" 
          style={{ padding: '1.25rem 3.5rem', fontSize: '1.25rem', borderRadius: '50px', background: 'var(--secondary)', color: 'white', border: 'none' }}
          onClick={() => navigate('/dashboard')}
        >
          {t('login')} / {t('register_account')}
        </button>
        <div style={{ marginTop: '4rem', color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
          &copy; {new Date().getFullYear()} {t('footer_copyright')}
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, CheckCircle2, Cloud, Calendar, Layout, ShieldCheck } from 'lucide-react';

const About: React.FC = () => {
  const { t } = useTranslation();

  const lifecycleSteps = [
    { id: '01', titleKey: 'about_step1_title', descKey: 'about_step1_desc', icon: Layout },
    { id: '02', titleKey: 'about_step2_title', descKey: 'about_step2_desc', icon: Calendar },
    { id: '03', titleKey: 'about_step3_title', descKey: 'about_step3_desc', icon: CheckCircle2 },
    { id: '04', titleKey: 'about_step4_title', descKey: 'about_step4_desc', icon: Cloud },
    { id: '05', titleKey: 'about_step5_title', descKey: 'about_step5_desc', icon: Info },
  ];

  return (
    <div className="glass-panel p-8 animate-slide-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 800, 
          margin: 0,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t('about_title')}
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {t('about_subtitle')}
        </p>
      </div>

      {/* Lifecycle Steps */}
      <div style={{ 
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

        {lifecycleSteps.map((step, idx) => (
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
              background: 'var(--card-bg)', 
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
    </div>
  );
};

export default About;

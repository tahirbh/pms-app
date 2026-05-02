import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { changelog } from '../data/changelog';

const Changes: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            padding: '0.75rem',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.2)'
          }}>
            <History size={24} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            {t('version_history') || 'Version History'}
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {t('version_history_subtitle') || 'Detailed log of all improvements, new features, and bug fixes.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {changelog.map((entry, idx) => (
          <div 
            key={entry.version} 
            className="glass-panel" 
            style={{ 
              padding: '2rem', 
              background: idx === 0 ? 'rgba(var(--primary-rgb), 0.03)' : 'rgba(var(--glass-bg), 0.2)',
              borderLeft: idx === 0 ? '4px solid var(--primary)' : '1px solid var(--glass-border)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {idx === 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '-2rem', 
                background: 'var(--success)', 
                color: 'white', 
                padding: '0.25rem 3rem', 
                transform: 'rotate(45deg)',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                LATEST
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ 
                  background: idx === 0 ? 'var(--primary-light)' : 'var(--glass-bg)', 
                  color: idx === 0 ? 'var(--primary)' : 'var(--text-muted)',
                  padding: '0.4rem 1rem',
                  borderRadius: '100px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-block',
                  marginBottom: '0.5rem'
                }}>
                  v{entry.version}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Release {entry.version}
                </h3>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                📅 {entry.date}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {entry.features.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} /> {t('features') || 'New Features'}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {entry.features.map((feat, i) => (
                      <li key={i} style={{ fontSize: '0.95rem', display: 'flex', gap: '0.75rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        {t(feat) || feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.fixes.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} /> {t('bug_fixes') || 'Bug Fixes'}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {entry.fixes.map((fix, i) => (
                      <li key={i} style={{ fontSize: '0.95rem', display: 'flex', gap: '0.75rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        {t(fix) || fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Changes;

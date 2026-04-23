import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { changelog } from '../data/changelog';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose, currentVersion }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        className="glass-panel animate-scale-in" 
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 0,
          background: 'var(--surface-color)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: 'white',
          position: 'relative',
        }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Sparkles size={32} />
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{t('whats_new_title') || "What's New?"}</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            {t('version_status') || "Latest updates and features in version"} {currentVersion}
          </p>
        </div>

        {/* Content */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {changelog.slice(0, 3).map((entry, idx) => (
            <div key={entry.version} style={{ 
              opacity: idx === 0 ? 1 : 0.7,
              borderBottom: idx < 2 ? '1px solid var(--glass-border)' : 'none',
              paddingBottom: idx < 2 ? '2rem' : 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ 
                  background: idx === 0 ? 'var(--primary-light)' : 'var(--glass-bg)', 
                  color: idx === 0 ? 'var(--primary)' : 'var(--text-muted)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  v{entry.version}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.date}</span>
              </div>

              {entry.features.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} /> {t('features') || "New Features"}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {entry.features.map((feat, i) => (
                      <li key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '0.75rem', color: 'var(--text-main)' }}>
                        <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        {t(feat) || feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.fixes.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {t('bug_fixes') || "Bug Fixes"}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {entry.fixes.map((fix, i) => (
                      <li key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '0.75rem', color: 'var(--text-main)' }}>
                        <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        {t(fix) || fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(var(--glass-bg), 0.2)'
        }}>
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            style={{ padding: '0.75rem 2rem' }}
          >
            {t('got_it') || "Got it!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  variant = 'primary'
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getVariantColor = () => {
    switch (variant) {
      case 'danger': return 'var(--danger, #ef4444)';
      case 'success': return 'var(--success, #10b981)';
      default: return 'var(--primary, #6366f1)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--surface, #1e1e2d)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header/Icon Area */}
        <div style={{
          padding: '2rem 1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: `${getVariantColor()}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <AlertTriangle size={32} color={getVariantColor()} />
          </div>

          <h3 style={{
            marginTop: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '0.75rem'
          }}>{title}</h3>

          <p style={{
            margin: 0,
            lineHeight: 1.6,
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.6)'
          }}>{message}</p>
        </div>

        {/* Action Area */}
        <div style={{
          padding: '1.5rem',
          display: 'flex',
          gap: '1rem',
          marginTop: '0.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              padding: '0.75rem'
            }}
          >
            <X size={18} />
            {cancelText || t('cancel')}
          </button>

          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: getVariantColor(),
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              padding: '0.75rem',
              boxShadow: `0 4px 14px 0 ${getVariantColor()}40`
            }}
          >
            <Check size={18} />
            {confirmText || t('confirm') || 'Confirm'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;

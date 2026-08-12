import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, Check, Trash2, Inbox, RefreshCw } from 'lucide-react';

interface NotificationItem {
  id: string;
  tenantId: string;
  name: string;
  type: 'overdue' | 'upcoming';
  amount: number;
  date: string;
  status: 'unread' | 'read';
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onMarkAsDeleted: (id: string) => void;
  onDeleteRead: () => void;
  currency: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAsDeleted,
  onDeleteRead,
  currency,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  if (!isOpen) return null;

  // Filter list based on tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return n.status === 'unread';
    if (activeTab === 'read') return n.status === 'read';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const readCount = notifications.filter(n => n.status === 'read').length;

  const handleItemClick = (n: NotificationItem) => {
    onMarkAsRead(n.id);
    onClose();
    navigate(`/dashboard/ledger/${n.tenantId}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 0,
          background: 'var(--surface-color)',
          borderRadius: '16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <Inbox size={28} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--danger)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 700,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>
                {t('notifications') || 'Notification Center'}
              </h2>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '0.8rem', marginTop: '2px' }}>
                {t('manage_your_payment_alerts') || 'Manage outstanding property payment reminders'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Controls / Tabs */}
        <div
          style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'rgba(var(--glass-bg), 0.1)',
          }}
        >
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'all', label: t('all') || 'All', count: notifications.length },
              { id: 'unread', label: t('unread') || 'Unread', count: unreadCount },
              { id: 'read', label: t('read') || 'Read', count: readCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--glass-bg)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: activeTab === tab.id ? 'white' : 'var(--text-main)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Delete All Read Button */}
          {readCount > 0 && (
            <button
              onClick={onDeleteRead}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: 'var(--danger)',
                color: 'var(--danger)',
                background: 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <Trash2 size={14} />
              <span>{t('delete_read') || 'Delete Read'}</span>
            </button>
          )}
        </div>

        {/* Modal List Content */}
        <div
          style={{
            padding: '1.5rem 2rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            minHeight: '200px',
          }}
        >
          {filteredNotifications.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'var(--text-muted)',
                padding: '3rem 1rem',
                textAlign: 'center',
                gap: '1rem',
              }}
            >
              <Inbox size={48} style={{ opacity: 0.4 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {t('no_matching_notifications') || 'No notifications found'}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                  {activeTab === 'unread'
                    ? t('all_caught_up') || 'You are all caught up with outstanding actions!'
                    : t('no_notifications_in_filter') || 'There are no items in this filter.'}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map(n => {
              const isOverdue = n.type === 'overdue';
              return (
                <div
                  key={n.id}
                  className="glass-panel"
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: n.status === 'unread' ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent',
                    borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : 'var(--accent)'}`,
                    opacity: n.status === 'read' ? 0.7 : 1,
                    position: 'relative',
                  }}
                  onClick={() => handleItemClick(n)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <AlertCircle
                    size={24}
                    color={isOverdue ? 'var(--danger)' : 'var(--accent)'}
                    style={{ flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {n.name}
                      </span>
                      {n.status === 'unread' && (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--success)',
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '100px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t('unread_badge') || 'New'}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {isOverdue ? t('overdue_alert') || 'Overdue payment' : t('upcoming_alert') || 'Upcoming payment'}:{' '}
                      <strong style={{ color: isOverdue ? 'var(--danger)' : 'var(--accent)' }}>
                        {Math.round(n.amount).toLocaleString()} {currency}
                      </strong>
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t('due_date')}: {n.date}
                    </p>
                  </div>

                  {/* Actions for this row */}
                  <div
                    style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    onClick={e => e.stopPropagation()} // Prevent card navigation trigger
                  >
                    {n.status === 'unread' ? (
                      <button
                        onClick={() => onMarkAsRead(n.id)}
                        title={t('mark_as_read') || 'Mark as Read'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = 'var(--success)';
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Check size={18} />
                      </button>
                    ) : (
                      onMarkAsUnread && (
                        <button
                          onClick={() => onMarkAsUnread(n.id)}
                          title={t('mark_as_unread') || 'Mark as Unread'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '0.4rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <RefreshCw size={14} />
                        </button>
                      )
                    )}
                    <button
                      onClick={() => onMarkAsDeleted(n.id)}
                      title={t('delete') || 'Delete'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = 'var(--danger)';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(var(--glass-bg), 0.2)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {unreadCount} {t('unread_notifications_count') || 'unread reminders remaining'}
          </span>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.5rem 1.5rem' }}>
            {t('close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

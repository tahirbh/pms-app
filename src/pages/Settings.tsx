import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { Users, Mail, Trash2, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getMyInvitations, sendInvitation, revokeInvitation } from '../utils/store';
import type { Invitation } from '../utils/store';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage, currency, setCurrency, calendarMode, setCalendarMode } = useAppContext();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const loadInvitations = async () => {
    const data = await getMyInvitations();
    setInvitations(data);
  };

  useEffect(() => { loadInvitations(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setInviteMsg(null);
    const { ok, error } = await sendInvitation(inviteEmail);
    setInviteLoading(false);
    if (ok) {
      setInviteMsg({ text: `✅ Invitation sent to ${inviteEmail}. They can sign up and access your data automatically.`, ok: true });
      setInviteEmail('');
      await loadInvitations();
    } else {
      setInviteMsg({ text: `❌ ${error}`, ok: false });
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    await revokeInvitation(id);
    await loadInvitations();
  };

  const statusIcon = (status: Invitation['status']) => {
    if (status === 'accepted') return <CheckCircle2 size={14} color="var(--success)" />;
    if (status === 'pending') return <Clock size={14} color="var(--warning, #f59e0b)" />;
    return <XCircle size={14} color="var(--danger)" />;
  };

  const statusLabel = (status: Invitation['status']) => {
    if (status === 'accepted') return 'Accepted';
    if (status === 'pending') return 'Pending sign-up';
    return 'Revoked';
  };

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{t('settings')}</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '560px' }}>

        {/* Language */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {t('language')}
          </label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field">
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="ur">اردو (Urdu)</option>
          </select>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Selecting Arabic or Urdu will automatically shift the layout to RTL (Right-to-Left).
          </p>
        </div>

        {/* Currency */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {t('currency')}
          </label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="SAR">SAR (ر.س)</option>
            <option value="PKR">PKR (Rs)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Calendar Mode */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Default Calendar Mode
          </label>
          <select value={calendarMode} onChange={(e) => setCalendarMode(e.target.value as 'gregorian' | 'hijri')} className="input-field">
            <option value="gregorian">Gregorian Calendar</option>
            <option value="hijri">Hijri (Islamic) Calendar</option>
          </select>
        </div>

        {/* ── Team Access ── */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Users size={20} /> Team Access
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Invite others by email. Once they sign up, they can view and manage your properties, tenants, and expenses.
          </p>

          {/* Invite form */}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email" required value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="input-field" style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={inviteLoading} style={{ whiteSpace: 'nowrap' }}>
              {inviteLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send Invite'}
            </button>
          </form>

          {/* Message */}
          {inviteMsg && (
            <div style={{
              padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem',
              background: inviteMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${inviteMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
              color: inviteMsg.ok ? 'var(--success)' : 'var(--danger)',
            }}>
              {inviteMsg.text}
            </div>
          )}

          {/* Invite list */}
          {invitations.filter(i => i.status !== 'revoked').length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {invitations.filter(i => i.status !== 'revoked').map(inv => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.9rem', borderRadius: '8px',
                  background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {statusIcon(inv.status)}
                    <span style={{ fontWeight: 500 }}>{inv.invitee_email}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>— {statusLabel(inv.status)}</span>
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id, inv.invitee_email)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}
                    title="Revoke access"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            💡 Invites are accepted automatically when the person signs up with the same email address.
          </p>
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Settings;

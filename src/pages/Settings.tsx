import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Trash2, Loader2, CheckCircle2, Clock, XCircle, Languages, Calendar, LogOut, Sun, Moon } from 'lucide-react';
import { getMyInvitations, sendInvitation, revokeInvitation } from '../utils/store';
import type { Invitation } from '../utils/store';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { language, setLanguage, currency, setCurrency, calendarMode, setCalendarMode, theme, setTheme } = useAppContext();

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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Languages size={20} color="var(--primary)"/> {t('language')}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { val: 'en', label: 'English' },
                { val: 'ar', label: 'العربية' },
                { val: 'ur', label: 'اردو' }
              ].map(lang => (
                <button
                  key={lang.val}
                  className={`btn ${language === lang.val ? 'btn-primary' : ''}`}
                  style={{
                    flex: 1, minWidth: '100px',
                    background: language === lang.val ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                    color: language === lang.val ? 'white' : 'var(--text-main)',
                    border: '1px solid var(--glass-border)'
                  }}
                  onClick={() => setLanguage(lang.val)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
               💡 {t('rtl_note')}
            </p>
        </div>

        {/* Currency */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {t('currency')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { val: 'USD', label: 'USD ($)' },
              { val: 'EUR', label: 'EUR (€)' },
              { val: 'AED', label: 'AED (د.إ)' },
              { val: 'SAR', label: 'SAR (ر.س)' },
              { val: 'PKR', label: 'PKR (Rs)' },
              { val: 'GBP', label: 'GBP (£)' }
            ].map(curr => (
              <button
                key={curr.val}
                className={`btn ${currency === curr.val ? 'btn-primary' : ''}`}
                style={{
                  flex: '1 1 30%',
                  background: currency === curr.val ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                  color: currency === curr.val ? 'white' : 'var(--text-main)',
                  border: '1px solid var(--glass-border)'
                }}
                onClick={() => setCurrency(curr.val)}
              >
                {curr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Mode */}
        <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--primary)"/> {t('default_calendar')}
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className={`btn ${calendarMode === 'gregorian' ? 'btn-primary' : ''}`}
                style={{ flex: 1, background: calendarMode === 'gregorian' ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: calendarMode === 'gregorian' ? 'white' : 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                onClick={() => setCalendarMode('gregorian')}
              >
                {t('gregorian_calendar')}
              </button>
              <button 
                className={`btn ${calendarMode === 'hijri' ? 'btn-primary' : ''}`}
                style={{ flex: 1, background: calendarMode === 'hijri' ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: calendarMode === 'hijri' ? 'white' : 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                onClick={() => setCalendarMode('hijri')}
              >
                {t('hijri_calendar')}
              </button>
            </div>
        </div>

        {/* Theme Toggle */}
        <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {theme === 'dark' ? <Moon size={20} color="var(--primary)"/> : <Sun size={20} color="var(--primary)"/>} {t('theme') || 'Theme'}
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
                style={{ flex: 1, background: theme === 'light' ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: theme === 'light' ? 'white' : 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                onClick={() => setTheme('light')}
              >
                <Sun size={18} /> {t('light_theme') || 'Light'}
              </button>
              <button 
                className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
                style={{ flex: 1, background: theme === 'dark' ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: theme === 'dark' ? 'white' : 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                onClick={() => setTheme('dark')}
              >
                <Moon size={18} /> {t('dark_theme') || 'Dark'}
              </button>
            </div>
        </div>

        {/* ── Team Access ── */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Users size={24} color="var(--secondary)" /> {t('team_access')}
          </h2>

          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
             {t('team_access_desc')}
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
                    {(inv.status === 'accepted' || inv.status === 'pending') && (
                      <button 
                        className="btn" 
                        title={t('revoke_access')} 
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '8px' }}
                        onClick={() => handleRevoke(inv.id, inv.invitee_email)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}</div>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
            {t('invite_tip')}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Account</h2>
          <button className="btn" style={{ background: 'var(--danger)', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 2rem' }} onClick={signOut}>
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Settings;

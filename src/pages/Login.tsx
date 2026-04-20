import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup';

const Login: React.FC = () => {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const resetForm = (m: AuthMode) => {
    setMode(m); setError(''); setPassword(''); setSignedUp(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) { setError(t('password_short')); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) { setError(error); return; }
      setSignedUp(true);
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        if (error.toLowerCase().includes('email not confirmed') || error.toLowerCase().includes('not confirmed'))
          setError(t('email_not_confirmed'));
        else if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials'))
          setError(t('incorrect_credentials'));
        else setError(error);
        return;
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch { setError(t('google_unavailable')); setGoogleLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-color)',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(79,70,229,0.2) 0px, transparent 60%), radial-gradient(at 100% 100%, rgba(14,165,233,0.2) 0px, transparent 60%)',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideInUp 0.4s ease-out' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: '16px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79,70,229,0.35)' }}>
            <Building2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'center', margin: 0 }}>{t('app_title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
            {mode === 'signin' ? t('welcome_back') : t('create_account_subtitle')}
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '4px' }}>
          {(['signin', 'signup'] as AuthMode[]).map((m) => (
            <button key={m} onClick={() => resetForm(m)} style={{
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: mode === m ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              {m === 'signin' ? t('sign_in') : t('create_account')}
            </button>
          ))}
        </div>

        {/* Signed up confirmation */}
        {signedUp ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <CheckCircle2 size={52} color="var(--success)" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{t('account_created')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {t('confirm_email_sent')} <strong>{email}</strong>.<br />
              {t('confirm_email_instruction')}
            </p>
            <button onClick={() => resetForm('signin')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
              {t('go_to_signin')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>{t('full_name')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('your_full_name')} className="input-field" style={{ paddingLeft: '2.25rem' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>{t('email_address')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" style={{ paddingLeft: '2.25rem' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                {t('password')} {mode === 'signup' && <span style={{ fontWeight: 400 }}>{t('password_hint')}</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.25rem' }}>
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> {mode === 'signin' ? t('signing_in') : t('creating_account')}</>
                : mode === 'signin' ? t('sign_in') : t('create_account')
              }
            </button>
          </form>
        )}

        {!signedUp && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('or_continue_with')}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
            </div>
            <button 
              onClick={handleGoogle} 
              disabled={googleLoading} 
              className="google-btn"
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                borderRadius: '12px', 
                border: '1px solid #dadce0', 
                background: '#ffffff', 
                cursor: googleLoading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                fontSize: '1rem', 
                fontWeight: 500, 
                color: '#3c4043', 
                boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px rgba(60,64,67,0.15)', 
                fontFamily: '"Roboto", "Product Sans", system-ui, -apple-system, sans-serif', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {googleLoading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> <span style={{ marginLeft: '8px' }}>{t('loading')}</span></>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  <span style={{ letterSpacing: '0.25px' }}>{t('continue_with_google')}</span>
                </>
              )}
            </button>
          </>
        )}

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>{t('secured_by')}</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;

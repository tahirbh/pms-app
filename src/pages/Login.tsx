import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup';

const Login: React.FC = () => {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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
    setMode(m);
    setError('');
    setPassword('');
    setSignedUp(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) { setError(error); return; }
      setSignedUp(true);
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        // Show helpful message for unconfirmed email
        if (error.toLowerCase().includes('email not confirmed') || error.toLowerCase().includes('not confirmed')) {
          setError('⚠️ Your email is not confirmed yet. Go to Supabase Dashboard → Authentication → Providers → Email → disable "Confirm email" to skip this. Or check your inbox for the confirmation link.');
        } else if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials')) {
          setError('Incorrect email or password. Did you create an account first?');
        } else {
          setError(error);
        }
        return;
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try { await signInWithGoogle(); }
    catch { setError('Google login unavailable. Use email instead.'); setGoogleLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-color)',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(79,70,229,0.2) 0px, transparent 60%), radial-gradient(at 100% 100%, rgba(14,165,233,0.2) 0px, transparent 60%)',
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '440px', padding: '2.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        animation: 'slideInUp 0.4s ease-out',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '16px', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(79,70,229,0.35)',
          }}>
            <Building2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'center', margin: 0 }}>
            Property Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
            {mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '4px' }}>
          {(['signin', 'signup'] as AuthMode[]).map((m) => (
            <button key={m} onClick={() => resetForm(m)}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Email Verified Confirmation */}
        {signedUp ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <CheckCircle2 size={52} color="var(--success)" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Account created!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it to verify your email — then sign in below.
            </p>
            <button onClick={() => resetForm('signin')}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Full Name — only on sign up */}
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="input-field" style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field" style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Password {mode === 'signup' && <span style={{ fontWeight: 400 }}>(min 6 characters)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field" style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.25rem' }}>
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> {mode === 'signin' ? 'Signing in...' : 'Creating account...'}</>
                : mode === 'signin' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>
        )}

        {/* Divider */}
        {!signedUp && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={googleLoading}
              style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                border: '1px solid #dadce0', background: 'white',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#374151',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              {googleLoading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> Connecting...</>
                : <>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37 9.7C33.7 6.7 29.1 5 24 5 13 5 4 14 4 25s9 20 20 20c11 0 19.7-8 19.7-19.3 0-1.2-.1-2.5-.4-3.7z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9L37 9.7C33.7 6.7 29.1 5 24 5c-7.7 0-14.3 4.4-17.7 10.7z"/>
                      <path fill="#4CAF50" d="M24 45c5 0 9.6-1.7 13.1-4.7l-6.1-5C29.2 36.8 26.7 38 24 38c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.7 40.7 16.4 45 24 45z"/>
                      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.7-2.8 4.9-5.2 6.3l6.1 5C40 36.4 44 31 44 25c0-1.7-.1-3.4-.4-5z"/>
                    </svg>
                    Continue with Google
                  </>
              }
            </button>
          </>
        )}

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Secured by Supabase · Data encrypted in transit
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;

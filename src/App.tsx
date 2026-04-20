import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SplashScreen from './components/SplashScreen';
import { useState } from 'react';


// Guards the dashboard — redirects to /login if not authenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid var(--primary)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen once per session
    return !sessionStorage.getItem('pms_splash_shown');
  });

  const handleSplashFinished = () => {
    sessionStorage.setItem('pms_splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


export default App;

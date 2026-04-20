import React, { useEffect, useState } from 'react';
import premiumLogo from '../assets/logo-premium.png';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Total duration: 3.5s (3s visible + 0.5s fade out)
    const timeout = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onFinished, 600); // 100ms buffer for safety
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [onFinished]);

  // Parallax calculations
  const logoTransform = `translate(
    ${(mousePos.x - 0.5) * -30}px, 
    ${(mousePos.y - 0.5) * -30}px
  )`;
  
  const bgTransform = `translate(
    ${(mousePos.x - 0.5) * 50}px, 
    ${(mousePos.y - 0.5) * 50}px
  )`;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#030712', // Deep obsidian background
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isLeaving ? 0 : 1,
        pointerEvents: isLeaving ? 'none' : 'auto'
      }}
    >
      {/* Dynamic Animated Background Mesh */}
      <div 
        style={{
          position: 'absolute',
          width: '150%', height: '150%',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.1) 0%, transparent 60%)',
          filter: 'blur(60px)',
          transform: bgTransform,
          transition: 'transform 0.4s cubic-bezier(0.1, 0, 0.1, 1)',
          animation: 'pulse 8s infinite alternate'
        }}
      />

      {/* Floating Sparkles (CSS only particles) */}
      <div className="sparkles-container">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        transform: `translateY(${isLeaving ? '-20px' : '0'})`,
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Logo with Parallax */}
        <div style={{
          width: '240px', height: '240px',
          padding: '20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5), inset 0 0 100px rgba(79, 70, 229, 0.1)',
          transform: logoTransform,
          transition: 'transform 0.3s cubic-bezier(0.1, 0, 0.1, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'logoBreathe 4s ease-in-out infinite'
        }}>
          <img 
            src={premiumLogo} 
            alt="Global PMS" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>

        {/* Text Area */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to bottom, #ffffff 30%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(79, 70, 229, 0.3))'
          }}>
            GLOBAL PMS
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginTop: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.4em',
            fontWeight: 500,
            animation: 'shimmer 3s infinite'
          }}>
            ELEVATING PROPERTY MANAGEMENT
          </p>
        </div>

        {/* Loading Indicator */}
        <div style={{
          marginTop: '2rem',
          width: '200px', height: '2px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '1px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, height: '100%',
            width: '40%',
            background: 'linear-gradient(90deg, transparent, var(--primary, #6366f1), transparent)',
            animation: 'loadingProgress 2s linear infinite'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(1) translate(0,0); }
          100% { opacity: 0.8; transform: scale(1.1) translate(5%, 5%); }
        }
        @keyframes logoBreathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes loadingProgress {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes floatSparkle {
          0%, 100% { opacity: 0; transform: translateY(0); }
          50% { opacity: 0.5; transform: translateY(-20px); }
        }
        .sparkle {
          position: absolute;
          width: 4px; height: 4px;
          background: white;
          border-radius: 50%;
          filter: blur(2px);
          animation: floatSparkle 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

import React from 'react';
import { Info, CheckCircle2, Cloud, Calendar, Layout, ShieldCheck } from 'lucide-react';

const About: React.FC = () => {

  return (
    <div className="glass-panel p-8 animate-slide-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 800, 
          margin: 0,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Global PMS Lifecycle
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Complete Application Workflow & Technical Scope
        </p>
      </div>

      {/* Lifecycle Steps */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        position: 'relative', 
        marginBottom: '6rem',
        padding: '0 2rem'
      }}>
        {/* Connector Line */}
        <div style={{ 
          position: 'absolute', 
          top: '40px', 
          left: '100px', 
          right: '100px', 
          height: '4px', 
          background: 'var(--glass-border)', 
          zIndex: 0 
        }} />

        {[
          { id: '01', title: 'Onboarding', desc: 'Property Registration & Portfolio Setup', icon: Layout },
          { id: '02', title: 'Contracting', desc: 'Tenant Registration & Hijri/Gregorian Lease', icon: Calendar },
          { id: '03', title: 'Automation', desc: 'Digital Ledger & Installment Generation', icon: CheckCircle2 },
          { id: '04', title: 'Operations', desc: 'Payment Collection & Expense Tracking', icon: Cloud },
          { id: '05', title: 'Analytics', desc: 'Drill-down Dashboard & Pivot Reporting', icon: Info },
        ].map((step, idx) => (
          <div key={step.id} style={{ 
            position: 'relative', 
            zIndex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            width: '18%', 
            textAlign: 'center' 
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--card-bg)', 
              border: `4px solid ${idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'}`, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: '1.5rem', 
              color: idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)', 
              marginBottom: '1.5rem',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease'
            }}>
              {step.id}
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {step.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {step.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Calendar size={24} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Dual-Calendar Engine</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            Native Hijri (Islamic) and Gregorian support with high-precision pro-rata calculations for dynamic lease settlements.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShieldCheck size={24} color="var(--secondary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Cloud Orchestration</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            Secure Supabase architecture with Row-Level Security (RLS) ensuring total data isolation and real-time syncing.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Layout size={24} color="var(--success)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Glassmorphism UI</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            Modern, premium UI built for high-end professional users with full RTL support and mobile responsiveness.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Info size={24} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Administrative Intelligence</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            Integrated Support Mode for remote troubleshooting and consolidated year-over-year financial comparisons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

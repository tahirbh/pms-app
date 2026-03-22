import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage, currency, setCurrency, calendarMode, setCalendarMode } = useAppContext();

  return (
    <div className="glass-panel p-8 animate-slide-in">
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{t('settings')}</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
        
        {/* Language Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {t('language')}
          </label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field"
          >
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="ur">اردو (Urdu)</option>
          </select>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Selecting Arabic or Urdu will automatically shift the layout to RTL (Right-to-Left).
          </p>
        </div>

        {/* Currency Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {t('currency')}
          </label>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input-field"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="SAR">SAR (ر.س)</option>
            <option value="PKR">PKR (Rs)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Calendar Mode Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Default Calendar Mode
          </label>
          <select 
            value={calendarMode}
            onChange={(e) => setCalendarMode(e.target.value as 'gregorian' | 'hijri')}
            className="input-field"
          >
            <option value="gregorian">Gregorian Calendar</option>
            <option value="hijri">Hijri (Islamic) Calendar</option>
          </select>
        </div>

      </div>
    </div>
  );
};

export default Settings;

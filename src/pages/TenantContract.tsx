import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTenants, getProperties } from '../utils/store';
import type { TenantContract as TenantType, Property } from '../utils/store';
import { Printer, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import moment from 'moment-hijri';
import { calculateRent } from '../utils/rentCalculator';

const TenantContractPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency, calendarMode } = useAppContext();
  
  const [tenant, setTenant] = useState<TenantType | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const tenants = await getTenants();
      const t = tenants.find(x => x.id === id);
      if (t) {
        setTenant(t);
        const props = await getProperties();
        setProperty(props.find(p => p.id === t.propertyId) || null);
      }
    };
    loadData();
  }, [id]);

  if (!tenant || !property) return <div className="p-8 text-center" style={{ color: 'var(--text-main)' }}>{t('loading_contract')}</div>;

  const printDate = calendarMode === 'hijri' ? moment().format('iYYYY/iMM/iDD') : new Date().toLocaleDateString();
  const rentResult = calculateRent(property.annualRent, tenant.startDate, tenant.endDate, tenant.calendarMode as 'gregorian' | 'hijri');

  return (
    <div className="glass-panel p-8 animate-slide-in" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/> {t('back_btn')}</button>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={20}/> {t('print_contract_action')}</button>
      </div>

      <div style={{ padding: '3rem', border: '1px solid var(--glass-border)', background: 'white', color: 'black', borderRadius: '8px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', borderBottom: '2px solid black', paddingBottom: '1rem', fontWeight: 800 }}>{t('tenancy_agreement')}</h1>
        
        <p style={{ marginBottom: '2rem', fontSize: '1.125rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: t('tenancy_desc_full', { date: printDate }) }}></p>
        
        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{t('the_parties')}</h2>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('tenant_name_col')}</strong> <span style={{ textTransform: 'capitalize' }}>{tenant.tenantName}</span></p>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('landlord_name_col')}</strong> {property.name}</p>
        
        <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{t('the_property_section')}</h2>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('address_col')}</strong> {property.address || t('na_label')}</p>
        
        <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{t('term_and_rent')}</h2>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('lease_term_col')}</strong> {t('from_to_dates', { start: tenant.startDate, end: tenant.endDate })} ({tenant.calendarMode.toUpperCase()})</p>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('annual_rent')}:</strong> {property.annualRent.toLocaleString()} {currency}</p>
        
        <div style={{ background: '#f8fafc', padding: '1rem', marginTop: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ margin: '0.25rem 0', fontSize: '1.125rem', color: '#0f172a' }}><strong>{t('actual_utilized_days')}</strong> {rentResult.totalContractDays}</p>
          <p style={{ margin: '0.25rem 0', fontSize: '1.125rem', color: '#0f172a' }}><strong>{t('net_rent_settlement')}</strong> {rentResult.expectedContractRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</p>
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: '#555', fontStyle: 'italic' }}>
          {t('tenancy_footer')}
        </p>

        <div style={{ marginTop: '6rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid black', width: '250px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontWeight: 600 }}>{t('landlord_signature')}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid black', width: '250px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontWeight: 600 }}>{t('tenant_signature')}</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print, aside, nav, button {
            display: none !important;
          }
          body, .glass-panel {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TenantContractPage;

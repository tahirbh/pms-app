import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTenants, getProperties, saveTenant, saveLedgers, updateProperty } from '../utils/store';
import type { TenantContract as TenantType, Property } from '../utils/store';
import { Printer, ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { generateLedgerSchedules } from '../utils/ledgerGenerator';
import { useAppContext } from '../context/AppContext';
import moment from 'moment-hijri';
import { calculateRent } from '../utils/rentCalculator';
import ExtendContractModal from '../components/ExtendContractModal';


const TenantContractPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency, calendarMode } = useAppContext();
  
  const [tenant, setTenant] = useState<TenantType | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [extendingContract, setExtendingContract] = useState<{ tenant: TenantType; property: Property } | null>(null);


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

  const handleExtendContract = async () => {
    if (!tenant || !property) return;

    // Fetch all tenants to find historical contracts for the same person to find the LATEST period
    const allTenants = await getTenants();
    const history = allTenants.filter(t => t.tenantName === tenant.tenantName);
    const latestContract = history.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''))[0] || tenant;

    setExtendingContract({ tenant: latestContract, property });
  };

  const handleConfirmExtension = async (data: { 
    newRent: number; 
    updateMaster: boolean; 
    paymentPlan: 'Monthly' | '3 Month' | '6 Month' | 'Yearly';
    startDate: string;
    endDate: string;
  }) => {
    if (!extendingContract || !property) return;
    const { tenant: tnt } = extendingContract;
    
    setExtendingContract(null);
    try {
      if (data.updateMaster) {
        await updateProperty({ ...property, annualRent: data.newRent });
      }

      const newTenant = await saveTenant({
        tenantName: tnt.tenantName,
        propertyId: tnt.propertyId,
        startDate: data.startDate,
        endDate: data.endDate,
        calendarMode: tnt.calendarMode,
        paymentPlan: data.paymentPlan,
        iqamaNumber: tnt.iqamaNumber || '',
        sponsorName: tnt.sponsorName || '',
        mobileNumber: tnt.mobileNumber || '',
        annualRent: data.newRent,
        isActive: true
      });

      if (newTenant) {
        const ledgers = generateLedgerSchedules(
          newTenant.id,
          data.newRent,
          data.startDate,
          data.endDate,
          data.paymentPlan,
          tnt.calendarMode
        );
        await saveLedgers(ledgers);
        alert(`${t('contract_extended_success') || 'Contract extended successfully!'}`);
        navigate(`/dashboard/tenants`);
      }
    } catch (err) {
      console.error('Error extending:', err);
      alert(`${t('contract_extend_failed') || 'Failed to extend.'}`);
    }
  };


  if (!tenant || !property) return <div className="p-8 text-center" style={{ color: 'var(--text-main)' }}>{t('loading_contract')}</div>;

  const printDate = calendarMode === 'hijri' ? moment().format('iYYYY/iMM/iDD') : new Date().toLocaleDateString();
  const contractRentAmount = tenant.annualRent || property.annualRent;
  const rentResult = calculateRent(contractRentAmount, tenant.startDate, tenant.endDate, tenant.calendarMode as 'gregorian' | 'hijri');

  return (
    <div className="glass-panel p-8 animate-slide-in" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          {t('back')}
        </button>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => window.print()}>
          <Printer size={18} />
          {t('print')}
        </button>
        {tenant.isActive && (
          <button className="btn" onClick={handleExtendContract} style={{ background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpCircle size={18} />
            {t('extend_contract')}
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '3rem', borderRadius: '8px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--glass-border)', paddingBottom: '1rem', fontWeight: 800 }}>{t('tenancy_agreement')}</h1>
        
        <p style={{ marginBottom: '2rem', fontSize: '1.125rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: t('tenancy_desc_full', { date: printDate }) }}></p>
        
        <h2 style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{t('the_parties')}</h2>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('tenant_name_col')}</strong> <span style={{ textTransform: 'capitalize' }}>{tenant.tenantName}</span></p>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('landlord_name_col')}</strong> {property.name}</p>
        
        <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{t('the_property_section')}</h2>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('address_col')}</strong> {property.address || t('na_label')}</p>
        
        <h2 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{t('term_and_rent')}</h2>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('lease_term_col')}</strong> {t('from_to_dates', { start: tenant.startDate, end: tenant.endDate })} ({tenant.calendarMode.toUpperCase()})</p>
        <p style={{ margin: '0.5rem 0', fontSize: '1.125rem' }}><strong>{t('annual_rent')}:</strong> {contractRentAmount.toLocaleString()} {currency}</p>
        
        <div style={{ background: 'rgba(128,128,128,0.1)', padding: '1rem', marginTop: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ margin: '0.25rem 0', fontSize: '1.125rem' }}><strong>{t('actual_utilized_days')}</strong> {rentResult.totalContractDays}</p>
          <p style={{ margin: '0.25rem 0', fontSize: '1.125rem' }}><strong>{t('net_rent_settlement')}</strong> {Math.round(rentResult.expectedContractRent).toLocaleString()} {currency}</p>
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: '#555', fontStyle: 'italic' }}>
          {t('tenancy_footer')}
        </p>

        <div style={{ marginTop: '6rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid var(--text-main)', width: '250px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontWeight: 600 }}>{t('landlord_signature')}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid var(--text-main)', width: '250px', marginBottom: '0.5rem' }}></div>
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

      {extendingContract && (
        <ExtendContractModal 
          isOpen={!!extendingContract}
          onClose={() => setExtendingContract(null)}
          onConfirm={handleConfirmExtension}
          tenant={extendingContract.tenant}
          property={extendingContract.property}
        />
      )}
    </div>

  );
};

export default TenantContractPage;

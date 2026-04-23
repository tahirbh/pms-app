import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTenants, getProperties, getAllLedgers } from '../utils/store';
import type { ContractLedger } from '../utils/store';
import { useAppContext } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePickerModule from "react-multi-date-picker";
const DatePicker = (DatePickerModule as any).default || DatePickerModule;
import arabic from "react-date-object/calendars/arabic";
import arabic_ar from "react-date-object/locales/arabic_ar";
import arabic_en from "react-date-object/locales/arabic_en";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import gregorian_ar from "react-date-object/locales/gregorian_ar";
import moment from 'moment-hijri';
import { Users, Download, Eye } from 'lucide-react';
import { exportCSV } from '../utils/exportUtils';

const AllTenantsLedger: React.FC = () => {
  const { t } = useTranslation();
  const { currency, calendarMode, language } = useAppContext();
  const navigate = useNavigate();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const qStart = searchParams.get('start');
  const qEnd = searchParams.get('end');
  const qStatus = searchParams.get('status');
  const qProperty = searchParams.get('property');

  const [startDate, setStartDate] = useState(() => {
    if (qStart) return qStart;
    return calendarMode === 'hijri' 
      ? moment().subtract(1, 'years').format('iYYYY/01/01') 
      : new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (qEnd) return qEnd;
    return calendarMode === 'hijri' 
      ? moment().format('iYYYY/12/30') 
      : new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [ledgers, setLedgers] = useState<(ContractLedger & { tenantName: string, propertyName: string, tenantPaid: number, tenantUnpaid: number, annualRent: number })[]>([]);

  useEffect(() => {
    if (qStart) setStartDate(qStart);
    if (qEnd) setEndDate(qEnd);
  }, [qStart, qEnd]);

  const toEnglishDigits = (str: string) => {
    if (!str) return '';
    const arabicNum = '٠١٢٣٤٥٦٧٨٩';
    const persianNum = '۰۱۲۳۴۵۶۷۸۹';
    let en = str.replace(/[٠-٩۰-۹]/g, (d: string) => {
      let i = arabicNum.indexOf(d);
      if (i !== -1) return i.toString();
      i = persianNum.indexOf(d);
      if (i !== -1) return i.toString();
      return d;
    });
    en = en.replace(/-/g, '/');
    return en.replace(/[^\d/]/g, '');
  };
  
  const parseGenericDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const safeStr = toEnglishDigits(dateStr);
    if (safeStr.startsWith('14') || (calendarMode === 'hijri' && !safeStr.startsWith('20'))) {
      return moment(safeStr, 'iYYYY/iMM/iDD').toDate().getTime();
    }
    return new Date(safeStr).getTime();
  };

  useEffect(() => {
    const fetchData = async () => {
      const allLedgers = await getAllLedgers();
      const tenants = await getTenants();
      const properties = await getProperties();

      const safeStartDate = toEnglishDigits(startDate);
      const safeEndDate = toEnglishDigits(endDate);

      let startBoundMs: number;
      let endBoundMs: number;
      
      if (safeStartDate.startsWith('14') || (calendarMode === 'hijri' && !safeStartDate.startsWith('20'))) {
        startBoundMs = moment(safeStartDate, 'iYYYY/iMM/iDD').toDate().getTime();
      } else {
        startBoundMs = new Date(safeStartDate).getTime();
      }

      if (safeEndDate.startsWith('14') || (calendarMode === 'hijri' && !safeEndDate.startsWith('20'))) {
        const ed = moment(safeEndDate, 'iYYYY/iMM/iDD').toDate();
        ed.setHours(23, 59, 59, 999);
        endBoundMs = ed.getTime();
      } else {
        const ed = new Date(safeEndDate);
        ed.setHours(23, 59, 59, 999);
        endBoundMs = ed.getTime();
      }

      const tenantSummaries = allLedgers.reduce((acc, curr) => {
        if (!acc[curr.tenantId]) acc[curr.tenantId] = { paid: 0, unpaid: 0 };
        if (curr.status === 'Paid') acc[curr.tenantId].paid += curr.amount;
        else acc[curr.tenantId].unpaid += curr.amount;
        return acc;
      }, {} as Record<string, { paid: number, unpaid: number }>);

      const filtered = allLedgers.filter(L => {
        const dTs = parseGenericDate(L.dueDate);
        return dTs >= startBoundMs && dTs <= endBoundMs;
      }).map(L => {
        const tnt = tenants.find(t => t.id === L.tenantId);
        const prop = properties.find(p => p.id === tnt?.propertyId);
        const summary = tenantSummaries[L.tenantId] || { paid: 0, unpaid: 0 };
        return {
          ...L,
          tenantName: tnt?.tenantName || 'Unknown',
          propertyName: prop?.name || 'Unknown',
          tenantPaid: summary.paid,
          tenantUnpaid: summary.unpaid,
          annualRent: tnt?.annualRent || prop?.annualRent || 0
        };
      }).sort((a, b) => parseGenericDate(a.dueDate) - parseGenericDate(b.dueDate));

      setLedgers(filtered);
    };

    fetchData();
  }, [startDate, endDate, calendarMode, qStart, qEnd]);

  const filteredLedgers = ledgers.filter(txn => {
    // Status filter from URL (e.g. ?status=unpaid)
    if (qStatus === 'unpaid' && txn.status === 'Paid') return false;
    if (qStatus === 'paid' && txn.status !== 'Paid') return false;
    if (qProperty && txn.propertyName !== qProperty) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      txn.tenantName.toLowerCase().includes(term) ||
      txn.propertyName.toLowerCase().includes(term) ||
      txn.status.toLowerCase().includes(term) ||
      txn.amount.toString().includes(term)
    );
  });

  const totalPaid = filteredLedgers.filter(l => l.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalUnpaid = filteredLedgers.filter(l => l.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  const handleExport = () => {
    exportCSV(filteredLedgers.map(l => ({
      Tenant: l.tenantName,
      Property: l.propertyName,
      DueDate: displayDate(l.dueDate),
      Amount: l.amount,
      Status: l.status,
      PaidDate: displayDate(l.paidDate || ''),
      TenantTotalPaid: l.tenantPaid,
      TenantTotalUnpaid: l.tenantUnpaid
    })), 'All_Tenants_Ledger.csv');
  };

  const formatDigits = (str: string) => {
    if (!str) return '';
    if (language === 'ar') {
      return str.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
    }
    return str;
  };

  const displayDate = (rawDate: string) => {
    if (!rawDate) return '';
    const ts = parseGenericDate(rawDate);
    if (!ts) return formatDigits(rawDate); 
    
    let formatted = '';
    if (calendarMode === 'hijri') {
      formatted = moment(ts).format('iYYYY/iMM/iDD');
    } else {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formatted = `${y}/${m}/${day}`;
    }
    return formatDigits(formatted);
  };

  return (
    <div className="glass-panel p-6 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Users /> {t('tenant_ledgers') || 'Tenant Ledgers'}
          {qStatus === 'unpaid' && <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--danger)', marginLeft: '0.5rem' }}>({t('unpaid_rent') || 'Unpaid Only'})</span>}
        </h2>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('start_date')}</label>
          <DatePicker
            value={startDate}
            onChange={(dateObject: any) => setStartDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
            calendar={calendarMode === 'hijri' ? arabic : gregorian}
            locale={calendarMode === 'hijri' ? (language === 'ar' ? arabic_ar : arabic_en) : (language === 'ar' ? gregorian_ar : gregorian_en)}
            calendarPosition="bottom-right"
            inputClass="input-field"
            containerStyle={{ width: '100%' }}
            format="YYYY/MM/DD"
            zIndex={9999}
            portal
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('end_date')}</label>
          <DatePicker
            value={endDate}
            onChange={(dateObject: any) => setEndDate(dateObject ? dateObject.format('YYYY/MM/DD') : '')}
            calendar={calendarMode === 'hijri' ? arabic : gregorian}
            locale={calendarMode === 'hijri' ? (language === 'ar' ? arabic_ar : arabic_en) : (language === 'ar' ? gregorian_ar : gregorian_en)}
            calendarPosition="bottom-right"
            inputClass="input-field"
            containerStyle={{ width: '100%' }}
            format="YYYY/MM/DD"
            zIndex={9999}
            portal
          />
        </div>
        <div style={{ flex: '2 1 300px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('search_placeholder') || 'Search'}</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder={t('search_placeholder') || "Search tenants, status..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {t('paid_rent') || 'Total Paid'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {(totalPaid || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {t('unpaid_rent') || 'Total Pending'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>
            {(totalUnpaid || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className="glass-panel p-4" style={{ display: 'flex', flexDirection: 'column', maxHeight: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1.125rem', color: 'var(--text-main)', margin: 0 }}>
              {t('tenant_ledgers')}
            </h4>
            <div className="print-hide" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExport}>
                <Download size={16} />
                {t('export')}
              </button>
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {filteredLedgers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_data')}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('tenant_name')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('property')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('due_date')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('installment_amount') || 'Installment'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('status')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('annual_rent') || 'Annual Rent'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('paid_rent') || 'Paid'} (T)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('unpaid_rent') || 'Unpaid'} (T)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedgers.map((txn, idx) => (
                    <tr key={txn.id + idx} className="print-break-inside-avoid" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s', ...({':hover': {backgroundColor: 'var(--surface-color)'}} as any), background: txn.status === 'Paid' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'start' }}>{txn.tenantName}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{txn.propertyName}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{displayDate(txn.dueDate)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start', fontWeight: 700 }}>{txn.amount.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: txn.status === 'Paid' ? 'var(--success)' : 'var(--danger)',
                          color: 'white'
                        }}>
                          {txn.status === 'Paid' ? t('paid') : t('pending')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start', color: 'var(--text-muted)' }}>{txn.annualRent.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start', color: 'var(--success)', fontWeight: 600 }}>{txn.tenantPaid.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start', color: 'var(--danger)', fontWeight: 600 }}>{txn.tenantUnpaid.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => navigate(`/dashboard/ledger/${txn.tenantId}`)}
                        >
                          <Eye size={14} />
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllTenantsLedger;

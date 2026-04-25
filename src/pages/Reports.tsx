import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getExpenses, getAllLedgers, getTenants, getProperties } from '../utils/store';
import type { Expense, ContractLedger } from '../utils/store';
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
import { FileText, ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import { exportCSV } from '../utils/exportUtils';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { currency, calendarMode, language } = useAppContext();

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const qStart = searchParams.get('start');
  const qEnd = searchParams.get('end');
  const qFilter = searchParams.get('filter');

  const [startDate, setStartDate] = useState(() => {
    if (qStart) return qStart;
    return calendarMode === 'hijri'
      ? moment().subtract(30, 'days').format('iYYYY/iMM/iDD')
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (qEnd) return qEnd;
    return calendarMode === 'hijri'
      ? moment().format('iYYYY/iMM/iDD')
      : new Date().toISOString().split('T')[0];
  });

  const [incomes, setIncomes] = useState<(ContractLedger & { tenantName?: string })[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [periodTotals, setPeriodTotals] = useState({
    contracted: 0,
    income: 0,
    unpaid: 0,
    expense: 0,
    transferred: 0,
    netRevenue: 0
  });

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
    const safeStr = toEnglishDigits(dateStr).replace(/-/g, '/');
    
    // Check if it's a Hijri year (starts with 14xx or we are in hijri mode and it's not 20xx)
    const isLikelyHijri = safeStr.startsWith('14') || (calendarMode === 'hijri' && !safeStr.startsWith('20'));
    
    if (isLikelyHijri) {
      try {
        const m = moment(safeStr, 'iYYYY/iMM/iDD');
        if (m.isValid()) return m.toDate().getTime();
      } catch (e) {
        console.warn('Failed to parse Hijri date:', safeStr);
      }
    }
    
    const d = new Date(safeStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  useEffect(() => {
    const fetchReport = async () => {
      const allLedgers = await getAllLedgers();
      const allExpenses = await getExpenses();
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

      const isDateInRange = (dateStr: string) => {
        if (!dateStr) return false;
        
        if (calendarMode === 'hijri') {
          let eStr = safeEndDate;
          // Expand UI-safe 12/29 to 12/30 for internal inclusive filtering
          if (eStr.includes('/12/29')) eStr = eStr.replace('/12/29', '/12/30');
          
          let expStr = '';
          const safeExpDate = toEnglishDigits(dateStr).replace(/-/g, '/');
          if (safeExpDate.startsWith('14')) {
             expStr = safeExpDate;
          } else {
             const m = moment(safeExpDate, ['YYYY/MM/DD', 'YYYY-MM-DD']);
             if (m.isValid()) expStr = toEnglishDigits(m.format('iYYYY/iMM/iDD'));
          }

          if (expStr) {
            const pad = (s: string) => s.split('/').map((p, i) => i > 0 ? p.padStart(2, '0') : p).join('/');
            const pStart = pad(safeStartDate);
            const pEnd = pad(eStr);
            const pExp = pad(expStr);
            return pExp >= pStart && pExp <= pEnd;
          }
        }
        
        // Fallback to strict timestamp checking for Gregorian
        const ts = parseGenericDate(dateStr);
        return ts >= startBoundMs && ts <= endBoundMs;
      };

      // Filter Incomes
      const filteredIncomes = allLedgers.filter(L => {
        const inRange = isDateInRange(L.dueDate || '');

        if (qFilter === 'contracted') {
          return inRange;
        }

        if (qFilter === 'unpaid') {
          if (L.status !== 'Pending') return false;
          return inRange;
        }

        if (L.status !== 'Paid') return false;

        // Dashboard categorizes collected rent strictly by the installment's due date.
        // To match exact details from the clicked card, we must filter strictly by dueDate.
        return inRange;
      });

      const filteredExpenses = allExpenses.filter(E => {
        return isDateInRange(E.date);
      });

      setIncomes(filteredIncomes.map(L => {
        const tnt = tenants.find(t => t.id === L.tenantId);
        const prop = properties.find(p => p.id === tnt?.propertyId);
        const combined = tnt ? `${tnt.tenantName}${prop ? ` (${prop.name})` : ''}` : '';
        return { ...L, tenantName: combined, tenantId: L.tenantId };
      }));
      setExpenses(filteredExpenses);

      // Compute raw overall totals for the selected period
      let pContracted = 0;
      let pIncome = 0;
      let pUnpaid = 0;
      let pExpense = 0;
      let pTransferred = 0;

      allLedgers.forEach(L => {
        if (isDateInRange(L.dueDate || '')) {
          pContracted += L.amount;
          if (L.status === 'Paid') pIncome += L.amount;
          if (L.status === 'Pending') pUnpaid += L.amount;
        }
      });

      allExpenses.forEach(E => {
        if (isDateInRange(E.date)) {
          const isTransfer = E.category.toLowerCase().includes('transfer') && E.category.toLowerCase().includes('owner');
          if (isTransfer) pTransferred += E.amount;
          else pExpense += E.amount;
        }
      });

      setPeriodTotals({
        contracted: pContracted,
        income: pIncome,
        unpaid: pUnpaid,
        expense: pExpense,
        transferred: pTransferred,
        netRevenue: pIncome - pExpense - pTransferred
      });
    };

    fetchReport();
  }, [startDate, endDate, calendarMode, qStart, qEnd]);

  const transactions = [
    ...incomes.map(inc => ({
      id: inc.id,
      date: inc.dueDate,
      description: (qFilter === 'contracted' || qFilter === 'unpaid') ? (t('installment_label') || 'Installment') : t('income_ledger_title'),
      tenantName: inc.tenantName,
      contracted: qFilter === 'contracted' ? inc.amount : 0,
      income: qFilter === 'income' ? inc.amount : (!qFilter ? inc.amount : 0),
      unpaid: qFilter === 'unpaid' ? inc.amount : 0,
      expense: 0,
      transferred: 0,
      tenantId: inc.tenantId,
      rawDate: inc.dueDate
    })),
    ...expenses.map(exp => {
      const isTransfer = exp.category.toLowerCase().includes('transfer') && exp.category.toLowerCase().includes('owner');
      return {
        id: exp.id,
        date: exp.date,
        description: isTransfer ? t('cat_transfer_owner') : exp.category,
        tenantName: '',
        contracted: 0,
        income: 0,
        unpaid: 0,
        expense: isTransfer ? 0 : exp.amount,
        transferred: isTransfer ? exp.amount : 0,
        tenantId: '',
        rawDate: exp.date
      };
    })
  ].sort((a, b) => parseGenericDate(a.rawDate || '') - parseGenericDate(b.rawDate || ''));

  const filteredTransactions = transactions.filter(txn => {
    if (qFilter === 'contracted' && txn.contracted === 0) return false;
    if (qFilter === 'income' && txn.income === 0) return false;
    if (qFilter === 'unpaid' && txn.unpaid === 0) return false;
    if (qFilter === 'expense' && txn.expense === 0) return false;
    if (qFilter === 'transfer' && txn.transferred === 0) return false;

    return true;
  });

  // Replace standard summary totals with the overall period totals.
  const totalContracted = periodTotals.contracted;
  const totalIncome = periodTotals.income;
  const totalUnpaid = periodTotals.unpaid;
  const totalExpense = periodTotals.expense;
  const amountTransferredToOwner = periodTotals.transferred;
  const netRevenue = periodTotals.netRevenue;

  let runningBalance = 0;
  const ledgerData = filteredTransactions.map(txn => {
    runningBalance += (qFilter === 'contracted' ? txn.contracted : (txn.income - txn.expense - txn.transferred));
    return { ...txn, balance: runningBalance };
  });

  const handleExportLedger = () => {
    exportCSV(ledgerData.map(l => {
      const row: any = {
        Date: displayDate(l.date),
        Description: l.description,
        Tenant: l.tenantName || ''
      };
      if (!qFilter || qFilter === 'contracted') row.Contracted = l.contracted;
      if (!qFilter || qFilter === 'income') row.Income = l.income;
      if (qFilter === 'unpaid') row.Unpaid = l.unpaid;
      if (!qFilter || qFilter === 'expense') row.Expense = l.expense;
      if (!qFilter || qFilter === 'transfer') row.Transferred = l.transferred;
      if (!qFilter) row.Balance = l.balance;
      return row;
    }), 'Report_Ledger.csv');
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
    
    // If it's already a Hijri date string and we are in Hijri mode, just return it (sanitized)!
    // This prevents 12/30 overflowing to 01/01 visually.
    if (calendarMode === 'hijri' && (rawDate.startsWith('14') || rawDate.includes('/'))) {
      return formatDigits(rawDate);
    }

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
          <FileText /> {t('income_expense_report') || 'Income & Expense Report'}
        </h2>
      </div>

      {/* Date Filters */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
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
        <div style={{ flex: 1 }}>
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
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('filter_by') || 'Filter By'}</label>
          <select
            className="input-field"
            value={qFilter || ''}
            onChange={(e) => {
              const params = new URLSearchParams(location.search);
              if (e.target.value) {
                params.set('filter', e.target.value);
              } else {
                params.delete('filter');
              }
              navigate(`/dashboard/report?${params.toString()}`);
            }}
          >
            <option value="">{t('income_expense_report') || 'Income & Expense Report'}</option>
            <option value="contracted">{t('actual_contracted_rent') || 'Actual Contracted Rent'}</option>
            <option value="income">{t('collected_rent') || 'Paid Rent'}</option>
            <option value="unpaid">{t('unpaid_rent') || 'Unpaid / Overdue Rent'}</option>
            <option value="expense">{t('total_expenses') || 'Total Expenses'}</option>
            <option value="transfer">{t('transferred_amount') || 'Amount Transferred'}</option>
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {(!qFilter || qFilter === 'contracted') && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--secondary)" />
              {t('actual_contracted_rent') || 'Contracted Rent'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {(totalContracted || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        )}

        {(!qFilter || qFilter === 'income') && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpRight size={16} color="var(--success)" />
              {t('paid_rent') || 'Total Income'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {(totalIncome || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        )}

        {qFilter === 'unpaid' && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--danger)" />
              {t('unpaid_rent') || 'Unpaid Rent'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {(totalUnpaid || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        )}

        {(!qFilter || qFilter === 'expense') && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDownRight size={16} color="var(--danger)" />
              {t('expenses') || 'Total Expenses'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {(totalExpense || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        )}

        {!qFilter && (
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white', border: 'none' }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
              {t('net_revenue') || 'Net Revenue'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {(netRevenue || 0).toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.8 }}>{currency}</span>
            </div>
          </div>
        )}

        {(!qFilter || qFilter === 'transfer') && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--secondary)" />
              {t('amount_transferred_to_owner')}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {(amountTransferredToOwner || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <div className="glass-panel p-4" style={{ display: 'flex', flexDirection: 'column', maxHeight: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1.125rem', color: 'var(--text-main)', margin: 0 }}>
              {t('transaction_detail')} ( {t('recent_transactions_title')} )
            </h4>
            <div className="print-hide" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExportLedger}>
                <Download size={16} />
                {t('export')}
              </button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {ledgerData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_transactions')}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('date_label')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('description_col')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('tenant_name')}</th>
                    {(!qFilter || qFilter === 'contracted') && <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('actual_contracted_rent') || 'Contracted'}</th>}
                    {(!qFilter || qFilter === 'income') && <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('income')}</th>}
                    {qFilter === 'unpaid' && <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('unpaid_rent') || 'Unpaid Rent'}</th>}
                    {(!qFilter || qFilter === 'expense') && <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('expense_label')}</th>}
                    {(!qFilter || qFilter === 'transfer') && <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('transferred_col')}</th>}
                    {!qFilter && <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('balance_col')}</th>}
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((txn, idx) => (
                    <tr key={txn.id + idx} className="print-break-inside-avoid" style={{ borderBottom: '1px solid var(--glass-border)', background: txn.transferred > 0 ? 'rgba(59, 130, 246, 0.05)' : txn.expense > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{displayDate(txn.date)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, textAlign: 'start' }}>{txn.description}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'start' }}>{txn.tenantName}</td>
                      {(!qFilter || qFilter === 'contracted') && <td style={{ padding: '0.5rem', textAlign: 'end', color: txn.contracted > 0 ? 'var(--secondary)' : 'inherit' }}>{txn.contracted > 0 ? `+${txn.contracted.toLocaleString()}` : '-'}</td>}
                      {(!qFilter || qFilter === 'income') && <td style={{ padding: '0.5rem', textAlign: 'end', color: txn.income > 0 ? 'var(--success)' : 'inherit' }}>{txn.income > 0 ? `+${txn.income.toLocaleString()}` : '-'}</td>}
                      {qFilter === 'unpaid' && <td style={{ padding: '0.5rem', textAlign: 'end', color: txn.unpaid > 0 ? 'var(--danger)' : 'inherit' }}>{txn.unpaid > 0 ? `${txn.unpaid.toLocaleString()}` : '-'}</td>}
                      {(!qFilter || qFilter === 'expense') && <td style={{ padding: '0.5rem', textAlign: 'end', color: txn.expense > 0 ? 'var(--danger)' : 'inherit' }}>{txn.expense > 0 ? `-${txn.expense.toLocaleString()}` : '-'}</td>}
                      {(!qFilter || qFilter === 'transfer') && <td style={{ padding: '0.5rem', textAlign: 'end', color: txn.transferred > 0 ? 'var(--accent)' : 'inherit' }}>{txn.transferred > 0 ? `-${txn.transferred.toLocaleString()}` : '-'}</td>}
                      {!qFilter && <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', fontWeight: 700 }}>{txn.balance.toLocaleString()}</td>}
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {txn.tenantId && (
                          <button className="btn print-hide" onClick={() => navigate(`/dashboard/ledger/${txn.tenantId}`)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--primary)', border: '1px solid var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto' }}>
                            {t('transaction_detail') || 'Tenant Detail'}
                          </button>
                        )}
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

export default Reports;

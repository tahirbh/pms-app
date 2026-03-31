import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getExpenses, getAllLedgers } from '../utils/store';
import type { Expense, ContractLedger } from '../utils/store';
import { useAppContext } from '../context/AppContext';
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

  const [startDate, setStartDate] = useState(() => {
    return calendarMode === 'hijri' 
      ? moment().subtract(30, 'days').format('iYYYY/iMM/iDD') 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return calendarMode === 'hijri' 
      ? moment().format('iYYYY/iMM/iDD') 
      : new Date().toISOString().split('T')[0];
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  const [incomes, setIncomes] = useState<ContractLedger[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      const allLedgers = await getAllLedgers();
      const allExpenses = await getExpenses();

      // Convert filter strings to internal generic Gregorian absolute points to cross-check natively globally
      let startBound: Date;
      let endBound: Date;
      
      // Safely parse English digits from Arabic locales for accurate native Gregorian date casting
      const toEnglishDigits = (str: string) => str ? str.replace(/[٠-٩]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()) : '';
      const safeStartDate = toEnglishDigits(startDate);
      const safeEndDate = toEnglishDigits(endDate);

      if (calendarMode === 'hijri') {
        startBound = moment(safeStartDate, 'iYYYY/iMM/iDD').toDate();
        endBound = moment(safeEndDate, 'iYYYY/iMM/iDD').toDate();
      } else {
        startBound = new Date(safeStartDate);
        endBound = new Date(safeEndDate);
      }
      
      endBound.setHours(23, 59, 59, 999);

      // Filter Incomes (only strictly 'Paid' ledgers natively reflect guaranteed liquid income)
      const filteredIncomes = allLedgers.filter(L => {
        if (L.status !== 'Paid' || !L.paidDate) return false;
        // The ledger records its strictly fulfilled date natively as YYYY/MM/DD string representation representing its native calendar setting
        let pd: Date;
        // Since paidDate is populated literally based on the global format when it was marked paid, assuming it shares current calendar Mode constraints or universally mapped.
        // Actually, safest logic natively evaluates strings against bounds if they share identical structural parsing.
        if (L.paidDate.includes('144')) {
           pd = moment(L.paidDate, 'iYYYY/iMM/iDD').toDate();
        } else {
           pd = new Date(L.paidDate);
        }
        return pd >= startBound && pd <= endBound;
      });

      const filteredExpenses = allExpenses.filter(E => {
        let ed: Date;
        if (E.date.includes('144')) {
          ed = moment(E.date, 'iYYYY/iMM/iDD').toDate();
        } else {
          ed = new Date(E.date);
        }
        return ed >= startBound && ed <= endBound;
      });

      setIncomes(filteredIncomes);
      setExpenses(filteredExpenses);
    };

    fetchReport();
  }, [startDate, endDate, calendarMode]);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.filter(e => e.category !== 'Transfer to Owner' && e.category !== 'Transferred to Owner').reduce((acc, curr) => acc + curr.amount, 0);
  const amountTransferredToOwner = expenses.filter(e => e.category === 'Transfer to Owner' || e.category === 'Transferred to Owner').reduce((acc, curr) => acc + curr.amount, 0);
  const netRevenue = totalIncome - totalExpense;

  const transactions = [
    ...incomes.map(inc => ({
      id: inc.id,
      date: inc.paidDate || inc.dueDate,
      description: t('income_ledger_title'),
      income: inc.amount,
      expense: 0,
      transferred: 0,
      rawDate: inc.paidDate || inc.dueDate
    })),
    ...expenses.map(exp => {
      const isTransfer = exp.category === 'Transfer to Owner' || exp.category === 'Transferred to Owner';
      return {
        id: exp.id,
        date: exp.date,
        description: isTransfer ? t('cat_transfer_owner') : exp.category,
        income: 0,
        expense: isTransfer ? 0 : exp.amount,
        transferred: isTransfer ? exp.amount : 0,
        rawDate: exp.date
      };
    })
  ].sort((a, b) => new Date(a.rawDate || 0).getTime() - new Date(b.rawDate || 0).getTime());

  const filteredTransactions = transactions.filter(txn => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      txn.description.toLowerCase().includes(term) ||
      txn.date.toLowerCase().includes(term) ||
      txn.income.toString().includes(term) ||
      txn.expense.toString().includes(term) ||
      txn.transferred.toString().includes(term)
    );
  });

  let runningBalance = 0;
  const ledgerData = filteredTransactions.map(txn => {
    runningBalance += txn.income - txn.expense - txn.transferred;
    return { ...txn, balance: runningBalance };
  });

  const handleExportLedger = () => {
    exportCSV(ledgerData.map(l => ({
      Date: l.date,
      Description: l.description,
      Income: l.income,
      Expense: l.expense,
      Transferred: l.transferred,
      Balance: l.balance
    })), 'Report_Ledger.csv');
  };

  const formatDigits = (str: string) => {
    if (!str) return '';
    if (language === 'ar') {
      return str.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
    }
    return str;
  };

  return (
    <div className="glass-panel p-6 animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <FileText /> {t('income_expense_report') || 'Income & Expense Report'}
        </h2>
      </div>

      {/* Date Filters */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.4)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
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
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('search_placeholder') || 'Search'}</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder={t('search_placeholder') || "Search any word..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.3)', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpRight size={16} color="var(--success)" />
            {t('paid_rent') || 'Total Income'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {(totalIncome || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.3)', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowDownRight size={16} color="var(--danger)" />
            {t('expenses') || 'Total Expenses'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {(totalExpense || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white', border: 'none' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            {t('net_revenue') || 'Net Revenue'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {(netRevenue || 0).toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.8 }}>{currency}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.3)', borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="var(--secondary)" />
            {t('amount_transferred_to_owner')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {(amountTransferredToOwner || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className="glass-panel p-4" style={{ display: 'flex', flexDirection: 'column', maxHeight: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1.125rem', color: 'var(--text-main)', margin: 0 }}>
              {t('transaction_detail')} ( {t('recent_transactions_title')} )
            </h4>
            <div className="print-hide" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', fontSize: '0.9rem' }} onClick={handleExportLedger}>
                <Download size={16} /> {t('export_csv')}
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
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('income')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('expense_label')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('transferred_col')}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('balance_col')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((txn, idx) => (
                    <tr key={txn.id + idx} className="print-break-inside-avoid" style={{ borderBottom: '1px solid var(--glass-border)', background: txn.transferred > 0 ? 'rgba(59, 130, 246, 0.05)' : txn.expense > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{formatDigits(txn.date)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, textAlign: 'start' }}>{txn.description}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: txn.income > 0 ? 'var(--success)' : 'inherit' }}>{txn.income > 0 ? `+${txn.income.toLocaleString()}` : '-'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: txn.expense > 0 ? 'var(--danger)' : 'inherit' }}>{txn.expense > 0 ? `-${txn.expense.toLocaleString()}` : '-'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: txn.transferred > 0 ? 'var(--secondary)' : 'inherit' }}>{txn.transferred > 0 ? `-${txn.transferred.toLocaleString()}` : '-'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', fontWeight: 700 }}>{txn.balance.toLocaleString()}</td>
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

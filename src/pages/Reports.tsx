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
  const qProperty = searchParams.get('property');

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
  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
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

  const nameMap: Record<string, string> = {
    'شقة رقم 1': 'Apartment 1',
    'شقة رقم 2': 'Apartment 2',
    'شقة رقم 3': 'Apartment 3',
    'شقة رقم 4': 'Apartment 4',
    'شقة رقم 5': 'Apartment 5',
    'شقة رقم 6': 'Apartment 6',
    'شقة السطح': 'Roof Apartment',
    'صهيب': 'Sohaib',
    'صهيب داغستاني': 'Sohaib Daghistani',
    'عبد المنعم': 'Abdelmonem',
    'عبدالمنعم': 'Abdelmonem',
    'وليد المصري': 'Waleed Al-Masri',
    'عماد': 'Emad',
    'فوزان البغدادي': 'Fawzan Al-Baghdadi',
    'مازن شمسي': 'Mazen Shamsi',
    'مازن ابو البحرين': 'Mazen Abu Bahrain',
    'أحمد': 'Ahmed',
    'محمد': 'Mohammed',
  };

  const translateName = (name: string, lang: string) => {
    if (lang !== 'en') return name;
    return nameMap[name] || name.replace('شقة رقم', 'Apartment');
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
      setPropertiesData(properties);

      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get('start');
      const endParam = urlParams.get('end');
      const propParam = urlParams.get('property');

      const currentStart = startParam || startDate;
      const currentEnd = endParam || endDate;

      const safeStartDate = toEnglishDigits(currentStart);
      const safeEndDate = toEnglishDigits(currentEnd);

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
        if (!inRange) return false;

        if (propParam) {
          const tnt = tenants.find(t => t.id === L.tenantId);
          const prop = properties.find(p => p.id === tnt?.propertyId);
          if (!prop?.name.toLowerCase().includes(propParam.toLowerCase())) return false;
        }

        if (qFilter === 'unpaid') {
          return L.status === 'Pending';
        }

        if (qFilter === 'income') {
          return L.status === 'Paid';
        }

        return true; // For 'contracted' or default
      });

      const filteredExpenses = allExpenses.filter(E => {
        const inRange = isDateInRange(E.date);
        if (!inRange) return false;

        if (propParam) {
          if (E.propertyId) {
            const prop = properties.find(p => p.id === E.propertyId);
            if (!prop?.name.toLowerCase().includes(propParam.toLowerCase())) return false;
          } else {
            // If expense has no propertyId, should we show it when a property is filtered?
            // Usually no, unless it's a general expense.
            return false;
          }
        }
        return true;
      });

      setIncomes(filteredIncomes.map(L => {
        const tnt = tenants.find(t => t.id === L.tenantId);
        const prop = properties.find(p => p.id === tnt?.propertyId);
        const combined = tnt ? `${tnt.tenantName}${prop ? ` (${prop.name})` : ''}` : '';
        return { 
          ...L, 
          tenantName: combined, 
          tenantId: L.tenantId,
          propertyId: prop?.id || 'unknown',
          propertyName: prop?.name || t('unknown_property')
        };
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
          if (propParam) {
            const tnt = tenants.find(t => t.id === L.tenantId);
            const prop = properties.find(p => p.id === tnt?.propertyId);
            if (!prop?.name.toLowerCase().includes(propParam.toLowerCase())) return;
          }
          pContracted += L.amount;
          if (L.status === 'Paid') pIncome += L.amount;
          if (L.status === 'Pending') pUnpaid += L.amount;
        }
      });

      allExpenses.forEach(E => {
        if (isDateInRange(E.date)) {
          if (propParam) {
            if (E.propertyId) {
              const prop = properties.find(p => p.id === E.propertyId);
              if (!prop?.name.toLowerCase().includes(propParam.toLowerCase())) return;
            } else {
              return;
            }
          }
          const isTransfer = E.category.toLowerCase().includes('transfer') && E.category.toLowerCase().includes('owner');
          if (isTransfer) pTransferred += E.amount;
          else pExpense += E.amount;
        }
      });

      // Building Utilization Data
      const startM = moment(startBoundMs);
      const endM = moment(endBoundMs);
      const daysDiff = Math.abs(endM.diff(startM, 'days')) + 1;
      
      // Intelligent period factor:
      // If the range is roughly a multiple of 354 days (Hijri) or 365.25 days (Gregorian),
      // we should treat it as whole years to avoid floating point drift.
      let periodFactor = daysDiff / 365.25;
      
      if (calendarMode === 'hijri') {
        const hijriYears = daysDiff / 354.36;
        if (Math.abs(hijriYears - Math.round(hijriYears)) < 0.05) {
          periodFactor = Math.round(hijriYears);
        } else {
          periodFactor = daysDiff / 354.36;
        }
      } else {
        const gregYears = daysDiff / 365.25;
        if (Math.abs(gregYears - Math.round(gregYears)) < 0.05) {
          periodFactor = Math.round(gregYears);
        }
      }

      const util: Record<string, any> = {};
      properties.forEach(p => {
        util[p.id] = {
          id: p.id,
          name: p.name,
          potential: (p.annualRent || 0) * periodFactor,
          contracted: 0,
          collected: 0,
          unpaid: 0,
          tenantId: ''
        };
      });

      allLedgers.forEach(L => {
        if (isDateInRange(L.dueDate || '')) {
          const tnt = tenants.find(t => t.id === L.tenantId);
          if (tnt && util[tnt.propertyId]) {
            if (L.status === 'Paid') util[tnt.propertyId].collected += L.amount;
            else util[tnt.propertyId].unpaid += L.amount;
            util[tnt.propertyId].tenantId = L.tenantId;
          }
        }
      });

      // Calculate 'Contracted' rent based on occupancy within the period
      properties.forEach(p => {
        const pTenants = tenants.filter(t => t.propertyId === p.id);
        let totalContractedForProp = 0;
        
        pTenants.forEach(tnt => {
          const parseSafeDate = (d: string) => {
            if (!d) return 0;
            const cleanD = toEnglishDigits(d).replace(/-/g, '/');
            if (cleanD.startsWith('14')) return moment(cleanD, 'iYYYY/iMM/iDD').toDate().getTime();
            return new Date(cleanD).getTime();
          };

          const tntStart = parseSafeDate(tnt.startDate);
          const tntEnd = parseSafeDate(tnt.endDate);
          
          const overlapStart = Math.max(startBoundMs, tntStart);
          const overlapEnd = Math.min(endBoundMs, tntEnd);
          
          if (overlapEnd > overlapStart) {
            const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
            const yearDays = calendarMode === 'hijri' ? 354.36 : 365.25;
            
            // Refined month-based occupancy for precision
            // 29.53 days is a mean Hijri month. 
            // If overlapDays is very close to a multiple of months, use the fraction for better precision
            const avgMonthDays = calendarMode === 'hijri' ? 29.53 : 30.44;
            const monthsOverlap = overlapDays / avgMonthDays;
            let occupancyFactor;
            
            if (Math.abs(monthsOverlap - Math.round(monthsOverlap)) < 0.1) {
               occupancyFactor = Math.round(monthsOverlap) / 12;
            } else {
               occupancyFactor = overlapDays / yearDays;
            }
            
            totalContractedForProp += (tnt.annualRent || p.annualRent || 0) * occupancyFactor;
            
            // Adjust potential for the property to include this contract's value if it's higher
            if (tnt.annualRent && tnt.annualRent > p.annualRent) {
               util[p.id].potential += (tnt.annualRent - p.annualRent) * occupancyFactor;
            }
          }
        });
        
        if (util[p.id]) {
          util[p.id].contracted = totalContractedForProp;
          util[p.id].unpaid = Math.max(0, util[p.id].contracted - util[p.id].collected);
        }
      });

      const filteredUtil = Object.values(util).filter((u: any) => {
        if (!propParam) return true;
        return u.name.toLowerCase().includes(propParam.toLowerCase());
      });
      setUtilizationData(filteredUtil);

      const filteredProps = properties.filter(p => {
        if (!propParam) return true;
        return p.name === propParam;
      });
      setPropertiesData(filteredProps);

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

  const summarizedIncomes = React.useMemo(() => {
    if (qFilter !== 'contracted' && qFilter !== 'unpaid' && qFilter !== 'income') return [];
    
    const summary: Record<string, { displayName: string, amount: number, propertyId: string, tenantId: string }> = {};
    
    incomes.forEach((inc: any) => {
      const key = inc.propertyId;
      if (!summary[key]) {
        summary[key] = { 
          displayName: translateName(inc.propertyName || inc.tenantName || '', language), 
          amount: 0, 
          propertyId: inc.propertyId,
          tenantId: inc.tenantId
        };
      }
      summary[key].amount += inc.amount;
      summary[key].tenantId = inc.tenantId;
    });
    
    return Object.values(summary).sort((a, b) => b.amount - a.amount);
  }, [incomes, qFilter, language]);

  const handleExportLedger = () => {
    if (qFilter === 'projected') {
      exportCSV(propertiesData.map(p => ({
        Property: p.name,
        Address: p.address || '',
        'Expected Rent': p.annualRent || 0
      })), 'Expected_Rent_Report.csv');
      return;
    }

    if (qFilter === 'contracted' || qFilter === 'income' || qFilter === 'unpaid') {
      exportCSV(summarizedIncomes.map(s => ({
        'Property / Apartment': s.displayName,
        'Amount': s.amount
      })), `Summarized_${qFilter}_Report.csv`);
      return;
    }

    if (qFilter === 'utilization') {
      exportCSV(utilizationData.map(u => ({
        'Property / Apartment': u.name,
        'Potential Rent': Math.round(u.potential),
        'Contracted Rent': Math.round(u.contracted),
        'Collected Rent': Math.round(u.collected),
        'Unpaid Rent': Math.round(u.unpaid)
      })), 'Building_Utilization_Report.csv');
      return;
    }

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
            <option value="projected">{t('projected_rent') || 'Projected Rent'}</option>
            <option value="contracted">{t('actual_contracted_rent') || 'Actual Contracted Rent'}</option>
            <option value="income">{t('collected_rent') || 'Paid Rent'}</option>
            <option value="unpaid">{t('unpaid_rent') || 'Unpaid / Overdue Rent'}</option>
            <option value="expense">{t('total_expenses') || 'Total Expenses'}</option>
            <option value="transfer">{t('transferred_amount') || 'Amount Transferred'}</option>
            <option value="utilization">{t('building_utilization') || 'Building Utilization'}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('property') || 'Property'}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input-field"
              style={{ flex: 1 }}
              placeholder={t('search_property') || 'Search Apartment...'}
              value={qProperty || ''}
              onChange={(e) => {
                const params = new URLSearchParams(location.search);
                if (e.target.value) {
                  params.set('property', e.target.value);
                } else {
                  params.delete('property');
                }
                navigate(`/dashboard/report?${params.toString()}`);
              }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {qFilter === 'projected' && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--text-muted)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--text-muted)" />
              {t('projected_rent') || 'Projected Rent'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {(propertiesData.reduce((sum, p) => sum + (p.annualRent || 0), 0)).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        )}

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
        
        {qFilter === 'utilization' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--text-muted)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t('potential') || 'Potential'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(utilizationData.reduce((acc, curr) => acc + curr.potential, 0)).toLocaleString()}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--secondary)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t('contracted') || 'Contracted'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(utilizationData.reduce((acc, curr) => acc + curr.contracted, 0)).toLocaleString()}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t('collected') || 'Collected'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(utilizationData.reduce((acc, curr) => acc + curr.collected, 0)).toLocaleString()}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t('unpaid') || 'Unpaid'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(utilizationData.reduce((acc, curr) => acc + curr.unpaid, 0)).toLocaleString()}</div>
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
            {qFilter === 'projected' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('property_name') || 'Property'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('property_address') || 'Address'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('projected_rent') || 'Projected Rent'}</th>
                  </tr>
                </thead>
                <tbody>
                  {propertiesData.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, textAlign: 'start' }}>{p.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'start' }}>{p.address || t('no_address_provided')}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', fontWeight: 700 }}>{(p.annualRent || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currency}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (qFilter === 'contracted' || qFilter === 'income' || qFilter === 'unpaid') ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('property_name') || 'Apartment / Property'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>
                      {qFilter === 'contracted' ? (t('actual_contracted_rent') || 'Contracted') : 
                       qFilter === 'income' ? (t('paid_rent') || 'Paid') : 
                       (t('unpaid_rent') || 'Unpaid')}
                    </th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {summarizedIncomes.map((s, idx) => (
                    <tr key={s.propertyId + idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, textAlign: 'start' }}>{s.displayName}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', fontWeight: 700 }}>
                        {s.amount.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currency}</span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button className="btn print-hide" onClick={() => navigate(`/dashboard/ledger/${s.tenantId}`)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--primary)', border: '1px solid var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto' }}>
                          {t('transaction_detail') || 'Tenant Detail'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : qFilter === 'utilization' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'start' }}>{t('property_name') || 'Apartment / Property'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('potential') || 'Potential'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('contracted') || 'Contracted'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('collected') || 'Collected'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'end' }}>{t('unpaid') || 'Unpaid'}</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {utilizationData.map((u, idx) => (
                    <tr key={u.id + idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'start' }}>{u.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: 'var(--text-muted)' }}>{Math.round(u.potential).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: 'var(--secondary)', fontWeight: 600 }}>{Math.round(u.contracted).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: 'var(--success)', fontWeight: 600 }}>{Math.round(u.collected).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'end', color: 'var(--danger)', fontWeight: 600 }}>{Math.round(u.unpaid).toLocaleString()}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {u.tenantId && (
                          <button className="btn print-hide" onClick={() => navigate(`/dashboard/ledger/${u.tenantId}`)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--primary)', border: '1px solid var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto' }}>
                            {t('transaction_detail') || 'Tenant Detail'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : ledgerData.length === 0 ? (
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

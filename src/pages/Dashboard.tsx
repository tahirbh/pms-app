import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Home, Users, Settings as SettingsIcon, LogOut, Receipt, Bell, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment-hijri';

// Force TS server to re-resolve the module if it was cached as missing
import Properties from './Properties';
import Tenants from './Tenants';
import Settings from './Settings';
import Expenses from './Expenses';
import TenantContractPage from './TenantContract';
import TenantLedger from './TenantLedger';
import Reports from './Reports';
import Pivot from './Pivot';
import { getProperties, getTenants, getExpenses, getAllLedgers, getImpersonatedId, setImpersonation } from '../utils/store';
import { ShieldAlert, X } from 'lucide-react';
import WhatsNewModal from '../components/WhatsNewModal';

declare const __APP_VERSION__: string;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: '#ffebee', borderRadius: '8px', margin: '2rem' }}>
          <h2>💥 Component Crash</h2>
          <p><strong>{this.state.error?.message}</strong></p>
          <pre style={{ overflowX: 'auto', fontSize: '12px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}



/** Get the current year key dynamically. */
const getCurrentYearKey = (calMode: 'gregorian' | 'hijri'): string => {
  if (calMode === 'hijri') return moment().format('iYYYY') + ' (H)';
  return new Date().getFullYear().toString();
};

/** Checks if `yearStr` is strictly before `currentYearStr` in a sortable sense. */
const isBeforeCurrentYear = (yearStr: string, currentYearStr: string): boolean => {
  if (yearStr === 'N/A' || currentYearStr === 'N/A') return false;
  return yearStr.localeCompare(currentYearStr) < 0;
};

const DashboardHome = () => {
  const { t } = useTranslation();
  const { currency, calendarMode } = useAppContext();
  const navigate = useNavigate();
  const impersonatedId = getImpersonatedId();

  // ── Current year metrics (top cards) ──
  const [currentYearMetrics, setCurrentYearMetrics] = useState({
    projectedRent: 0,
    contractedRent: 0,
    collectedRent: 0,
    totalExpenses: 0,
    transferredAmount: 0,
    unpaidRent: 0,
    cashInHand: 0,
  });



  // ── Historical per-year data for dropdowns ──
  const [availableHistYears, setAvailableHistYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [historicalDataPerYear, setHistoricalDataPerYear] = useState<Record<string, { contractedRent: number, collectedRent: number, totalExpenses: number, transferredAmount: number }>>({});

  // ── Charts & notifications ──
  // ── Charts & notifications ──
  const [currentUtilizationData, setCurrentUtilizationData] = useState<{ name: string, potential: number, contracted: number, collected: number, pending: number, vacant: number }[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [allLedgersData, setAllLedgersData] = useState<any[]>([]);
  const [ledgerStats, setLedgerStats] = useState({ paid: 0, overdue: 0, upcoming: 0 });
  const [notifications, setNotifications] = useState<{ id: string, tenantId: string, name: string, type: 'overdue' | 'upcoming', amount: number, date: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Current year key (computed once)
  const currentYearKey = getCurrentYearKey(calendarMode);

  useEffect(() => {
    const loadAll = async () => {
      const props = await getProperties();
      const tenants = await getTenants();
      const expenses = await getExpenses();
      const allLedgers = await getAllLedgers();

      setAllProperties(props);
      setAllTenants(tenants);
      setAllLedgersData(allLedgers);

      // ── Determine current year key ──
      const cyKey = getCurrentYearKey(calendarMode);

      // ── Per-year accumulation (for both current + historical) ──
      const yearData: Record<string, { contractedRent: number, collectedRent: number, totalExpenses: number, transferredAmount: number }> = {};
      const ensureYear = (yk: string) => {
        if (!yearData[yk]) yearData[yk] = { contractedRent: 0, collectedRent: 0, totalExpenses: 0, transferredAmount: 0 };
      };

      // ── Process expenses ──
      expenses.forEach(exp => {
        let yearStr = '';
        const rawYear = exp.date.split(/[\/-]/)[0];
        const isGregorianString = parseInt(rawYear) > 1900 && parseInt(rawYear) < 2100;

        if (calendarMode === 'hijri') {
          if (isGregorianString) {
            // Convert Gregorian to Hijri
            yearStr = moment(exp.date, ['YYYY/MM/DD', 'YYYY-MM-DD']).format('iYYYY') + ' (H)';
          } else {
            // Already Hijri
            yearStr = rawYear + ' (H)';
          }
        } else {
          if (!isGregorianString) {
            // Convert Hijri to Gregorian
            yearStr = moment(exp.date, ['iYYYY/iMM/iDD', 'iYYYY-iMM-iDD']).format('YYYY');
          } else {
            // Already Gregorian
            yearStr = rawYear;
          }
        }

        ensureYear(yearStr);

        const cat = exp.category.toLowerCase();
        const isTransfer = cat.includes('transfer') && cat.includes('owner');
        if (isTransfer) {
          yearData[yearStr].transferredAmount += exp.amount;
        } else {
          yearData[yearStr].totalExpenses += exp.amount;
        }
      });

      // ── Process ledgers ──
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      let currentMonthPaid = 0;
      let totalOverdue = 0;
      let upcomingRent = 0;
      const notifs: typeof notifications = [];

      allLedgers.forEach(L => {
        const tnt = tenants.find(t => t.id === L.tenantId);
        if (!tnt) return;

        let ledgerDate: Date;
        let yearStr: string;
        if (tnt.calendarMode === 'hijri') {
          const m = moment(L.dueDate, 'iYYYY/iMM/iDD');
          ledgerDate = m.toDate();
          yearStr = m.format('iYYYY') + ' (H)';
        } else {
          ledgerDate = new Date(L.dueDate);
          yearStr = ledgerDate.getFullYear().toString();
        }

        ensureYear(yearStr);
        // All ledger amounts count as "contracted"
        yearData[yearStr].contractedRent += L.amount;

        if (L.status === 'Paid') {
          yearData[yearStr].collectedRent += L.amount;

          // Count recent payments (last 30 days) towards ledger donut
          if (ledgerDate >= thirtyDaysAgo && ledgerDate <= thirtyDaysFromNow) {
            currentMonthPaid += L.amount;
          }
        } else {
          // Overdue / upcoming notifications
          if (ledgerDate < today) {
            totalOverdue += L.amount;
            notifs.push({ id: L.id, tenantId: L.tenantId, name: tnt.tenantName, type: 'overdue', amount: L.amount, date: L.dueDate });
          } else if (ledgerDate <= thirtyDaysFromNow) {
            upcomingRent += L.amount;
            if (ledgerDate.getTime() - today.getTime() <= 10 * 24 * 60 * 60 * 1000) {
              notifs.push({ id: L.id, tenantId: L.tenantId, name: tnt.tenantName, type: 'upcoming', amount: L.amount, date: L.dueDate });
            }
          }
        }
      });

      // ── Separate current-year vs historical ──
      let cyContracted = 0, cyCollected = 0, cyExpenses = 0, cyTransferred = 0;
      let hContracted = 0, hCollected = 0, hExpenses = 0, hTransferred = 0;
      const histPerYear: typeof yearData = {};
      const allYearsSet = new Set<string>();

      Object.entries(yearData).forEach(([yk, vals]) => {
        allYearsSet.add(yk);
        if (yk === cyKey) {
          // Current year: top cards
          cyContracted += vals.contractedRent;
          cyCollected += vals.collectedRent;
          cyExpenses += vals.totalExpenses;
          cyTransferred += vals.transferredAmount;
        } else if (isBeforeCurrentYear(yk, cyKey)) {
          // Historical: previous years only
          hContracted += vals.contractedRent;
          hCollected += vals.collectedRent;
          hExpenses += vals.totalExpenses;
          hTransferred += vals.transferredAmount;
          histPerYear[yk] = vals;
        }
        // Years AFTER current are ignored in both sections
      });

      // Projected/potential rent from properties
      let projectedRent = 0;
      props.forEach(p => { projectedRent += p.annualRent; });

      // Unpaid rent = max(0, contracted - collected)
      const cyUnpaid = Math.max(0, cyContracted - cyCollected);

      setCurrentYearMetrics({
        projectedRent,
        contractedRent: cyContracted,
        collectedRent: cyCollected,
        totalExpenses: cyExpenses,
        transferredAmount: cyTransferred,
        unpaidRent: cyUnpaid,
        cashInHand: cyCollected - cyExpenses - cyTransferred,
      });


      // ── Historical year dropdown setup (exclude current year and future) ──
      const sortedHistYears = Object.keys(histPerYear).sort((a, b) => a.localeCompare(b));
      setAvailableHistYears(sortedHistYears);
      if (sortedHistYears.length > 0) {
        setStartYear(sortedHistYears[0]);
        setEndYear(sortedHistYears[sortedHistYears.length - 1]);
      }
      setHistoricalDataPerYear(histPerYear);

      // ── Ledger stats (donut chart) ──
      setLedgerStats({ paid: currentMonthPaid, overdue: totalOverdue, upcoming: upcomingRent });
      setNotifications(notifs.sort((a: any, b: any) => a.type === 'overdue' ? -1 : (b.type === 'overdue' ? 1 : 0)));

      // ── Current Year Building utilization chart ──
      const currentBuildUtil = props.map(p => {
        const pTenants = tenants.filter(t => t.propertyId === p.id);
        
        let contracted = 0;
        let collected = 0;

        pTenants.forEach(tnt => {
          const tenantLedgers = allLedgers.filter(l => l.tenantId === tnt.id);
          tenantLedgers.forEach(L => {
            let yearStr: string;
            if (tnt.calendarMode === 'hijri') {
              yearStr = moment(L.dueDate, 'iYYYY/iMM/iDD').format('iYYYY') + ' (H)';
            } else {
              yearStr = new Date(L.dueDate).getFullYear().toString();
            }

            if (yearStr === cyKey) {
              contracted += L.amount;
              if (L.status === 'Paid') collected += L.amount;
            }
          });
        });

        return {
          name: p.name,
          potential: p.annualRent,
          contracted,
          collected,
          pending: Math.max(0, contracted - collected),
          vacant: Math.max(0, p.annualRent - contracted)
        };
      });
      setCurrentUtilizationData(currentBuildUtil);
    };

    loadAll();
  }, [calendarMode]);

  // ── Filtered historical metrics based on year dropdown ──
  const filteredHistMetrics = React.useMemo(() => {
    if (!startYear || !endYear || availableHistYears.length === 0) {
      return { contractedRent: 0, collectedRent: 0, totalExpenses: 0, transferredAmount: 0, unpaidRent: 0 };
    }
    const startIndex = availableHistYears.indexOf(startYear);
    const endIndex = availableHistYears.indexOf(endYear);
    let c = 0, col = 0, e = 0, tr = 0;
    availableHistYears.forEach((y, i) => {
      if (i >= startIndex && i <= endIndex) {
        c += historicalDataPerYear[y]?.contractedRent || 0;
        col += historicalDataPerYear[y]?.collectedRent || 0;
        e += historicalDataPerYear[y]?.totalExpenses || 0;
        tr += historicalDataPerYear[y]?.transferredAmount || 0;
      }
    });
    return {
      contractedRent: c,
      collectedRent: col,
      totalExpenses: e,
      transferredAmount: tr,
      unpaidRent: Math.max(0, c - col),
    };
  }, [startYear, endYear, availableHistYears, historicalDataPerYear]);

  // ── Historical Utilization Memo ──
  const historicalUtilizationData = React.useMemo(() => {
    if (!startYear || !endYear || availableHistYears.length === 0 || allProperties.length === 0) return [];
    
    const startIndex = availableHistYears.indexOf(startYear);
    const endIndex = availableHistYears.indexOf(endYear);
    const selectedYears = availableHistYears.slice(startIndex, endIndex + 1);
    const yearsCount = selectedYears.length;

    return allProperties.map(p => {
      const pTenants = allTenants.filter(t => t.propertyId === p.id);
      let contracted = 0;
      let collected = 0;

      pTenants.forEach(tnt => {
        const tenantLedgers = allLedgersData.filter(l => l.tenantId === tnt.id);
        tenantLedgers.forEach(L => {
          let yearStr: string;
          if (tnt.calendarMode === 'hijri') {
            yearStr = moment(L.dueDate, 'iYYYY/iMM/iDD').format('iYYYY') + ' (H)';
          } else {
            yearStr = new Date(L.dueDate).getFullYear().toString();
          }

          if (selectedYears.includes(yearStr)) {
            contracted += L.amount;
            if (L.status === 'Paid') collected += L.amount;
          }
        });
      });

      return {
        name: p.name,
        potential: p.annualRent * yearsCount,
        contracted,
        collected,
        pending: Math.max(0, contracted - collected),
        vacant: Math.max(0, (p.annualRent * yearsCount) - contracted)
      };
    });
  }, [startYear, endYear, availableHistYears, allProperties, allTenants, allLedgersData]);

  // ── Click handlers: navigate with correct filter ──
  const handleCardClick = (type: string, isHistorical: boolean) => {
    let qStart = '';
    let qEnd = '';

    if (isHistorical) {
      // Historical: use selected start/end year range or default to "all history"
      if (startYear && endYear) {
        qStart = startYear.includes('(H)') ? `${startYear.split(' ')[0]}/01/01` : `${startYear}/01/01`;
        qEnd = endYear.includes('(H)') ? `${endYear.split(' ')[0]}/12/30` : `${endYear}/12/31`;
      } else {
        // Default historical range: All time up until the END of the previous year
        if (calendarMode === 'hijri') {
          const prevYear = parseInt(moment().format('iYYYY')) - 1;
          qStart = "1400/01/01";
          qEnd = `${prevYear}/12/30`;
        } else {
          const prevYear = new Date().getFullYear() - 1;
          qStart = "2000/01/01";
          qEnd = `${prevYear}/12/31`;
        }
      }
    } else {
      // Current year only
      if (calendarMode === 'hijri') {
        const cy = moment().format('iYYYY');
        qStart = `${cy}/01/01`;
        qEnd = `${cy}/12/30`;
      } else {
        const cy = new Date().getFullYear();
        qStart = `${cy}/01/01`;
        qEnd = `${cy}/12/31`;
      }
    }

    const params = new URLSearchParams();
    if (qStart) params.append('start', qStart);
    if (qEnd) params.append('end', qEnd);

    // Contracted rent → show all contracts in all-ledgers
    if (type === 'contracted_rent') {
      navigate(`/dashboard/all-ledgers?${params.toString()}`);
      return;
    }

    // Unpaid rent → show only unpaid ledgers
    if (type === 'unpaid_rent') {
      params.append('status', 'unpaid');
      navigate(`/dashboard/all-ledgers?${params.toString()}`);
      return;
    }

    // Cash in hand → show income report
    if (type === 'cash_in_hand') {
      params.append('filter', 'income');
      navigate(`/dashboard/report?${params.toString()}`);
      return;
    }

    // Collected / Expenses / Transferred → Reports page with filter
    if (type === 'collected_rent') params.append('filter', 'income');
    else if (type === 'total_expenses') params.append('filter', 'expense');
    else if (type === 'transferred_amount') params.append('filter', 'transfer');

    navigate(`/dashboard/report?${params.toString()}`);
  };

  const handleUtilizationClick = (entry: any, type: string, isHistorical: boolean) => {
    const prop = allProperties.find(p => p.name === entry.name);
    if (!prop) return;

    let qStart = '';
    let qEnd = '';

    if (isHistorical) {
      if (startYear && endYear) {
        qStart = startYear.includes('(H)') ? `${startYear.split(' ')[0]}/01/01` : `${startYear}/01/01`;
        qEnd = endYear.includes('(H)') ? `${endYear.split(' ')[0]}/12/30` : `${endYear}/12/31`;
      }
    } else {
      if (calendarMode === 'hijri') {
        const cy = moment().format('iYYYY');
        qStart = `${cy}/01/01`;
        qEnd = `${cy}/12/30`;
      } else {
        const cy = new Date().getFullYear();
        qStart = `${cy}/01/01`;
        qEnd = `${cy}/12/31`;
      }
    }

    const params = new URLSearchParams();
    if (qStart) params.append('start', qStart);
    if (qEnd) params.append('end', qEnd);
    params.append('property', prop.name);

    if (type === 'potential') {
      navigate(`/dashboard/all-ledgers?${params.toString()}`);
    } else if (type === 'contracted') {
      navigate(`/dashboard/all-ledgers?${params.toString()}`);
    } else if (type === 'collected') {
      params.append('status', 'paid');
      navigate(`/dashboard/all-ledgers?${params.toString()}`);
    } else if (type === 'pending') {
      params.append('status', 'unpaid');
      navigate(`/dashboard/all-ledgers?${params.toString()}`);
    } else if (type === 'vacant') {
      navigate(`/dashboard/properties?search=${prop.name}`);
    }
  };

  // ── Chart data ──
  const barData = [
    { name: t('rent_comparison'), expected: currentYearMetrics.projectedRent, contracted: currentYearMetrics.contractedRent, collected: currentYearMetrics.collectedRent }
  ];

  const pieData = [
    { name: t('collected_rent'), value: currentYearMetrics.collectedRent },
    { name: t('expense_label'), value: currentYearMetrics.totalExpenses + currentYearMetrics.transferredAmount },
  ];
  const COLORS = ['#10b981', '#ef4444'];
  const ledgerPieData = [
    { name: t('paid_rent') || 'Paid (30 Days)', value: ledgerStats.paid },
    { name: t('overdue_rent') || 'Overdue', value: ledgerStats.overdue },
    { name: t('upcoming_rent') || 'Upcoming (30 Days)', value: ledgerStats.upcoming }
  ];
  const LEDGER_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  return (
    <div className="glass-panel p-6 animate-slide-in relative">
      {impersonatedId && (
        <div style={{ 
          background: 'var(--accent)', 
          color: 'white', 
          padding: '1rem 2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldAlert size={24} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>SUPPORT MODE ACTIVE</p>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Viewing data for User ID: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{impersonatedId}</code></p>
            </div>
          </div>
          <button 
            onClick={() => { setImpersonation(null); window.location.reload(); }}
            style={{ 
              background: 'white', 
              color: 'var(--accent)', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <X size={16} /> Exit
          </button>
        </div>
      )}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button
          className="btn"
          style={{ position: 'relative', padding: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={24} color="var(--primary)" />
          <span className="btn-text">{t('notifications')}</span>

          {notifications.length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '3rem', right: 0, width: '350px', zIndex: 50, padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
            <h4 style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', margin: 0, fontWeight: 600 }}>{t('notifications')}</h4>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('no_notifications')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((n: any) => (
                  <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }} onClick={() => navigate(`/dashboard/ledger/${n.tenantId}`)}>
                    <AlertCircle size={20} color={n.type === 'overdue' ? 'var(--danger)' : 'var(--accent)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {n.name}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: n.type === 'overdue' ? 'var(--danger)' : 'var(--accent)' }}>
                        {n.type === 'overdue' ? t('overdue_alert') : t('upcoming_alert')}: {Math.round(n.amount).toLocaleString()} {currency}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t('due_date')}: {n.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem', paddingRight: '3rem' }}>{t('welcome_title')}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem' }}>{t('welcome_subtitle')}</p>

      {/* ═══════ TOP CARDS — CURRENT YEAR ONLY ═══════ */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem 0' }}>📈 {t('current_year_metrics') || 'Current Year Metrics'} ({currentYearKey})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { key: 'projected_rent', label: t('projected_rent'), value: currentYearMetrics.projectedRent, color: 'var(--text-muted)', icon: '📋' },
          { key: 'contracted_rent', label: t('actual_contracted_rent') || 'Actual Contracted Rent', value: currentYearMetrics.contractedRent, color: 'var(--secondary)', icon: '📜' },
          { key: 'collected_rent', label: t('collected_rent'), value: currentYearMetrics.collectedRent, color: 'var(--primary)', icon: '✅' },
          { key: 'total_expenses', label: t('total_expenses'), value: currentYearMetrics.totalExpenses, color: 'var(--danger)', icon: '💸' },
          { key: 'transferred_amount', label: t('transferred_amount'), value: currentYearMetrics.transferredAmount, color: 'var(--accent)', icon: '🏦' },
          { key: 'unpaid_rent', label: t('unpaid_rent') || 'Unpaid Rent', value: currentYearMetrics.unpaidRent, color: currentYearMetrics.unpaidRent > 0 ? 'var(--danger)' : 'var(--success)', icon: '⚠️' },
          { key: 'cash_in_hand', label: t('cash_in_hand') || 'Cash in Hand', value: currentYearMetrics.cashInHand, color: 'var(--success)', icon: '💰' },
        ].map((card) => (
          <div
            key={card.key}
            className="glass-panel"
            style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${card.color}`, display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => handleCardClick(card.key, false)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ fontSize: '1.4rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>
              {Math.round(card.value || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ HISTORICAL CARDS — PREVIOUS YEARS ONLY ═══════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>📅 {t('historical_metrics') || 'Historical Metrics'}</h3>
        {availableHistYears.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{t('start_year') || 'Start Year'}</label>
              <select className="input" value={startYear} onChange={(e) => setStartYear(e.target.value)} style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
                {availableHistYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{t('end_year') || 'End Year'}</label>
              <select className="input" value={endYear} onChange={(e) => setEndYear(e.target.value)} style={{ padding: '0.3rem 0.5rem', minWidth: '100px' }}>
                {availableHistYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { key: 'contracted_rent', label: t('actual_contracted_rent') || 'Actual Contracted Rent', value: filteredHistMetrics.contractedRent, color: 'var(--secondary)', icon: '📋' },
          { key: 'collected_rent', label: t('collected_rent'), value: filteredHistMetrics.collectedRent, color: 'var(--primary)', icon: '✅' },
          { key: 'total_expenses', label: t('total_expenses'), value: filteredHistMetrics.totalExpenses, color: 'var(--danger)', icon: '💸' },
          { key: 'transferred_amount', label: t('transferred_amount'), value: filteredHistMetrics.transferredAmount, color: 'var(--accent)', icon: '🏦' },
          { key: 'unpaid_rent', label: t('unpaid_rent') || 'Unpaid Rent', value: filteredHistMetrics.unpaidRent, color: filteredHistMetrics.unpaidRent > 0 ? 'var(--danger)' : 'var(--success)', icon: '⚠️' },
        ].map((card) => (
          <div
            key={`hist-${card.key}`}
            className="glass-panel"
            style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${card.color}`, display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(var(--glass-bg), 0.4)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => handleCardClick(card.key, true)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ fontSize: '1.4rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>
              {Math.round(card.value || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>📊 {t('financial_analytics')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{t('financial_analytics_subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

        {/* Expected vs Actual Rent Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('expected_vs_actual')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('expected_vs_actual_sub')}</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Math.round(Number(value)).toLocaleString()} ${currency}`} />
                <Bar dataKey="expected" name={t('expected_annual') || 'Annual Expected'} fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contracted" name={t('actual_contracted_rent') || 'Contracted Amount'} fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name={t('collected_rent') || 'Collected Amount'} fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('income_vs_expenses')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('income_vs_expenses_sub')}</p>
          <div style={{ width: '100%', height: 260 }}>
            {currentYearMetrics.collectedRent === 0 && currentYearMetrics.totalExpenses === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Math.round(Number(value)).toLocaleString()} ${currency}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[0] }}></span> {t('income')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[1] }}></span> {t('expense_label')}</span>
            </div>
          </div>
        </div>

        {/* Ledger Collection 30-Day Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('ledger_revenue')}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('ledger_revenue_sub')}</p>
          <div style={{ width: '100%', height: 260 }}>
            {ledgerStats.paid === 0 && ledgerStats.overdue === 0 && ledgerStats.upcoming === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={ledgerPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ledgerPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={LEDGER_COLORS[index % LEDGER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Math.round(Number(value)).toLocaleString()} ${currency}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: LEDGER_COLORS[0] }}></span> {t('paid_rent')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: LEDGER_COLORS[1] }}></span> {t('overdue_rent')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: LEDGER_COLORS[2] }}></span> {t('upcoming_rent')}</span>
            </div>
          </div>
        </div>

        {/* Current Building Utilization Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('building_utilization')} ({currentYearKey})</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('building_utilization_sub')}</p>
          <div style={{ width: '100%', height: 320 }}>
            {currentUtilizationData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={currentUtilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Math.round(Number(value)).toLocaleString()} ${currency}`} />
                  <Bar dataKey="potential" name={t('potential_rent_annual') || 'Annual Potential'} fill="var(--text-muted)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'potential', false)} cursor="pointer" />
                  <Bar dataKey="contracted" name={t('actual_contracted_rent') || 'Contracted'} fill="var(--secondary)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'contracted', false)} cursor="pointer" />
                  <Bar dataKey="collected" name={t('collected_rent') || 'Collected'} fill="var(--primary)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'collected', false)} cursor="pointer" />
                  <Bar dataKey="pending" name={t('pending_rent') || 'Pending'} fill="var(--danger)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'pending', false)} cursor="pointer" />
                  <Bar dataKey="vacant" name={t('vacant_rent') || 'Vacant'} fill="#ffc107" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'vacant', false)} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Historical Building Utilization Bar Chart */}
        {availableHistYears.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.3rem 0' }}>{t('historical_utilization') || 'Historical Building Utilization'} ({startYear} - {endYear})</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('historical_utilization_sub') || 'Comparison of potential, contracted, and collected rent for the selected historical period.'}</p>
            <div style={{ width: '100%', height: 320 }}>
              {historicalUtilizationData.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('no_data')}</div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={historicalUtilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Math.round(Number(value)).toLocaleString()} ${currency}`} />
                    <Bar dataKey="potential" name={t('potential_rent_annual') || 'Potential Total'} fill="var(--text-muted)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'potential', true)} cursor="pointer" />
                    <Bar dataKey="contracted" name={t('actual_contracted_rent') || 'Contracted Total'} fill="var(--secondary)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'contracted', true)} cursor="pointer" />
                    <Bar dataKey="collected" name={t('collected_rent') || 'Collected Total'} fill="var(--primary)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'collected', true)} cursor="pointer" />
                    <Bar dataKey="pending" name={t('pending_rent') || 'Pending Total'} fill="var(--danger)" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'pending', true)} cursor="pointer" />
                    <Bar dataKey="vacant" name={t('vacant_rent') || 'Vacant Total'} fill="#ffc107" radius={[4, 4, 0, 0]} onClick={(data) => handleUtilizationClick(data, 'vacant', true)} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import AllTenantsLedger from './AllTenantsLedger';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('last_seen_version');
    if (lastSeen !== __APP_VERSION__) {
      setShowWhatsNew(true);
    }
  }, []);

  const handleCloseWhatsNew = () => {
    setShowWhatsNew(false);
    localStorage.setItem('last_seen_version', __APP_VERSION__);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { path: '/dashboard/properties', label: t('properties'), icon: Home },
    { path: '/dashboard/tenants', label: t('tenants'), icon: Users },
    { path: '/dashboard/expenses', label: t('expenses'), icon: Receipt },
    { path: '/dashboard/all-ledgers', label: t('ledgers'), icon: Users },
    { path: '/dashboard/report', label: t('reports'), icon: FileText },
    { path: '/dashboard/settings', label: t('settings'), icon: SettingsIcon },
  ];

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar Navigation */}
      <aside className="glass-panel sidebar">
        <div className="app-title" style={{ padding: '2rem 1.5rem', fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="app-title-glow">{t('app_title')}</span>
          <button 
            onClick={() => setShowWhatsNew(true)}
            className="version-badge" 
            style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title={t('whats_new_title')}
          >
            v{__APP_VERSION__} <Sparkles size={10} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon && <item.icon size={20} />}
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '8px' }}>
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.user_metadata?.full_name || user.email}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button onClick={handleSignOut} className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', background: 'transparent' }}>
            <LogOut size={20} />
            <span className="sidebar-label">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content" style={{ overflowY: 'auto' }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="properties" element={<Properties />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="contract/:id" element={<TenantContractPage />} />
            <Route path="ledger/:id" element={<TenantLedger />} />
            <Route path="all-ledgers" element={<AllTenantsLedger />} />
            <Route path="report" element={<Reports />} />
            <Route path="pivot" element={<Pivot />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </ErrorBoundary>
      </div>
      <WhatsNewModal 
        isOpen={showWhatsNew} 
        onClose={handleCloseWhatsNew} 
        currentVersion={__APP_VERSION__} 
      />
    </div>
  );
};

export default Dashboard;

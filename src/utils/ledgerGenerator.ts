import moment from 'moment-hijri';
import { calculateRent, toEnglishDigits } from './rentCalculator';
import type { ContractLedger } from './store';

export const generateLedgerSchedules = (
  tenantId: string,
  annualRent: number,
  startDateStr: string,
  endDateStr: string,
  paymentPlan: 'Monthly' | '3 Month' | '6 Month' | 'Yearly',
  calendarMode: 'gregorian' | 'hijri'
): Omit<ContractLedger, 'id' | 'created_at'>[] => {
  const ledgers: Omit<ContractLedger, 'id' | 'created_at'>[] = [];
  const intervalMonths = paymentPlan === 'Monthly' ? 1 : paymentPlan === '3 Month' ? 3 : paymentPlan === '6 Month' ? 6 : 12;
  
  // Format for moment parsing robustness
  const sDate = startDateStr.replace(/-/g, '/');
  const eDate = endDateStr.replace(/-/g, '/');
  
  let currentStr = toEnglishDigits(sDate);
  let loopCount = 0;
  
  while(loopCount < 1000) {
    loopCount++;
    let nextDateStr = '';
    
    // Advance the internal chronometer by the designated interval constraint
    if (calendarMode === 'hijri') {
      const m = moment(currentStr, 'iYYYY/iMM/iDD').locale('en');
      m.add(intervalMonths, 'iMonth');
      nextDateStr = m.format('iYYYY/iMM/iDD');
      
      const mEnd = moment(toEnglishDigits(eDate), 'iYYYY/iMM/iDD').locale('en');
      if (m.isAfter(mEnd) || m.isSame(mEnd)) {
        nextDateStr = eDate;
      }
    } else {
      const d = new Date(currentStr);
      d.setMonth(d.getMonth() + intervalMonths);
      const eD = new Date(eDate);
      
      if (isNaN(d.getTime())) {
        break; // Stop completely if calculation yielded invalid JS native date object
      }

      if (d >= eD) {
        nextDateStr = eDate;
      } else {
        // Prevent JS locale formatting edge cases by forcing strict ISO padding
        nextDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    if (nextDateStr === currentStr || nextDateStr === 'Invalid date') break;
    
    // Standardize rent to perfectly equal divisions (fixes variance confusion)
    const standardChunk = annualRent / (12 / intervalMonths);
    const actualProrated = calculateRent(annualRent, currentStr, nextDateStr, calendarMode).expectedContractRent;
    
    let chunkRent = standardChunk;
    
    // If the true pro-rated value is significantly smaller (e.g., a fractional period at the end),
    // use the exact prorated amount instead of the full standard chunk.
    if (actualProrated > 0 && actualProrated < standardChunk * 0.85) {
      chunkRent = actualProrated;
    } else if (isNaN(actualProrated) || actualProrated === 0) {
      chunkRent = 0;
    }
    
    // Filter $0 ghost chunks caused by exact date overlaps or NaN calculations
    if (chunkRent > 0 && !isNaN(chunkRent)) {
      ledgers.push({
        tenantId,
        dueDate: currentStr, // The invoice effectively generates at the start of this chunk period
        amount: Math.round(chunkRent * 100) / 100,
        status: 'Pending',
        paymentMode: null,
        paidDate: null
      });
    }
    
    if (nextDateStr === eDate) break;
    currentStr = nextDateStr;
  }
  
  return ledgers;
};

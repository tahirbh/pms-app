import moment from 'moment-hijri';

export const toEnglishDigits = (str: string) => {
  if (!str) return str;
  return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

export type RentCalculationResult = {
  activeDays: number;
  daysInBillingCycle: number;
  monthlyRent: number;
  dailyRate: number;
  currentMonthRentDue: number;
  totalContractDays: number;
  expectedContractRent: number;
};

export const calculateRent = (
  annualRent: number,
  startDate: string,
  endDate: string,
  calendarMode: 'gregorian' | 'hijri' = 'gregorian',
  inclusive: boolean = true
): RentCalculationResult => {
  if (!annualRent || !startDate || !endDate) {
    return {
      activeDays: 0,
      daysInBillingCycle: 30, // Default to equal period
      monthlyRent: 0,
      dailyRate: 0,
      currentMonthRentDue: 0,
      totalContractDays: 0,
      expectedContractRent: 0,
    };
  }

  const isHijri = calendarMode === 'hijri' || startDate.includes('144');
  
  const daysInBillingCycle = 30; // Strict Equal Period Division
  const monthlyRent = annualRent / 12;
  const dailyRate = monthlyRent / daysInBillingCycle;

  let expectedContractRent = 0;
  let totalContractDays = 0;
  let activeDays = 0;

  if (isHijri) {
    const startM = moment(toEnglishDigits(startDate.replace(/-/g, '/')), 'iYYYY/iMM/iDD');
    const leaveMOrg = moment(toEnglishDigits(endDate.replace(/-/g, '/')), 'iYYYY/iMM/iDD');
    
    activeDays = leaveMOrg.iDate();
    totalContractDays = Math.max(0, Math.ceil(leaveMOrg.diff(startM, 'days'))) + (inclusive ? 1 : 0);

    // Equal period division: Exact months + 30-day fraction
    let leaveM = inclusive ? leaveMOrg.clone().add(1, 'days') : leaveMOrg.clone();
    
    // Hijri overflow protection: If the user picked 30th but it overflowed to 1st of next month,
    // we should treat the 1st as the already-exclusive end date for inclusive requests.
    const originalEndDay = parseInt(toEnglishDigits(endDate.split(/[/-]/).pop() || '0'), 10);
    if (inclusive && leaveMOrg.iDate() === 1 && originalEndDay >= 29) {
        leaveM = leaveMOrg.clone();
    }

    let mDiff = (leaveM.iYear() - startM.iYear()) * 12 + (leaveM.iMonth() - startM.iMonth());
    let dDiff = leaveM.iDate() - startM.iDate();

    if (dDiff < 0) {
      mDiff -= 1;
      dDiff += 30; // Borrow an equal period 30-day month
    }
    
    expectedContractRent = monthlyRent * (mDiff + (dDiff / 30));

  } else {
    const startD = new Date(startDate);
    const leaveDOrg = new Date(endDate);
    
    activeDays = leaveDOrg.getDate();
    totalContractDays = Math.max(0, Math.ceil((leaveDOrg.getTime() - startD.getTime()) / (1000 * 3600 * 24))) + (inclusive ? 1 : 0);

    // Equal period division
    const leaveD = inclusive ? new Date(endDate) : new Date(endDate);
    if (inclusive) leaveD.setDate(leaveD.getDate() + 1);

    let mDiff = (leaveD.getFullYear() - startD.getFullYear()) * 12 + (leaveD.getMonth() - startD.getMonth());
    let dDiff = leaveD.getDate() - startD.getDate();

    if (dDiff < 0) {
      mDiff -= 1;
      dDiff += 30; // Borrow an equal period 30-day month
    }

    expectedContractRent = monthlyRent * (mDiff + (dDiff / 30));
  }

  // Prevent negatives
  expectedContractRent = Math.max(0, expectedContractRent);
  
  const currentMonthRentDue = activeDays * dailyRate;

  return {
    activeDays,
    daysInBillingCycle,
    monthlyRent,
    dailyRate,
    currentMonthRentDue,
    totalContractDays,
    expectedContractRent
  };
};

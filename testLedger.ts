import { generateLedgerSchedules } from './src/utils/ledgerGenerator.js';
import { calculateRent } from './src/utils/rentCalculator.js';

console.log(generateLedgerSchedules('123', 12000, '2026-01-01', '2026-12-31', 'Monthly', 'gregorian'));

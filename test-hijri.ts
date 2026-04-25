import moment from 'moment-hijri';

const m = moment('1447/12/30', 'iYYYY/iMM/iDD');
console.log('Parsed Date:', m.format('iYYYY/iMM/iDD'));

const endOfYear = moment('1447', 'iYYYY').endOf('iYear');
console.log('endOf(iYear):', endOfYear.format('iYYYY/iMM/iDD'));

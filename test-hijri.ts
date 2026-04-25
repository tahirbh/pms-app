import moment from 'moment-hijri';

const cy = '١٤٤٦';
const mEnd = moment(cy, 'iYYYY').endOf('iYear');
console.log('IsValid:', mEnd.isValid());
console.log('iYear:', mEnd.iYear());
console.log('iMonth:', mEnd.iMonth());
console.log('iDate:', mEnd.iDate());

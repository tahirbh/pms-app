import moment from 'moment-hijri';

const t1 = moment('1447/12/30', 'iYYYY/iMM/iDD').toDate().getTime();
const t2 = moment('1448/01/01', 'iYYYY/iMM/iDD').toDate().getTime();

console.log('t1:', t1);
console.log('t2:', t2);
console.log('diff:', t2 - t1);

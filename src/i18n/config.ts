import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "login": "Log In",
      "dashboard": "Dashboard",
      "properties": "Properties",
      "tenants": "Tenants",
      "settings": "Settings",
      "welcome": "Manage your properties efficiently",
      "app_title": "Global PMS",
      "start_date": "Start Date",
      "end_date": "End Date",
      "annual_rent": "Annual Rent",
      "pro_rata_rent": "Pro-rata Rent",
      "calculate": "Calculate",
      "leave_date": "Leave Date",
      "currency": "Currency",
      "language": "Language",
      "add_property": "Add Property",
      "register_tenant": "Register Tenant",
      "expenses": "Expenses",
      "expenses_management": "Expenses Management",
      "add_expense": "Add Expense",
      "reports": "Reports",
      "income_expense_report": "Income & Expense Report",
      "paid_rent": "Paid Rent",
      "overdue_rent": "Overdue Rent",
      "upcoming_rent": "Upcoming Rent",
      "notifications": "Notifications",
      "net_revenue": "Net Revenue"
    }
  },
  ar: {
    translation: {
      "login": "تسجيل الدخول",
      "dashboard": "لوحة القيادة",
      "properties": "العقارات",
      "tenants": "المستأجرين",
      "settings": "الإعدادات",
      "welcome": "إدارة عقاراتك بكفاءة",
      "app_title": "نظام إدارة العقارات",
      "start_date": "تاريخ البدء",
      "end_date": "تاريخ الانتهاء",
      "annual_rent": "الإيجار السنوي",
      "pro_rata_rent": "الإيجار النسبي",
      "calculate": "احسب",
      "leave_date": "تاريخ المغادرة",
      "currency": "العملة",
      "language": "اللغة",
      "add_property": "إضافة عقار",
      "register_tenant": "تسجيل مستأجر",
      "expenses": "المصروفات",
      "expenses_management": "إدارة المصروفات",
      "add_expense": "إضافة مصروف",
      "reports": "التقارير",
      "income_expense_report": "تقرير الدخل والمصروفات",
      "paid_rent": "الإيجار المدفوع",
      "overdue_rent": "الإيجار المتأخر",
      "upcoming_rent": "الإيجار القادم",
      "notifications": "الإشعارات",
      "net_revenue": "صافي الإيرادات"
    }
  },
  ur: {
    translation: {
      "login": "لاگ ان",
      "dashboard": "ڈیش بورڈ",
      "properties": "جائیدادیں",
      "tenants": "کرایہ دار",
      "settings": "ترتیبات",
      "welcome": "اپنی جائیدادوں کا مؤثر طریقے سے انتظام کریں",
      "app_title": "عالمی پی ایم ایس",
      "start_date": "تاریخ آغاز",
      "end_date": "تاریخ اختتام",
      "annual_rent": "سالانہ کرایہ",
      "pro_rata_rent": "متناسب کرایہ",
      "calculate": "حساب کریں",
      "leave_date": "روانگی کی تاریخ",
      "currency": "کرنسی",
      "language": "زبان",
      "add_property": "پراپرٹی شامل کریں",
      "register_tenant": "کرایہ دار رجسٹر کریں",
      "expenses": "اخراجات",
      "expenses_management": "اخراجات کا انتظام",
      "add_expense": "خرچہ شامل کریں",
      "reports": "رپورٹس",
      "income_expense_report": "آمدنی اور اخراجات کی رپورٹ",
      "paid_rent": "ادا شدہ کرایہ",
      "overdue_rent": "واجب الادا کرایہ",
      "upcoming_rent": "آنے والا کرایہ",
      "notifications": "اطلاعات",
      "net_revenue": "خالص آمدنی"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Nav
      "login": "Log In", "dashboard": "Dashboard", "properties": "Properties",
      "tenants": "Tenants", "settings": "Settings", "expenses": "Expenses",
      "reports": "Reports", "sign_out": "Sign Out", "app_title": "PMS System",
      "welcome": "Manage your properties efficiently",

      // Auth
      "sign_in": "Sign In", "create_account": "Create Account",
      "full_name": "Full Name", "email_address": "Email Address",
      "password": "Password", "password_hint": "(min 6 characters)",
      "signing_in": "Signing in...", "creating_account": "Creating account...",
      "or_continue_with": "or continue with", "continue_with_google": "Continue with Google",
      "secured_by": "Secured by Supabase · Data encrypted in transit",
      "welcome_back": "Welcome back! Sign in to continue.",
      "create_account_subtitle": "Create an account to get started.",
      "account_created": "Account created!",
      "confirm_email_sent": "We sent a confirmation link to",
      "confirm_email_instruction": "Click it to verify your email — then sign in below.",
      "go_to_signin": "Go to Sign In",
      "your_full_name": "Your full name",
      "password_short": "Password must be at least 6 characters.",
      "incorrect_credentials": "Incorrect email or password. Did you create an account first?",
      "google_unavailable": "Google login unavailable. Use email instead.",
      "email_not_confirmed": "⚠️ Your email is not confirmed yet. Disable 'Confirm email' in Supabase Dashboard → Authentication → Providers → Email.",

      // Dashboard
      "welcome_title": "Welcome back!",
      "welcome_subtitle": "Here's your property portfolio at a glance",
      "expected_rent": "Expected Rent", "actual_rent": "Contracted Rent",
      "total_expenses": "Total Expenses", "net_revenue": "Net Revenue",
      "financial_analytics": "Financial Analytics",
      "financial_analytics_subtitle": "Track income, expenses, and portfolio performance",
      "expected_vs_actual": "Annual Expected vs Contracted Rent",
      "expected_vs_actual_sub": "Comparing expected and contracted rent by property",
      "income_vs_expenses": "Income vs Expenses",
      "income_vs_expenses_sub": "Monthly financial overview",
      "ledger_revenue": "Ledger Revenue Breakdown",
      "ledger_revenue_sub": "Paid, overdue and upcoming for current month",
      "building_utilization": "Building Utilization",
      "building_utilization_sub": "Annual potential vs contracted rent per property",
      "paid_rent": "Paid Rent", "overdue_rent": "Overdue Rent", "upcoming_rent": "Upcoming Rent",
      "no_data": "No data yet", "loading": "Loading...",
      "view_ledger": "View Ledger",
      "notifications": "Notifications", "no_notifications": "No pending notifications",
      "overdue_alert": "Overdue", "upcoming_alert": "Due in 10 days",
      "income": "Income", "expense_label": "Expense",
      "potential": "Potential", "contracted": "Contracted",
      "rent_overdue_msg": "Rent overdue since", "rent_due_msg": "Rent due on",
      "rent_comparison": "Rent Comparison", "expected_annual": "Expected (Annual)",
      "actual_contracted": "Actual (Contracted)", "income_actual_rent": "Income (Actual Rent)",
      "potential_rent_annual": "Potential Rent (Annual)", "actual_contracted_rent": "Actual Contracted Rent",

      // Properties
      "add_property": "Add Property", "edit_property": "Edit Property",
      "new_property": "New Property Details", "edit_property_details": "Edit Property Details",
      "property_name": "Property Name", "property_address": "Address",
      "annual_rent": "Annual Rent", "property_image": "Property Image (URL or upload)",
      "upload_image": "Upload Image", "save_property": "Save Property",
      "update_property": "Update Property", "no_properties": "No properties added yet.",
      "confirm_delete": "Are you sure you want to delete this?",
      "export_csv": "Export CSV", "import_csv": "Import CSV",
      "imported_msg": "imported successfully!",

      // Tenants
      "register_tenant": "Register Tenant", "new_tenant": "New Tenant Contract",
      "edit_tenant": "Edit Tenant Contract", "tenant_name": "Tenant Name",
      "select_property": "Select Property...", "start_date": "Start Date",
      "end_date": "End Date", "payment_plan": "Payment Plan",
      "monthly": "Monthly", "quarterly": "3 Month", "semi_annual": "6 Month",
      "yearly": "Yearly", "save_tenant": "Save Tenant", "update_tenant": "Update Tenant",
      "no_tenants": "No tenants registered yet.", "active": "Active", "inactive": "Inactive",
      "contract_period": "Contract Period", "payment_schedule": "Payment Schedule",
      "leave_date": "Leave Date", "end_contract": "End Contract",
      "view_payments": "View Payments", "print_contract": "Print Contract",
      "pro_rata_rent": "Pro-rata Rent", "calculate": "Calculate",
      "calendar_mode": "Calendar Mode", "gregorian": "Gregorian", "hijri": "Hijri",

      // Expenses
      "expenses_management": "Expenses Management", "add_expense": "Add Expense",
      "log_expense": "Log New Expense", "edit_expense": "Edit Expense details",
      "select_category": "Select Category...", "amount_sar": "Amount",
      "date_label": "Date", "description_optional": "Description (Optional)",
      "save_expense": "Save Expense", "update_expense": "Update Expense",
      "no_expenses": "No expenses logged yet.", "mode_cash": "Cash",
      "mode_bank": "Bank Transfer", "mode_online": "Online / Card",
      "cat_maintenance": "Maintenance", "cat_utilities": "Utilities",
      "cat_insurance": "Insurance", "cat_taxes": "Taxes",
      "cat_salary": "Staff Salary", "cat_other": "Other",
      "cancel": "Cancel",

      // TenantLedger
      "payment_ledger": "Payment Ledger", "back": "Back",
      "property_label": "Property", "tenant_label": "Tenant",
      "contract_start": "Contract Start", "contract_end": "Contract End",
      "payment_plan_label": "Plan", "total_ledger": "Total Ledger",
      "due_date": "Due Date", "amount_label": "Amount", "status_label": "Status",
      "paid": "Paid", "pending": "Pending", "mark_as_paid": "Mark as Paid",
      "payment_date": "Payment Date", "payment_mode": "Payment Mode",
      "confirm_payment": "Confirm Payment", "loading_ledger": "Loading Ledger Account...",

      // Reports
      "income_expense_report": "Income & Expense Report",
      "total_income": "Paid Rent", "total_expense": "Expenses",
      "recent_transactions": "Recent Transactions",
      "income_ledger": "Income (Ledger)", "no_transactions": "No transactions in this period.",
      "filter_by_date": "Filter by date range",

      // Settings
      "language": "Language", "currency": "Currency",
      "default_calendar": "Default Calendar Mode",
      "gregorian_calendar": "Gregorian Calendar", "hijri_calendar": "Hijri (Islamic) Calendar",
      "rtl_note": "Selecting Arabic or Urdu will automatically shift the layout to RTL (Right-to-Left).",
      "team_access": "Team Access",
      "team_access_desc": "Invite others by email. Once they sign up, they can view and manage your properties, tenants, and expenses.",
      "colleague_email": "colleague@example.com",
      "send_invite": "Send Invite", "revoke_access": "Revoke access",
      "invite_accepted": "Accepted", "invite_pending": "Pending sign-up", "invite_revoked": "Revoked",
      "invite_tip": "💡 Invites are accepted automatically when the person signs up with the same email address.",
    }
  },
  ar: {
    translation: {
      // Nav
      "login": "تسجيل الدخول", "dashboard": "لوحة القيادة", "properties": "العقارات",
      "tenants": "المستأجرين", "settings": "الإعدادات", "expenses": "المصروفات",
      "reports": "التقارير", "sign_out": "تسجيل الخروج", "app_title": "نظام إدارة العقارات",
      "welcome": "إدارة عقاراتك بكفاءة",

      // Auth
      "sign_in": "تسجيل الدخول", "create_account": "إنشاء حساب",
      "full_name": "الاسم الكامل", "email_address": "البريد الإلكتروني",
      "password": "كلمة المرور", "password_hint": "(٦ أحرف على الأقل)",
      "signing_in": "جاري تسجيل الدخول...", "creating_account": "جاري إنشاء الحساب...",
      "or_continue_with": "أو تابع عبر", "continue_with_google": "تابع مع Google",
      "secured_by": "مؤمّن بواسطة Supabase · البيانات مشفّرة أثناء النقل",
      "welcome_back": "مرحباً بعودتك! سجّل دخولك للمتابعة.",
      "create_account_subtitle": "أنشئ حساباً للبدء.",
      "account_created": "تم إنشاء الحساب!",
      "confirm_email_sent": "أرسلنا رابط تأكيد إلى",
      "confirm_email_instruction": "انقر عليه لتأكيد بريدك الإلكتروني، ثم سجّل الدخول.",
      "go_to_signin": "الانتقال إلى تسجيل الدخول",
      "your_full_name": "اسمك الكامل",
      "password_short": "يجب أن تتكون كلمة المرور من ٦ أحرف على الأقل.",
      "incorrect_credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة. هل أنشأت حساباً؟",
      "google_unavailable": "تسجيل الدخول عبر Google غير متاح. استخدم البريد الإلكتروني.",
      "email_not_confirmed": "⚠️ لم يتم تأكيد بريدك الإلكتروني بعد.",

      // Dashboard
      "welcome_title": "مرحباً بك!",
      "welcome_subtitle": "إليك نظرة عامة على محفظة عقاراتك",
      "expected_rent": "الإيجار المتوقع", "actual_rent": "الإيجار المتعاقد",
      "total_expenses": "إجمالي المصروفات", "net_revenue": "صافي الإيرادات",
      "financial_analytics": "التحليل المالي",
      "financial_analytics_subtitle": "تتبع الدخل والمصروفات وأداء المحفظة",
      "expected_vs_actual": "الإيجار المتوقع مقابل المتعاقد سنوياً",
      "expected_vs_actual_sub": "مقارنة الإيجار المتوقع والمتعاقد لكل عقار",
      "income_vs_expenses": "الدخل مقابل المصروفات",
      "income_vs_expenses_sub": "النظرة المالية الشهرية",
      "ledger_revenue": "تفاصيل إيرادات الدفتر",
      "ledger_revenue_sub": "المدفوع والمتأخر والقادم للشهر الحالي",
      "building_utilization": "استخدام المباني",
      "building_utilization_sub": "الإمكانية السنوية مقابل الإيجار المتعاقد لكل عقار",
      "paid_rent": "الإيجار المدفوع", "overdue_rent": "الإيجار المتأخر", "upcoming_rent": "الإيجار القادم",
      "no_data": "لا توجد بيانات بعد", "loading": "جاري التحميل...",
      "view_ledger": "عرض الدفتر",
      "notifications": "الإشعارات", "no_notifications": "لا توجد إشعارات معلقة",
      "overdue_alert": "متأخر", "upcoming_alert": "مستحق خلال ١٠ أيام",
      "income": "الدخل", "expense_label": "المصروفات",
      "potential": "الإمكانية", "contracted": "المتعاقد",
      "rent_overdue_msg": "الإيجار متأخر منذ", "rent_due_msg": "الإيجار مستحق في",
      "rent_comparison": "مقارنة الإيجار", "expected_annual": "المتوقع (سنوياً)",
      "actual_contracted": "الفعلي (المتعاقد)", "income_actual_rent": "الدخل (الإيجار الفعلي)",
      "potential_rent_annual": "الإيجار المحتمل (سنوياً)", "actual_contracted_rent": "الإيجار الفعلي المتعاقد",

      // Properties
      "add_property": "إضافة عقار", "edit_property": "تعديل العقار",
      "new_property": "تفاصيل العقار الجديد", "edit_property_details": "تعديل تفاصيل العقار",
      "property_name": "اسم العقار", "property_address": "العنوان",
      "annual_rent": "الإيجار السنوي", "property_image": "صورة العقار (رابط أو رفع)",
      "upload_image": "رفع صورة", "save_property": "حفظ العقار",
      "update_property": "تحديث العقار", "no_properties": "لم يتم إضافة أي عقارات بعد.",
      "confirm_delete": "هل أنت متأكد أنك تريد الحذف؟",
      "export_csv": "تصدير CSV", "import_csv": "استيراد CSV",
      "imported_msg": "تم الاستيراد بنجاح!",

      // Tenants
      "register_tenant": "تسجيل مستأجر", "new_tenant": "عقد مستأجر جديد",
      "edit_tenant": "تعديل عقد المستأجر", "tenant_name": "اسم المستأجر",
      "select_property": "اختر العقار...", "start_date": "تاريخ البدء",
      "end_date": "تاريخ الانتهاء", "payment_plan": "خطة الدفع",
      "monthly": "شهري", "quarterly": "ربع سنوي", "semi_annual": "نصف سنوي",
      "yearly": "سنوي", "save_tenant": "حفظ المستأجر", "update_tenant": "تحديث المستأجر",
      "no_tenants": "لم يتم تسجيل أي مستأجرين بعد.", "active": "نشط", "inactive": "غير نشط",
      "contract_period": "فترة العقد", "payment_schedule": "جدول الدفع",
      "leave_date": "تاريخ المغادرة", "end_contract": "إنهاء العقد",
      "view_payments": "عرض المدفوعات", "print_contract": "طباعة العقد",
      "pro_rata_rent": "الإيجار النسبي", "calculate": "احسب",
      "calendar_mode": "نمط التقويم", "gregorian": "ميلادي", "hijri": "هجري",

      // Expenses
      "expenses_management": "إدارة المصروفات", "add_expense": "إضافة مصروف",
      "log_expense": "تسجيل مصروف جديد", "edit_expense": "تعديل تفاصيل المصروف",
      "select_category": "اختر الفئة...", "amount_sar": "المبلغ",
      "date_label": "التاريخ", "description_optional": "الوصف (اختياري)",
      "save_expense": "حفظ المصروف", "update_expense": "تحديث المصروف",
      "no_expenses": "لم يتم تسجيل أي مصروفات بعد.", "mode_cash": "نقدي",
      "mode_bank": "تحويل بنكي", "mode_online": "بطاقة إلكترونية",
      "cat_maintenance": "صيانة", "cat_utilities": "مرافق",
      "cat_insurance": "تأمين", "cat_taxes": "ضرائب",
      "cat_salary": "رواتب الموظفين", "cat_other": "أخرى",
      "cancel": "إلغاء",

      // TenantLedger
      "payment_ledger": "دفتر المدفوعات", "back": "رجوع",
      "property_label": "العقار", "tenant_label": "المستأجر",
      "contract_start": "بداية العقد", "contract_end": "نهاية العقد",
      "payment_plan_label": "الخطة", "total_ledger": "إجمالي الدفتر",
      "due_date": "تاريخ الاستحقاق", "amount_label": "المبلغ", "status_label": "الحالة",
      "paid": "مدفوع", "pending": "معلق", "mark_as_paid": "تحديد كمدفوع",
      "payment_date": "تاريخ الدفع", "payment_mode": "طريقة الدفع",
      "confirm_payment": "تأكيد الدفع", "loading_ledger": "جاري تحميل حساب الدفتر...",

      // Reports
      "income_expense_report": "تقرير الدخل والمصروفات",
      "total_income": "الإيجار المدفوع", "total_expense": "المصروفات",
      "recent_transactions": "المعاملات الأخيرة",
      "income_ledger": "الدخل (دفتر)", "no_transactions": "لا توجد معاملات في هذه الفترة.",
      "filter_by_date": "تصفية حسب النطاق الزمني",

      // Settings
      "language": "اللغة", "currency": "العملة",
      "default_calendar": "نمط التقويم الافتراضي",
      "gregorian_calendar": "التقويم الميلادي", "hijri_calendar": "التقويم الهجري (الإسلامي)",
      "rtl_note": "اختيار العربية أو الأردية سيحوّل التخطيط تلقائياً إلى RTL.",
      "team_access": "الوصول للفريق",
      "team_access_desc": "ادعُ الآخرين عبر البريد الإلكتروني للوصول إلى بياناتك.",
      "colleague_email": "زميل@مثال.com",
      "send_invite": "إرسال دعوة", "revoke_access": "إلغاء الوصول",
      "invite_accepted": "مقبول", "invite_pending": "في انتظار التسجيل", "invite_revoked": "ملغى",
      "invite_tip": "💡 تُقبل الدعوات تلقائياً عند تسجيل الشخص بنفس البريد الإلكتروني.",
    }
  },
  ur: {
    translation: {
      // Nav
      "login": "لاگ ان", "dashboard": "ڈیش بورڈ", "properties": "جائیدادیں",
      "tenants": "کرایہ دار", "settings": "ترتیبات", "expenses": "اخراجات",
      "reports": "رپورٹس", "sign_out": "سائن آؤٹ", "app_title": "پراپرٹی مینجمنٹ",
      "welcome": "اپنی جائیدادوں کا مؤثر طریقے سے انتظام کریں",

      // Auth
      "sign_in": "سائن ان", "create_account": "اکاؤنٹ بنائیں",
      "full_name": "پورا نام", "email_address": "ای میل پتہ",
      "password": "پاس ورڈ", "password_hint": "(کم از کم ۶ حروف)",
      "signing_in": "سائن ان ہو رہا ہے...", "creating_account": "اکاؤنٹ بنایا جا رہا ہے...",
      "or_continue_with": "یا اس کے ساتھ جاری رکھیں", "continue_with_google": "Google کے ساتھ جاری رکھیں",
      "secured_by": "Supabase کی طرف سے محفوظ · ڈیٹا منتقلی میں خفیہ",
      "welcome_back": "واپسی پر خوش آمدید! جاری رکھنے کے لیے سائن ان کریں۔",
      "create_account_subtitle": "شروعات کے لیے اکاؤنٹ بنائیں۔",
      "account_created": "اکاؤنٹ بن گیا!",
      "confirm_email_sent": "ہم نے تصدیقی لنک بھیجا",
      "confirm_email_instruction": "اسے کلک کریں اور پھر سائن ان کریں۔",
      "go_to_signin": "سائن ان پر جائیں",
      "your_full_name": "آپ کا پورا نام",
      "password_short": "پاس ورڈ کم از کم ۶ حروف کا ہونا چاہیے۔",
      "incorrect_credentials": "ای میل یا پاس ورڈ غلط ہے۔ کیا آپ نے اکاؤنٹ بنایا ہے؟",
      "google_unavailable": "Google سائن ان دستیاب نہیں۔ ای میل استعمال کریں۔",
      "email_not_confirmed": "⚠️ آپ کا ای میل ابھی تصدیق شدہ نہیں ہے۔",

      // Dashboard
      "welcome_title": "خوش آمدید!",
      "welcome_subtitle": "آپ کی جائیداد پورٹ فولیو کا خلاصہ",
      "expected_rent": "متوقع کرایہ", "actual_rent": "معاہدہ شدہ کرایہ",
      "total_expenses": "کل اخراجات", "net_revenue": "خالص آمدنی",
      "financial_analytics": "مالی تجزیہ",
      "financial_analytics_subtitle": "آمدنی، اخراجات اور پورٹ فولیو کی کارکردگی ٹریک کریں",
      "expected_vs_actual": "سالانہ متوقع بمقابلہ معاہدہ شدہ کرایہ",
      "expected_vs_actual_sub": "ہر جائیداد کے لیے متوقع اور معاہدہ شدہ کرایے کا موازنہ",
      "income_vs_expenses": "آمدنی بمقابلہ اخراجات",
      "income_vs_expenses_sub": "ماہانہ مالی جائزہ",
      "ledger_revenue": "کھاتے کی آمدنی",
      "ledger_revenue_sub": "موجودہ ماہ کے لیے ادا شدہ، واجب الادا اور آنے والا",
      "building_utilization": "عمارت کا استعمال",
      "building_utilization_sub": "سالانہ ممکنہ بمقابلہ معاہدہ شدہ کرایہ",
      "paid_rent": "ادا شدہ کرایہ", "overdue_rent": "واجب الادا کرایہ", "upcoming_rent": "آنے والا کرایہ",
      "no_data": "ابھی کوئی ڈیٹا نہیں", "loading": "لوڈ ہو رہا ہے...",
      "view_ledger": "کھاتہ دیکھیں",
      "notifications": "اطلاعات", "no_notifications": "کوئی زیر التواء اطلاع نہیں",
      "overdue_alert": "واجب الادا", "upcoming_alert": "۱۰ دنوں میں مستحق",
      "income": "آمدنی", "expense_label": "اخراجات",
      "potential": "ممکنہ", "contracted": "معاہدہ شدہ",
      "rent_overdue_msg": "کرایہ واجب الادا ہے", "rent_due_msg": "کرایہ مستحق ہے",
      "rent_comparison": "کرایے کا موازنہ", "expected_annual": "متوقع (سالانہ)",
      "actual_contracted": "اصل (معاہدہ شدہ)", "income_actual_rent": "آمدنی (اصل کرایہ)",
      "potential_rent_annual": "ممکنہ کرایہ (سالانہ)", "actual_contracted_rent": "اصل معاہدہ شدہ کرایہ",

      // Properties
      "add_property": "جائیداد شامل کریں", "edit_property": "جائیداد ترمیم کریں",
      "new_property": "نئی جائیداد کی تفصیلات", "edit_property_details": "جائیداد کی تفصیلات ترمیم کریں",
      "property_name": "جائیداد کا نام", "property_address": "پتہ",
      "annual_rent": "سالانہ کرایہ", "property_image": "جائیداد کی تصویر",
      "upload_image": "تصویر اپلوڈ کریں", "save_property": "جائیداد محفوظ کریں",
      "update_property": "جائیداد اپڈیٹ کریں", "no_properties": "ابھی کوئی جائیداد شامل نہیں۔",
      "confirm_delete": "کیا آپ واقعی حذف کرنا چاہتے ہیں؟",
      "export_csv": "CSV ایکسپورٹ", "import_csv": "CSV امپورٹ",
      "imported_msg": "کامیابی سے امپورٹ ہو گیا!",

      // Tenants
      "register_tenant": "کرایہ دار رجسٹر کریں", "new_tenant": "نیا کرایہ دار معاہدہ",
      "edit_tenant": "کرایہ دار معاہدہ ترمیم کریں", "tenant_name": "کرایہ دار کا نام",
      "select_property": "جائیداد منتخب کریں...", "start_date": "تاریخ آغاز",
      "end_date": "تاریخ اختتام", "payment_plan": "ادائیگی کا منصوبہ",
      "monthly": "ماہانہ", "quarterly": "سہ ماہی", "semi_annual": "چھ ماہی",
      "yearly": "سالانہ", "save_tenant": "کرایہ دار محفوظ کریں", "update_tenant": "کرایہ دار اپڈیٹ کریں",
      "no_tenants": "ابھی کوئی کرایہ دار رجسٹر نہیں۔", "active": "فعال", "inactive": "غیر فعال",
      "contract_period": "معاہدے کی مدت", "payment_schedule": "ادائیگی کا شیڈول",
      "leave_date": "روانگی کی تاریخ", "end_contract": "معاہدہ ختم کریں",
      "view_payments": "ادائیگیاں دیکھیں", "print_contract": "معاہدہ پرنٹ کریں",
      "pro_rata_rent": "متناسب کرایہ", "calculate": "حساب کریں",
      "calendar_mode": "تقویم موڈ", "gregorian": "عیسوی", "hijri": "ہجری",

      // Expenses
      "expenses_management": "اخراجات کا انتظام", "add_expense": "خرچہ شامل کریں",
      "log_expense": "نیا خرچہ درج کریں", "edit_expense": "خرچے کی تفصیل ترمیم کریں",
      "select_category": "زمرہ منتخب کریں...", "amount_sar": "رقم",
      "date_label": "تاریخ", "description_optional": "تفصیل (اختیاری)",
      "save_expense": "خرچہ محفوظ کریں", "update_expense": "خرچہ اپڈیٹ کریں",
      "no_expenses": "ابھی کوئی اخراجات درج نہیں۔", "mode_cash": "نقد",
      "mode_bank": "بینک ٹرانسفر", "mode_online": "آن لائن / کارڈ",
      "cat_maintenance": "دیکھ بھال", "cat_utilities": "یوٹیلیٹیز",
      "cat_insurance": "انشورنس", "cat_taxes": "ٹیکس",
      "cat_salary": "عملے کی تنخواہ", "cat_other": "دیگر",
      "cancel": "منسوخ کریں",

      // TenantLedger
      "payment_ledger": "ادائیگی کھاتہ", "back": "واپس",
      "property_label": "جائیداد", "tenant_label": "کرایہ دار",
      "contract_start": "معاہدہ آغاز", "contract_end": "معاہدہ اختتام",
      "payment_plan_label": "منصوبہ", "total_ledger": "کل کھاتہ",
      "due_date": "واجبیت کی تاریخ", "amount_label": "رقم", "status_label": "حیثیت",
      "paid": "ادا شدہ", "pending": "زیر التواء", "mark_as_paid": "ادا شدہ نشان زد کریں",
      "payment_date": "ادائیگی کی تاریخ", "payment_mode": "ادائیگی کا طریقہ",
      "confirm_payment": "ادائیگی کی تصدیق کریں", "loading_ledger": "کھاتہ لوڈ ہو رہا ہے...",

      // Reports
      "income_expense_report": "آمدنی اور اخراجات کی رپورٹ",
      "total_income": "ادا شدہ کرایہ", "total_expense": "اخراجات",
      "recent_transactions": "حالیہ لین دین",
      "income_ledger": "آمدنی (کھاتہ)", "no_transactions": "اس مدت میں کوئی لین دین نہیں۔",
      "filter_by_date": "تاریخ کی حد کے مطابق فلٹر کریں",

      // Settings
      "language": "زبان", "currency": "کرنسی",
      "default_calendar": "پیش فرض تقویم موڈ",
      "gregorian_calendar": "عیسوی تقویم", "hijri_calendar": "ہجری (اسلامی) تقویم",
      "rtl_note": "عربی یا اردو منتخب کرنے سے لے آؤٹ خودبخود RTL ہو جائے گا۔",
      "team_access": "ٹیم تک رسائی",
      "team_access_desc": "دوسروں کو ای میل کے ذریعے مدعو کریں تاکہ وہ آپ کا ڈیٹا دیکھ سکیں۔",
      "colleague_email": "ساتھی@مثال.com",
      "send_invite": "دعوت بھیجیں", "revoke_access": "رسائی منسوخ کریں",
      "invite_accepted": "قبول شدہ", "invite_pending": "رجسٹریشن کا انتظار", "invite_revoked": "منسوخ",
      "invite_tip": "💡 دعوتیں خودبخود قبول ہو جاتی ہیں جب شخص اسی ای میل سے رجسٹر کرے۔",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

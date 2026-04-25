export interface ChangeLogEntry {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
}

export const changelog: ChangeLogEntry[] = [
  {
    version: "1.0.23",
    date: "2026-04-25",
    features: [
      "feat_drilldown_reporting",
      "feat_tenant_detail_btn"
    ],
    fixes: [
      "fix_hijri_date_bounds",
      "fix_historical_card_order"
    ]
  },
  {
    version: "1.0.11",
    date: "2026-04-23",
    features: [
      "feat_admin_support_mode"
    ],
    fixes: [
      "fix_admin_data_mixing",
      "fix_historical_expenses",
      "fix_rls_security_definer"
    ]
  },
  {
    version: "1.0.6",
    date: "2026-04-23",
    features: [
      "feat_auto_versioning",
      "feat_whats_new",
      "feat_report_sync"
    ],
    fixes: [
      "fix_dashboard_filters",
      "fix_date_parsing"
    ]
  },
  {
    version: "1.0.5",
    date: "2026-03-31",
    features: [
      "feat_dark_mode",
      "feat_search_ledger",
      "feat_glass_ui",
      "feat_tenant_fields",
      "feat_transfer_tracking"
    ],
    fixes: [
      "fix_normalized_dates",
      "fix_hijri_picker",
      "fix_rtl_alignment"
    ]
  }
];

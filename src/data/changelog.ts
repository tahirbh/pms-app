export interface ChangeLogEntry {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
}

export const changelog: ChangeLogEntry[] = [
  {
    version: "1.0.42",
    date: "2026-05-17",
    features: [
      "feat_excel_export"
    ],
    fixes: [
      "fix_admin_export_isolation"
    ]
  },
  {
    version: "1.0.40",
    date: "2026-05-12",
    features: [
      "feat_code_splitting",
      "feat_parallel_fetches",
      "feat_landing_about_section"
    ],
    fixes: [
      "fix_remove_pg_driver",
      "fix_about_unused_import"
    ]
  },
  {
    version: "1.0.39",
    date: "2026-05-10",
    features: [
      "feat_tenant_column_report",
      "feat_dynamic_hijri_year"
    ],
    fixes: [
      "fix_unpaid_rent_card",
      "fix_utilization_chart_current_year"
    ]
  },
  {
    version: "1.0.35",
    date: "2026-05-04",
    features: [],
    fixes: [
      "fix_ledger_active_only"
    ]
  },
  {
    version: "1.0.34",
    date: "2026-05-03",
    features: [],
    fixes: [
      "fix_dashboard_type_errors",
      "fix_vercel_deployment_crash"
    ]
  },
  {
    version: "1.0.32",
    date: "2026-05-03",
    features: [
      "feat_actual_unpaid_label"
    ],
    fixes: [
      "fix_utilization_chart_stats"
    ]
  },
  {
    version: "1.0.31",
    date: "2026-04-26",
    features: [
      "feat_dashboard_redirect"
    ],
    fixes: []
  },
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

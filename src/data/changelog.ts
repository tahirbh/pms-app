export interface ChangeLogEntry {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
}

export const changelog: ChangeLogEntry[] = [
  {
    version: "1.0.6",
    date: "2026-04-23",
    features: [
      "Auto-versioning system on build",
      "New 'What's New' notification modal on login",
      "Enhanced report filtering with URL sync"
    ],
    fixes: [
      "Fixed expense card filtering on Dashboard",
      "Improved date parsing for mixed Hijri/Gregorian modes"
    ]
  },
  {
    version: "1.0.5",
    date: "2026-03-31",
    features: [
      "Dark theme mode toggle in settings",
      "Search filter added to Reports ledger",
      "Glassmorphism UI refinements",
      "Iqama number and Sponsor name fields for tenants",
      "Transfer to owner tracking"
    ],
    fixes: [
      "Normalized date strings to prevent Local Time discrepancies",
      "Fixed date picker parsing for Arabic numerals",
      "RTL table column alignment improvements",
      "Owner transfer logic corrections"
    ]
  }
];

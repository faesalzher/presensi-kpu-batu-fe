// src/types/statistics.ts

export enum ReportPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

export enum ReportFormat {
  EXCEL = "excel",
  PDF = "pdf",
  CSV = "csv",
}

export enum BulkReportScope {
  DEPARTMENT = "department",
  ALL_USERS = "all_users",
  SPECIFIC_USERS = "specific_users",
}

export interface StatisticsQueryParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  departmentId?: string;
  period?: ReportPeriod;
  includeInactive?: boolean;
}

export interface GenerateReportParams {
  format: ReportFormat;
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  userId?: string;
  departmentId?: string;
  title?: string;
}

export interface GenerateBulkReportParams {
  format: ReportFormat;
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  scope: BulkReportScope;
  departmentName?: string;
  userIds?: string[];
  title?: string;
  includeInactive?: boolean;
  separateSheets?: boolean; // Whether to create separate sheets for each user/department
  includeSummary?: boolean; // Whether to include summary sheet
}

export interface AttendanceRecord {
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workHours?: number;
  status: string;
  checkInLocation?: string;
  checkInNotes?: string;
  verified: boolean;
}

export interface StatisticsSummary {
  totalDays: number;
  present: number;
  absent: number;
  problem: number;
  remoteWorking: number;
  onLeave: number;
  officialTravel: number;
  totalWorkHours: number;
  averageWorkHours: number;
  totalAttendances: number;
  records: AttendanceRecord[];
}

export interface GenerateReportResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    downloadUrl: string;
  };
}

export interface GenerateBulkReportResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    downloadUrl: string;
  };
}

// ============ TUKIN TYPES ============

export enum AttendanceViolationTypeLabel {
  LATE = "Terlambat",
  NOT_CHECKED_IN = "Tidak Absen Masuk",
  NOT_CHECKED_OUT = "Tidak Absen Keluar",
  ABSENT = "Tidak Hadir",
  EARLY_DEPARTURE = "Pulang Cepat",
}

export interface TukinViolation {
  date: string; // OccurredAt
  type: string; // AttendanceViolationType
  typeLabel: string; // Indonesian label
  percent: number; // PenaltyPercent
  tukinBaseAmount: number; // TukinBaseAmount
  nominalDeduction: number; // PenaltyAmount
}

export interface TukinSummary {
  month: string;
  grade: number;
  tukinBruto: number;
  totalDeduction: number;
  tukinReceived: number;
  violations: TukinViolation[];
}

export interface TukinQueryParams {
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
}

// src/types/corrections.ts
export interface Correction {
  guid: string;
  userId: string;
  requestedBy?: string;               // GUID of user who requested the correction
  username?: string;                  // username from BE
  nip?: string;                       // NIP from BE
  role?: string;                      // role from BE
  departmentId: string;
  attendanceId: string;
  type: string;
  date?: string;                      // attendance date yyyy-MM-dd
  requestDate: Date | string;
  reason: string;                     // reasonCode
  reasonDescription?: string;         // detail description
  profileImageUrl?: string;           // user's profile image URL
  checkInTimeOld?: string | null;
  checkInTimeNew?: string | null;
  checkOutTimeOld?: string | null;
  checkOutTimeNew?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateCorrectionDto {
  attendanceId: string;
  type: string;
  date: string;
  reasonCode: string;
  reasonDescription: string;
  checkInTimeOld: string | null;
  checkInTimeNew: string | null;
  checkOutTimeOld: string | null;
  checkOutTimeNew: string | null;
}

export interface UpdateCorrectionDto {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export interface CorrectionQueryParams {
  userId?: string;
  departmentId?: string;
  attendanceId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export interface MonthlyUsage {
  month: number;
  year: number;
  total: number;
  used: number;
  remaining: number;
  corrections: {
    guid: string;
    correctionType: string;
    requestDate: Date | string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  }[];
}

export enum CorrectionType {
  BREAK_TIME_AS_WORK = "BREAK_TIME_AS_WORK",
  EARLY_DEPARTURE = "EARLY_DEPARTURE",
  LATE_ARRIVAL = "LATE_ARRIVAL",
  MISSED_CHECK_IN = "MISSED_CHECK_IN",
  MISSED_CHECK_OUT = "MISSED_CHECK_OUT",
  TECHNICAL_ISSUE_CHECK_OUT = "TECHNICAL_ISSUE_CHECK_OUT",
  TECHNICAL_ISSUE_CHECK_IN = "TECHNICAL_ISSUE_CHECK_IN",
}

export enum CorrectionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export const CORRECTION_TYPE_LABELS: Record<CorrectionType, string> = {
  [CorrectionType.BREAK_TIME_AS_WORK]:
    "Penggunaan Jam Istirahat sebagai Jam Kerja",
  [CorrectionType.EARLY_DEPARTURE]: "Izin Cepat Pulang",
  [CorrectionType.LATE_ARRIVAL]: "Izin Terlambat Datang",
  [CorrectionType.MISSED_CHECK_IN]: "Lupa Presensi Masuk",
  [CorrectionType.MISSED_CHECK_OUT]: "Lupa Presensi Pulang",
  [CorrectionType.TECHNICAL_ISSUE_CHECK_OUT]: "Gangguan Teknis Presensi Pulang",
  [CorrectionType.TECHNICAL_ISSUE_CHECK_IN]: "Gangguan Teknis Presensi Masuk",
};

export const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, string> = {
  [CorrectionStatus.PENDING]: "Menunggu Persetujuan",
  [CorrectionStatus.APPROVED]: "Disetujui",
  [CorrectionStatus.REJECTED]: "Ditolak",
};

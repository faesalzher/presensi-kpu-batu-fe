// src/types/attendance.ts
import { BulkReportScope } from "./statistics";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  provider?: string;
}

export interface Attendance {
  guid: string;
  userId: string;
  date: Date;
  checkInTime?: Date;
  checkInLocation?: GeoLocation;
  checkInPhotoId?: string;
  checkInNotes?: string;
  checkOutTime?: Date;
  checkOutLocation?: GeoLocation;
  checkOutPhotoId?: string;
  checkOutNotes?: string;
  workHours?: number;
  isForgotCheckIn: boolean;
  isForgotCheckOut: boolean;
  status: string;
  violationNotes: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  lateMinutes?: number;
}

// Shape for monitoring/report endpoint response (matches BE AttendanceReportItemResponse)
export interface AttendanceReportItemResponse {
  userId: string;
  name: string;
  nip?: string | null;
  profileImageUrl?: string | null;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
}

export interface CheckInDto {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  provider?: string;
  notes?: string;
  deviceAnalyticsJson?: string;
}

export interface CheckOutDto {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  provider?: string;
  notes?: string;
  deviceAnalyticsJson?: string;
}

export interface VerifyAttendanceDto {
  verified: boolean;
}

export interface AttendanceQueryParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  scope?: BulkReportScope;
  departmentName?: string;
  status?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  earlyDeparture: number;
  remoteWorking: number;
  onLeave: number;
  officialTravel: number;
  totalWorkHours: number;
  averageWorkHours: number;
  totalAttendances: number;
}

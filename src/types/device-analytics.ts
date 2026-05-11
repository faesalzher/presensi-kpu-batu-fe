export type BackendTrustStatus = "HIGH" | "MEDIUM" | "LOW" | "SUSPICIOUS" | string;

export type SortByField =
  | "trustScore"
  | "lastAttendance"
  | "dominantRatio"
  | "deviceCount";

export type SortDirection = "asc" | "desc";

export interface DeviceAnalyticsFilters {
  search: string;
  platform: string;
  browser: string;
  trustStatus: string;
  startDate: string;
  endDate: string;
}

export interface DeviceAnalyticsListParams extends DeviceAnalyticsFilters {
  page: number;
  pageSize: number;
  sortBy: SortByField;
  sortDirection: SortDirection;
}

export interface DeviceAnalyticsListItem {
  userId: number | string;
  userName: string;
  dominantFingerprint: string;
  dominantPlatform: string;
  dominantBrowser: string;
  totalAttendance: number;
  uniqueDeviceCount: number;
  dominantDeviceRatio: number;
  trustScore: number;
  trustStatus: BackendTrustStatus;
  lastAttendanceAt: string;
}

export interface DeviceAnalyticsListResponse {
  items: DeviceAnalyticsListItem[];
  totalCount: number;
}

export interface DeviceAnalyticsSummaryResponse {
  totalActiveDevices: number;
  usersWithMultipleDevices: number;
  suspiciousDeviceChanges: number;
  highTrustUsers: number;
}

export interface DeviceHistoryItem {
  timestamp: string;
  fingerprint: string;
  deviceType: string;
  platform: string;
  browser: string;
  mobileLike: boolean;
  trustScore: number;
}

export interface DeviceAnalyticsDetailResponse {
  userId: number | string;
  userName: string;
  trustObservations: string[];
  history: DeviceHistoryItem[];
}

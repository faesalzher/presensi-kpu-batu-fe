import axios from "axios";
import { supabase } from "../lib/supabase";
import {
  DeviceAnalyticsDetailResponse,
  DeviceAnalyticsListItem,
  DeviceAnalyticsListParams,
  DeviceAnalyticsListResponse,
  DeviceAnalyticsSummaryResponse,
  DeviceHistoryItem,
} from "../types/device-analytics";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return fallback;
};

const normalizeListItem = (raw: unknown): DeviceAnalyticsListItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const userId = item.userId ?? item.userGuid;
  const userName = String(item.userName ?? item.name ?? "").trim();
  const lastAttendanceAt = String(item.lastAttendanceAt ?? item.lastAttendance ?? "").trim();

  if (userId === undefined || !userName) return null;

  return {
    userId: userId as number | string,
    userName,
    dominantFingerprint: String(item.dominantFingerprint ?? "-"),
    dominantPlatform: String(item.dominantPlatform ?? "-"),
    dominantBrowser: String(item.dominantBrowser ?? "-"),
    totalAttendance: toNumber(item.totalAttendance),
    uniqueDeviceCount: toNumber(item.uniqueDeviceCount),
    dominantDeviceRatio: toNumber(item.dominantDeviceRatio),
    trustScore: toNumber(item.trustScore),
    trustStatus: String(item.trustStatus ?? "LOW"),
    lastAttendanceAt,
  };
};

const normalizeHistoryItem = (raw: unknown): DeviceHistoryItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const timestamp = String(item.timestamp ?? item.attendanceAt ?? item.createdAt ?? "").trim();
  if (!timestamp) return null;

  return {
    timestamp,
    fingerprint: String(item.fingerprint ?? item.deviceFingerprint ?? "-"),
    deviceType: String(item.deviceType ?? "-"),
    platform: String(item.platform ?? "-"),
    browser: String(item.browser ?? "-"),
    mobileLike: Boolean(item.mobileLike ?? item.isMobileLike ?? false),
    trustScore: toNumber(item.trustScore),
  };
};

const buildFilterParams = (params: DeviceAnalyticsListParams) => {
  const query: Record<string, string | number> = {
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  };

  if (params.search.trim()) query.search = params.search.trim();
  if (params.platform) query.platform = params.platform;
  if (params.browser) query.browser = params.browser;
  if (params.trustStatus) query.trustStatus = params.trustStatus;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;

  return query;
};

const DeviceAnalyticsService = {
  getList: async (params: DeviceAnalyticsListParams): Promise<DeviceAnalyticsListResponse> => {
    const response = await API.get<unknown>("/admin/device-analytics", {
      params: buildFilterParams(params),
    });

    const data = response.data;

    if (Array.isArray(data)) {
      const items = data
        .map((row) => normalizeListItem(row))
        .filter((row): row is DeviceAnalyticsListItem => row !== null);
      return {
        items,
        totalCount: items.length,
      };
    }

    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const itemsRaw =
        (Array.isArray(obj.items) && obj.items) ||
        (Array.isArray(obj.data) && obj.data) ||
        (Array.isArray(obj.rows) && obj.rows) ||
        [];

      const items = itemsRaw
        .map((row) => normalizeListItem(row))
        .filter((row): row is DeviceAnalyticsListItem => row !== null);

      const totalCount = toNumber(
        obj.totalCount ?? obj.total ?? obj.count ?? obj.totalItems,
        items.length
      );

      return {
        items,
        totalCount,
      };
    }

    return { items: [], totalCount: 0 };
  },

  getSummary: async (filters: Pick<DeviceAnalyticsListParams, "search" | "platform" | "browser" | "trustStatus" | "startDate" | "endDate">): Promise<DeviceAnalyticsSummaryResponse> => {
    const params: Record<string, string> = {};

    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.platform) params.platform = filters.platform;
    if (filters.browser) params.browser = filters.browser;
    if (filters.trustStatus) params.trustStatus = filters.trustStatus;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await API.get<unknown>("/admin/device-analytics/summary", { params });
    const raw = (response.data ?? {}) as Record<string, unknown>;

    return {
      totalActiveDevices: toNumber(raw.totalActiveDevices),
      usersWithMultipleDevices: toNumber(raw.usersWithMultipleDevices),
      suspiciousDeviceChanges: toNumber(raw.suspiciousDeviceChanges),
      highTrustUsers: toNumber(raw.highTrustUsers),
    };
  },

  getDetail: async (userId: string | number): Promise<DeviceAnalyticsDetailResponse> => {
    const response = await API.get<unknown>(`/admin/device-analytics/${userId}`);
    const raw = (response.data ?? {}) as Record<string, unknown>;

    const historyRaw =
      (Array.isArray(raw.history) && raw.history) ||
      (Array.isArray(raw.deviceHistory) && raw.deviceHistory) ||
      (Array.isArray(raw.events) && raw.events) ||
      [];

    const history = historyRaw
      .map((row) => normalizeHistoryItem(row))
      .filter((row): row is DeviceHistoryItem => row !== null);

    const observationsRaw =
      (Array.isArray(raw.trustObservations) && raw.trustObservations) ||
      (Array.isArray(raw.observations) && raw.observations) ||
      [];

    const trustObservations = observationsRaw
      .map((item) => String(item).trim())
      .filter((item) => Boolean(item));

    return {
      userId: (raw.userId ?? userId) as string | number,
      userName: String(raw.userName ?? raw.name ?? "Unknown User"),
      trustObservations,
      history,
    };
  },
};

export default DeviceAnalyticsService;

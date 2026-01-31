// src/services/StatisticsService.ts
import axios from "axios";
import {
  StatisticsQueryParams,
  StatisticsSummary,
  GenerateReportParams,
  GenerateReportResponse,
  GenerateBulkReportParams,
  GenerateBulkReportResponse,
  TukinSummary,
  TukinQueryParams,
} from "../types/statistics";
import AuthService from "./AuthService";
import { supabase } from "../lib/supabase";

// Get the base URL from environment variables
const BASE_URL = import.meta.env.VITE_API_URL;

// Create a configured axios instance
const API = axios.create({
  baseURL: BASE_URL,
});

// Set up request interceptor to include auth token
API.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Set up response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data } = await supabase.auth.getSession();

      // Kalau session sudah benar-benar habis
      if (!data.session) {
        AuthService.logoutV2();
      }
    }

    return Promise.reject(error);
  }
);

class StatisticsService {
  /**
   * Get statistics data based on query parameters
   * @param params Query parameters for filtering statistics
   * @returns Promise with statistics data
   */
  async getStatistics(
    params: StatisticsQueryParams
  ): Promise<StatisticsSummary> {
    try {
      const response = await API.get("/statistics", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user's statistics data based on query parameters
   * @param params Query parameters for filtering statistics
   * @returns Promise with statistics data
   */
  async getMyStatistics(
    params: StatisticsQueryParams
  ): Promise<StatisticsSummary> {
    try {
      // if(isDemoMode) return dummyStatisticsSummary
      const response = await API.get("/statistic/my-statistic", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a report (Admin/Kajur only)
   * @param data Parameters for generating the report
   * @returns Promise with report generation result
   */
  async generateReport(
    data: GenerateReportParams
  ): Promise<GenerateReportResponse> {
    try {
      const response = await API.post("/statistic/generate-report", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a report for the current user
   * @param data Parameters for generating the report
   * @returns Promise with report generation result
   */
  async generateMyReport(
    data: GenerateReportParams
  ): Promise<GenerateReportResponse> {
    try {
      const response = await API.post("/statistic/generate-my-report", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a bulk report (Admin/Kajur only)
   * @param data Parameters for generating the bulk report
   * @returns Promise with bulk report generation result
   */
  async generateBulkReport(
    data: GenerateBulkReportParams
  ): Promise<GenerateBulkReportResponse> {
    try {
      const response = await API.post("/statistic/generate-bulk-report", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get download URL for a report
   * @param fileName Name of the file to download
   * @returns Full URL for downloading the report
   */
  getDownloadUrl(fileName: string): string {
    return `${BASE_URL}/statistic/download/${fileName}`;
  }

  /**
   * Download a report file directly
   * @param downloadUrl Relative URL path to the report file
   */
  async downloadReport(downloadUrl: string): Promise<void> {
    const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const normalizedUrl = (() => {
      if (!downloadUrl) return "";
      if (downloadUrl.startsWith("http")) return downloadUrl;
      if (!baseUrl) return downloadUrl;
      const path = downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;
      return `${baseUrl}${path}`;
    })();

    if (!normalizedUrl) return;

    // If the URL is not same-origin as the API base, avoid XHR download (CORS/token issues)
    // and just open it.
    try {
      const apiOrigin = baseUrl ? new URL(baseUrl).origin : null;
      const urlOrigin = new URL(normalizedUrl).origin;
      if (apiOrigin && urlOrigin !== apiOrigin) {
        window.open(normalizedUrl, "_blank");
        return;
      }
    } catch {
      // If URL parsing fails, fall back to open.
      window.open(normalizedUrl, "_blank");
      return;
    }

    try {
      const response = await API.get(normalizedUrl, { responseType: "blob" });

      const contentDisposition =
        (response.headers?.["content-disposition"] as string | undefined) ??
        (response.headers?.["Content-Disposition"] as string | undefined);

      const fileNameFromHeader = (() => {
        if (!contentDisposition) return null;
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
          try {
            return decodeURIComponent(utf8Match[1]);
          } catch {
            return utf8Match[1];
          }
        }
        const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        return asciiMatch?.[1] ?? null;
      })();

      const fileNameFromUrl = (() => {
        try {
          const u = new URL(normalizedUrl);
          const last = u.pathname.split("/").filter(Boolean).pop();
          return last ? decodeURIComponent(last) : null;
        } catch {
          return null;
        }
      })();

      const fileName = fileNameFromHeader || fileNameFromUrl || "report";

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in a new tab (may be blocked by popup settings)
      window.open(normalizedUrl, "_blank");
      throw err;
    }
  }

  /**
   * Get TUKIN (Tunjangan Kinerja) summary data for current user
   * @param params Query parameters with startDate and endDate
   * @returns Promise with TUKIN summary including violations
   */
  async getMyTukinSummary(params: TukinQueryParams): Promise<TukinSummary> {
    try {
      const response = await API.get("/statistic/my-tukin", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new StatisticsService();

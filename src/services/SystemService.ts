// src/services/SystemService.ts
import axios from "axios";
import AuthService from "./AuthService";
import { supabase } from "../lib/supabase";
import { WorkingDayResponse } from "../types/system";

// Create API instance with base configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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



const SystemService = {
  /**
   * Get general setting by key (e.g. 'attendance_radius_m')
   */
  getGeneralSetting: async (key: string): Promise<string> => {
    const response = await API.get<string>(`/system/general-setting/${key}`);
    return response.data;
  },
 

    /**
   * Get today's attendance record for the current user
   */
  getWorkingDayToday: async (): Promise<WorkingDayResponse | null> => {
    // if (isDemoMode) return dummyAttendance;
    const response = await API.get<WorkingDayResponse>("/system/working-day/today");
    return response.data; 
  },

  // Scheduler / monitoring API
  getSchedulerLogs: async (params?: Record<string, any>): Promise<any> => {
    const response = await API.get("/system/scheduler-logs", { params });
    return response.data;
  },

  getSchedulerLogById: async (id: string | number): Promise<any> => {
    const response = await API.get(`/system/scheduler-logs/${id}`);
    return response.data;
  },

  runSchedulerJob: async (payload: { jobName: string; scheduledAt?: string | null }): Promise<any> => {
    const response = await API.post("/system/scheduler-run", payload);
    return response.data;
  },

};

export default SystemService;

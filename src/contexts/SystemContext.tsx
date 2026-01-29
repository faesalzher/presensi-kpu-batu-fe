// src/contexts/SystemContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import SystemService from "../services/SystemService";
import type { SchedulerLog, WorkingDayResponse } from "../types/system";

interface SystemContextType {
  workingDayToday: WorkingDayResponse | null;
  loading: boolean;
  error: string | null;

  fetchWorkingDayToday: () => Promise<void>;
  clearError: () => void;

  // scheduler monitoring
  schedulerLogs: SchedulerLog[] | null;
  schedulerLoading: boolean;
  fetchSchedulerLogs: (params?: any) => Promise<void>;
  runSchedulerJob: (jobName: string, scheduledAt?: string | null) => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Cache to store fetched attendance records by guid
  const [workingDayToday, setworkingDayToday] = useState<WorkingDayResponse | null>(
    null
  );
  const [schedulerLogs, setSchedulerLogs] = useState<SchedulerLog[] | null>(null);
  const [schedulerLoading, setSchedulerLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkingDayToday();
    }
  }, [isAuthenticated]);


  const fetchWorkingDayToday = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const workingDay = await SystemService.getWorkingDayToday();
      setworkingDayToday(workingDay);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch today's attendance";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!workingDayToday?.nextChangeAt) return;

    const delay =
      new Date(workingDayToday.nextChangeAt).getTime() - Date.now();

    if (delay <= 0) return;

    const timeout = setTimeout(() => {
      fetchWorkingDayToday();
    }, delay);

    return () => clearTimeout(timeout);
  }, [workingDayToday, fetchWorkingDayToday]);



  const clearError = (): void => {
    setError(null);
  };

  const fetchSchedulerLogs = useCallback(async (params?: any): Promise<void> => {
    setSchedulerLoading(true);
    try {
      const data = await SystemService.getSchedulerLogs(params);
      setSchedulerLogs(data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch scheduler logs");
    } finally {
      setSchedulerLoading(false);
    }
  }, []);

  const runSchedulerJob = useCallback(async (jobName: string, scheduledAt?: string | null) => {
    setSchedulerLoading(true);
    try {
      await SystemService.runSchedulerJob({ jobName, scheduledAt: scheduledAt || null });
      // refresh logs after manual trigger
      await fetchSchedulerLogs();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to run scheduler job");
    } finally {
      setSchedulerLoading(false);
    }
  }, [fetchSchedulerLogs]);

  const value = {
    workingDayToday,
    loading,
    error,
    fetchWorkingDayToday,
    clearError,

    // scheduler
    schedulerLogs,
    schedulerLoading,
    fetchSchedulerLogs,
    runSchedulerJob,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error("useSystem must be used within a SystemProvider");
  }
  return context;
};

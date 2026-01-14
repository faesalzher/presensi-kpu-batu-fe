// src/contexts/SystemContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import SystemService from "../services/SystemService";
import { WorkingDayResponse } from "../types/system";

interface SystemContextType {
  workingDayToday: WorkingDayResponse | null;
  loading: boolean;
  error: string | null;

  fetchWorkingDayToday: () => Promise<void>;
  clearError: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(
  undefined
);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Cache to store fetched attendance records by guid
    const [workingDayToday, setworkingDayToday] = useState<WorkingDayResponse | null>(
      null
    );
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkingDayToday();
    }
  }, [isAuthenticated]);

    const fetchWorkingDayToday = async (): Promise<void> => {
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
  };


  const clearError = (): void => {
    setError(null);
  };

  const value = {
    workingDayToday,
    loading,
    error,
    fetchWorkingDayToday,
    clearError
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error("useSystem must be used within an SystemProvider");
  }
  return context;
};

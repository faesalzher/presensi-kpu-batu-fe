import React, { createContext, useContext, useMemo, useState } from "react";
import PushService, {
  RegisterPushDevicePayload,
} from "../services/PushService";

interface PushContextType {
  loading: boolean;
  error: string | null;

  registerDevice: (payload: RegisterPushDevicePayload) => Promise<void>;
  clearError: () => void;
}

const PushContext = createContext<PushContextType | undefined>(undefined);

export const PushProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerDevice = async (
    payload: RegisterPushDevicePayload
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await PushService.registerDevice(payload);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal mendaftarkan perangkat untuk notifikasi";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = useMemo(
    () => ({
      loading,
      error,
      registerDevice,
      clearError,
    }),
    [loading, error]
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
};

export const usePush = (): PushContextType => {
  const ctx = useContext(PushContext);
  if (!ctx) {
    throw new Error("usePush must be used within a PushProvider");
  }
  return ctx;
};

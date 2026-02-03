import React, { createContext, useContext, useMemo, useState } from "react";
import PushService, {
  RegisterPushDevicePayload,
  PushRegistrationStatusResponse,
} from "../services/PushService";

interface PushContextType {
  loading: boolean;
  error: string | null;

  registerDevice: (payload: RegisterPushDevicePayload) => Promise<void>;
  getRegistrationStatus: (deviceId: string) => Promise<PushRegistrationStatusResponse>;
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

  const getRegistrationStatus = async (
    deviceId: string
  ): Promise<PushRegistrationStatusResponse> => {
    return PushService.getRegistrationStatus(deviceId);
  };

  const clearError = () => setError(null);

  const value = useMemo(
    () => ({
      loading,
      error,
      registerDevice,
      getRegistrationStatus,
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

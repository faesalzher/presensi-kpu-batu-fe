import axios from "axios";
import AuthService from "./AuthService";
import { supabase } from "../lib/supabase";

export type RegisterPushDevicePayload = {
  fcmToken: string;
  deviceId: string;
};

export type PushRegistrationStatusResponse = {
  registered: boolean;
};

export type TestPushPayload = {
  token: string;
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

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

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        AuthService.logoutV2();
      }
    }
    return Promise.reject(error);
  }
);

const PushService = {
  registerDevice: async (payload: RegisterPushDevicePayload): Promise<void> => {
    await API.post("/push/register", payload);
  },

  getRegistrationStatus: async (
    deviceId: string
  ): Promise<PushRegistrationStatusResponse> => {
    const response = await API.get<PushRegistrationStatusResponse>(
      "/push/register/status",
      { params: { deviceId } }
    );
    return response.data;
  },

  triggerTestPush: async (payload: TestPushPayload): Promise<unknown> => {
    const response = await API.post("/push/test", null, {
      params: { token: payload.token },
    });
    return response.data;
  },
};

export default PushService;

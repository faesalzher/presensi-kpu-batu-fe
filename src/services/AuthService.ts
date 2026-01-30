// src/services/AuthService.ts
import axios, { AxiosInstance } from "axios";
import { ChangePasswordDto, User } from "../types/auth";
import { dummyLoginResponse, isDemoMode } from "../mocks/demoData";
import { supabase } from "../lib/supabase";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    guid: string;
    fullName: string;
    email: string;
    role: string;
    profileImage?: string;
    department?: string;
  };
}

interface LoginResponseV2 {
  user: {
    guid: string;
    fullName: string;
    email: string;
    role: string;
    profileImage?: string;
    department?: string;
  };
}

// interface RefreshTokenResponse {
//   access_token: string;
//   refresh_token: string;
// }

// Create API instance with base configuration
const API: AxiosInstance = axios.create({
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
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        AuthService.logoutV2();
      }
    }
    return Promise.reject(err);
  }
);


// Auth service methods
export const AuthService = {
  loginV2: async (email: string, password: string): Promise<LoginResponseV2> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

 if (error) throw error;

    // 2️⃣ Ambil profile dari backend (role, department, dll)
    const guid = data.user?.id;
    if (!guid) {
      throw new Error("User ID not found from Supabase");
    }

    const responseUser = await API.get<User>(`user/${guid}`);

    // 3️⃣ Return user ke AuthContext
    return {
      user: {
        guid,
        fullName: responseUser.data.fullName,
        email: data.user?.email ?? "",
        role: responseUser.data.role,
        department: responseUser.data.department,
      },
    };
  },



  login: async (email: string, password: string): Promise<LoginResponse> => {
    if (isDemoMode) return dummyLoginResponse;

    const response = await API.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },


  logoutV2: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("keep_logged_in");
  },

  logout: () => {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    // Only redirect if we're in a browser environment
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  },


  getProfile: async () => {
    const response = await API.get("/auth/profile");
    return response.data;
  },

  changePassword: async (
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> => {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
    void currentPassword; // Supabase update-password does not require current password when using access token.

    if (!newPassword) {
      throw new Error("Password baru wajib diisi");
    }
    if (newPassword !== confirmPassword) {
      throw new Error("Konfirmasi password tidak sama");
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    void data;

    if (error) {
      throw new Error(error.message || "Gagal mengubah password");
    }

    return { message: "Password berhasil diubah" };
  },

  registerUser: async (userData: any) => {
    const response = await API.post("/auth/register", userData);
    return response.data;
  },

  // refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
  //   const response = await API.post<RefreshTokenResponse>("/auth/refresh", {
  //     refresh_token: refreshToken,
  //   });
  //   return response.data;
  // },

  isAuthenticated: (): boolean => {
    const session = supabase.auth.getSession?.();
    return !!session;
  },

  getUser: () => {
    const userString = localStorage.getItem("user");
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  },
};

export default AuthService;

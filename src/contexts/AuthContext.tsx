// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AuthService from "../services/AuthService";
import { ChangePasswordDto } from "../types/auth";
import { supabase } from "../lib/supabase";
import { SESSION_DURATION_NORMAL, STORAGE_KEYS } from "../constant/auth.constant";

export interface User {
  guid: string;
  fullName: string;
  email: string;
  role: string;
  profileImage?: string;
  department?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, keepLoggedIn: boolean) => Promise<void>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
  registerUser?: (userData: any) => Promise<void>; // Admin only
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔥 helper
  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const scheduleAutoLogout = (ms: number) => {
    clearLogoutTimer();
    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, ms);
  };

  // 🔥 restore auth saat app load
  useEffect(() => {
    let mounted = true;

    const restoreAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const keepLoggedIn = localStorage.getItem(STORAGE_KEYS.KEEP_LOGGED_IN) === "true";

        if (data.session) {
          const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;

          if (mounted) {
            setUser(parsedUser);
            setIsAuthenticated(true);

            // 🔥 aturan logout
            if (!keepLoggedIn) {
              scheduleAutoLogout(SESSION_DURATION_NORMAL); 
            }
          }
        } else {
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restoreAuth();

    return () => {
      mounted = false;
      clearLogoutTimer();
    };
  }, []);


  // 🔥 login
  const login = async (email: string, password: string, keepLoggedIn: boolean) => {
    const response = await AuthService.loginV2(email, password);

    localStorage.setItem("user", JSON.stringify(response.user));
    localStorage.setItem(STORAGE_KEYS.KEEP_LOGGED_IN, String(keepLoggedIn));

    setUser(response.user);
    setIsAuthenticated(true);

    if (!keepLoggedIn) {
      scheduleAutoLogout(SESSION_DURATION_NORMAL);
    }
  };

  // 🔥 logout (SATU PINTU)
  const logout = async () => {
    clearLogoutTimer();
    await supabase.auth.signOut();

    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.KEEP_LOGGED_IN);

    setUser(null);
    setIsAuthenticated(false);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword,
        newPassword,
        confirmPassword,
      };

      await AuthService.changePassword(changePasswordDto);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Password change failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData: any) => {
    // Only available for admin users
    if (!user || user.role !== "ADMIN") {
      setError("Unauthorized: Only admins can register new users");
      throw new Error("Unauthorized: Only admins can register new users");
    }

    setLoading(true);
    setError(null);

    try {
      await AuthService.registerUser(userData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "User registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
    registerUser: user?.role === "ADMIN" ? registerUser : undefined,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

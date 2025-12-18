// src/components/PublicRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { JSX } from "react";

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return null; // atau spinner

  // 🔥 kalau masih punya sesi → langsung ke dashboard
  if (isAuthenticated) {
    if (user?.role === "kasubag") {
      return <Navigate to="/kasubag-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;

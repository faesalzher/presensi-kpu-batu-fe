import React from "react";
import { Chip } from "@mui/material";
import { BackendTrustStatus } from "../../types/device-analytics";

interface TrustScoreBadgeProps {
  status: BackendTrustStatus;
}

const normalizeStatus = (status: BackendTrustStatus): string => {
  return String(status || "LOW").toUpperCase().trim();
};

const toLabel = (status: BackendTrustStatus): string => {
  const normalized = normalizeStatus(status);
  if (normalized === "HIGH") return "High Trust";
  if (normalized === "MEDIUM") return "Medium Trust";
  if (normalized === "LOW") return "Low Trust";
  if (normalized === "SUSPICIOUS") return "Suspicious";
  return normalized;
};

const toSx = (status: BackendTrustStatus) => {
  const normalized = normalizeStatus(status);

  if (normalized === "HIGH") {
    return {
      backgroundColor: "#dcfce7",
      color: "#166534",
      borderColor: "#22c55e",
    };
  }

  if (normalized === "MEDIUM") {
    return {
      backgroundColor: "#ffedd5",
      color: "#9a3412",
      borderColor: "#fb923c",
    };
  }

  if (normalized === "SUSPICIOUS") {
    return {
      backgroundColor: "#7f1d1d",
      color: "#fee2e2",
      borderColor: "#7f1d1d",
    };
  }

  return {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderColor: "#ef4444",
  };
};

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({ status }) => {
  return (
    <Chip
      size="small"
      label={toLabel(status)}
      variant="outlined"
      sx={{
        fontWeight: 600,
        ...toSx(status),
      }}
    />
  );
};

export default TrustScoreBadge;

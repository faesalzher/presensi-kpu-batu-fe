import React from "react";
import { Grid, Paper, Typography } from "@mui/material";
import { DeviceAnalyticsSummaryResponse } from "../../types/device-analytics";

interface AnalyticsSummaryCardsProps {
  summary: DeviceAnalyticsSummaryResponse;
  loading?: boolean;
}

const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({ summary, loading = false }) => {
  const cards = [
    {
      label: "Total Active Devices",
      value: summary.totalActiveDevices,
      gradient: "linear-gradient(120deg, #0f766e, #14b8a6)",
    },
    {
      label: "Users With Multiple Devices",
      value: summary.usersWithMultipleDevices,
      gradient: "linear-gradient(120deg, #0369a1, #0ea5e9)",
    },
    {
      label: "Suspicious Device Changes",
      value: summary.suspiciousDeviceChanges,
      gradient: "linear-gradient(120deg, #b91c1c, #ef4444)",
    },
    {
      label: "High Trust Users",
      value: summary.highTrustUsers,
      gradient: "linear-gradient(120deg, #166534, #22c55e)",
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 2,
              color: "#fff",
              minHeight: 120,
              background: card.gradient,
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              {card.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {loading ? "..." : card.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default AnalyticsSummaryCards;

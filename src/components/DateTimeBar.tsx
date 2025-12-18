// components/DateTimeBar.tsx
import { Paper, Typography } from "@mui/material";

const DateTimeBar = ({ date, time }: { date: string; time: string }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      textAlign: "center",
      borderRadius: 3,

      /* 🔥 glass base */
      background: `
        linear-gradient(
          135deg,
          rgba(231, 201, 201, 0.35),
          rgba(255,255,255,0.15)
        )
      `,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      // border: "1px solid rgba(255,255,255,0.3)",

      /* 🔥 sleret halus */
      boxShadow: `
        inset 0 1px 0 rgba(255,255,255,0.6),
        0 4px 16px rgba(0,0,0,0.15)
      `,
    }}
  >
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: "rgba(0,0,0,0.75)",
      }}
    >
      {date} — <strong>{time}</strong>
    </Typography>
  </Paper>
);

export default DateTimeBar;

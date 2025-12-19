// components/DateTimeBar.tsx
import { Paper, Typography } from "@mui/material";

const DateTimeBar = ({ date, time }: { date: string; time: string }) => (
  <Paper
    elevation={1}
    sx={{
      p: 1.5,
      textAlign: "center",
      borderRadius: 3,

      /* 🔥 glass base */
      background: `
        linear-gradient(
          135deg,
          rgba(107, 17, 17, 1),
          rgba(180, 37, 37, 1)
        )
      `,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      // border: "1px solid rgba(255,255,255,0.3)",

      /* 🔥 sleret halus */
      // boxShadow: `
      //   inset 0 1px 0 rgba(255,255,255,0.6),
      //   0 4px 16px rgba(0,0,0,0.15)  
      // `,
    }}
  >
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: "rgba(255, 255, 255, 1)",
      }}
    >
      {date} — <strong>{time}</strong>
    </Typography>
  </Paper>
);

export default DateTimeBar;

import { Grid, Paper, Typography, Box, Badge } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  color?: "primary" | "success" | "warning" | "error" | "info";
}

const QuickActions = ({ actions }: { actions: Action[] }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2}>
      {actions.map((a, i) => {
        const color = a.color ?? "primary";

        return (
          <Grid size={3} key={i}>
            <Paper
              elevation={1}
              onClick={a.onClick}
              sx={{
                p: 1.5,
                borderRadius: 4,
                cursor: "pointer",
                textAlign: "center",
                position: "relative",
                transition: "all 0.2s ease",
                bgcolor: theme.palette[color].main,
                "&:hover": {
                  boxShadow: theme.shadows[4],
                  bgcolor: theme.palette[color].dark,
                },
              }}
            >
              <Box
                sx={{
                  mb: 0.5,
                  color: "white", // 🔥 ICON PUTIH
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Badge badgeContent={a.badge} color="secondary" max={99}>
                  {a.icon}
                </Badge>
              </Box>
              {/* Label */}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: "white", // 🔥 TEXT PUTIH
                }}
              >
                {a.label}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default QuickActions;

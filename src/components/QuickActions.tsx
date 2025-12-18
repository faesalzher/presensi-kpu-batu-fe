import { Grid, Paper, Typography, Box } from "@mui/material";
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
              {/* Badge */}
              {a.badge && a.badge > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 8,
                    bgcolor: "error.main",
                    color: "white",
                    fontSize: 10,
                    minWidth: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {a.badge > 99 ? "99+" : a.badge}
                </Box>
              )}

              {/* Icon */}
              <Box
                sx={{
                  mb: 0.5,
                  color: "white", // 🔥 ICON PUTIH
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {a.icon}
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

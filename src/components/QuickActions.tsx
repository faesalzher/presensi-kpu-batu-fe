import { Box, Typography, IconButton, Grid } from "@mui/material";


interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  color?: "primary" | "success" | "warning" | "error" | "info";
}


const QuickActions = ({ actions }: { actions: Action[] }) => {

  return (
    <Grid container spacing={2}>
      {actions.map((a, i) => {
        return (
          <Grid size={3} key={i}>
            <Box textAlign="center">
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <IconButton
                  onClick={a.onClick}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 4,
                    bgcolor: "#fff",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    transform: "rotate(45deg)",
                    mb: 1,

                    "&:hover": {
                      bgcolor: "#f5f5f5",
                    },
                  }}
                >
                  <Box sx={{ transform: "rotate(-45deg)" }}>
                    {a.icon}
                  </Box>
                </IconButton>

                {a.badge && a.badge > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "error.main",
                      color: "white",
                      fontSize: 10,
                      minWidth: 10,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 0.5,
                    }}
                  >
                    {a.badge > 99 ? "99+" : a.badge}
                  </Box>
                )}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "text.primary",
                }}
              >
                {a.label}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default QuickActions;

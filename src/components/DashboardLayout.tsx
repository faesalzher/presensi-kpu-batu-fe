// components/DashboardLayout.tsx
import { Box } from "@mui/material";
import BottomNav from "./BottomNav";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      {children}
      <BottomNav />
    </Box>
  );
};

export default DashboardLayout;

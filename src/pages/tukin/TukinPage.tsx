// src/pages/correction/TukinPage.tsx
import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";

const TukinPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <Box
      sx={{
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        width: "100%",
        pb: 8,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          height: "5vh",
          p: 2,
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton color="inherit" onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, textAlign: "center", mr: 4 }}
        >
          Daftar Penerimaan Tunjangan Kinerja
        </Typography>
      </Box>

      {/* Content */}
      <Container sx={{ pt: 2, pb: 8 }}>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography color="textSecondary">
              Belum ada daftar tukin yang tersedia... 
            </Typography>
          </Box>
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default TukinPage;

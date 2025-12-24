// src/pages/correction/TukinPage.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  TableCell,
  TableRow,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Table,
  TableBody,
  TableHead,
  AccordionDetails,
  Accordion,
  AccordionSummary,
  TableContainer,
  Paper,
  Link,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { ExpandMore, Launch } from "@mui/icons-material";

// ===== MOCK DATA =====
const monthMap = {
  "Maret 2025": "2025-03",
  "Februari 2025": "2025-02",
};

const mockSummary = {
  grade: 9,
  tukinBruto: 3781000,
  totalPotongan: 283575,
  tukinDiterima: 3497425,
};

const mockPotongan = [
  {
    date: "2025-03-05",
    type: "Terlambat",
    description: "Masuk 07.45",
    percent: 2.5,
    nominal: 2.5 * 3781000
  },
  {
    date: "2025-03-12",
    type: "Pulang Cepat",
    description: "Pulang 15.30",
    percent: 2.5,
    nominal: 2.5 * 3781000,
  },
];

const TukinPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const [month, setMonth] = useState(Object.keys(monthMap)[0]);

  const handleMonthChange = (event: any) => {
    setMonth(event.target.value);
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
          Penerimaan Tunjangan Kinerja
        </Typography>
      </Box>
      <Container maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
        <FormControl fullWidth>
          <Select
            value={month}
            onChange={handleMonthChange}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              borderRadius: 2,
              ".MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              ".MuiSvgIcon-root": { color: "white" },
            }}
          >
            {Object.keys(monthMap).map((monthYear) => (
              <MenuItem key={monthYear} value={monthYear}>
                {monthYear}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Container>
      {/* Content */}
      <Container maxWidth="md">
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography fontWeight="bold" gutterBottom sx={{mb: 4}}>
              Ringkasan TUKIN – {month}
            </Typography>

            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography color="text.secondary">
                  Kelas Jabatan
                </Typography>
                <Typography fontWeight="bold">
                  Kelas {mockSummary.grade}
                </Typography>
              </Grid>

              <Grid size={6}>
                <Typography color="text.secondary">
                  TUKIN Bruto
                </Typography>
                <Typography fontWeight="bold">
                  Rp {mockSummary.tukinBruto.toLocaleString("id-ID")}
                </Typography>
              </Grid>

              <Grid size={6}>
                <Typography color="text.secondary">
                  Total Potongan
                </Typography>
                <Typography color="error.main" fontWeight="bold">
                  - Rp {mockSummary.totalPotongan.toLocaleString("id-ID")}
                </Typography>
              </Grid>

              <Grid size={6}>
                <Typography color="text.secondary">
                  TUKIN Diterima
                </Typography>
                <Typography color="success.main" fontWeight="bold">
                  Rp {mockSummary.tukinDiterima.toLocaleString("id-ID")}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* RINCIAN POTONGAN */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography fontWeight="bold" gutterBottom sx={{mb: 2}}>
              Rincian Potongan Presensi
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <TableContainer sx={{ overflowX: "auto" }} component={Paper}>
              <Table size="small" sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: "nowrap" }}> Tanggal</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Jenis</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>%</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>Nominal (Rp)</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {mockPotongan.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{row.date}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Chip label={row.type} size="small" color="warning" />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }} align="right">{row.percent}% x (50% ×  Rp {mockSummary.tukinBruto.toLocaleString("id-ID")})</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                        - Rp {row.nominal.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography fontWeight="bold">
                Total Potongan Presensi
              </Typography>
              <Typography color="error.main" fontWeight="bold">
                - Rp {200000}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mt: 2, mb: 2, borderRadius: 2 }}>
          <Accordion elevation={0}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="bold">
                Rumus & Dasar Pemotongan Tunjangan Kinerja
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                <b>Rumus Umum:</b>
              </Typography>

              <Typography variant="body2" color="text.secondary">
                TUKIN = TKH + TPK
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TKH = 50% × TUKIN (Kehadiran)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TPK = 50% × TUKIN (Prestasi Kerja)
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="body2" gutterBottom>
                <b>Pemotongan Presensi:</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Setiap pelanggaran presensi (terlambat, pulang sebelum waktu,
                lupa absen, tidak hadir) dikenakan pemotongan persentase
                dari <b>TKH (50% TUKIN)</b>.
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Contoh:
                <br />
                Terlambat 2.5% → 2.5% × (50% × TUKIN)
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="body2" gutterBottom>
                <b>Hasil Akhir:</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TUKIN Diterima = TUKIN Bruto − Total Potongan
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Sesuai Petunjuk Teknis Pelaksanaan Pemberian Tunjangan Kinerja
                Pegawai di Lingkungan Sekretariat Jenderal KPU.
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Typography
                variant="caption"
                color="text.secondary"
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                Dasar Hukum:
                <Link
                  href="https://jdih.kpu.go.id/data/data_kepkpu/2025kptsj1090.pdf?v=1766547499"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  Keputusan Sekretaris Jenderal KPU Nomor 1090 Tahun 2025
                  <Launch fontSize="inherit" />
                </Link>
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Card>
      </Container>
      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default TukinPage;

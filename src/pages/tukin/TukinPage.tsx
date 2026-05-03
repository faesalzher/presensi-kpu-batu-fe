// src/pages/tukin/TukinPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
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
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { ExpandMore, Launch } from "@mui/icons-material";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { id } from "date-fns/locale/id";
import { getNow } from "../../constant/time.constant";
import { useStatistics } from "../../contexts/StatisticsContext";
import { TukinViolation } from "../../types/statistics";

// ===== INTERFACE TYPES =====
interface MonthMapEntry {
  startDate: string;
  endDate: string;
}

const TukinPage: React.FC = () => {
  const navigate = useNavigate();
  const { tukinData, loading, error, fetchMyTukin, clearError } = useStatistics();

  // ===== MONTH MAP SETUP =====
  const now = getNow();
  const currentYear = now.getFullYear();

  // range bulan = 1 tahun ini saja
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);
  const monthsInYear = eachMonthOfInterval({ start: startDate, end: endDate });
  const monthMap: { [key: string]: MonthMapEntry } = monthsInYear.reduce(
    (acc, monthDate) => {
      const monthYear = format(monthDate, "MMMM yyyy", { locale: id });
      acc[monthYear] = {
        startDate: format(startOfMonth(monthDate), "yyyy-MM-dd"),
        endDate: format(endOfMonth(monthDate), "yyyy-MM-dd"),
      };
      return acc;
    },
    {} as { [key: string]: MonthMapEntry }
  );

  // ===== STATE MANAGEMENT =====
  const [month, setMonth] = useState<string>(
    format(getNow(), "MMMM yyyy", { locale: id })
  );

  // ===== FETCH DATA =====
  useEffect(() => {
    const dateRange = monthMap[month];
    let isMounted = true;

    if (!dateRange) {
      return;
    }
    const fetchTukin = async () => {
      if (isMounted) {
        await fetchMyTukin({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
      }
    };
    fetchTukin();

    return () => {
      isMounted = false;
    };

  }, [month, fetchMyTukin]);

  // ===== CLEAR ERROR ON UNMOUNT =====
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleBack = () => {
    navigate("/");
  };

  const handleMonthChange = (event: SelectChangeEvent) => {
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
          Simulasi Tunjangan Kinerja
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
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: "200px" }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tukinData && !loading && (
          <>
            <Card sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                  Ringkasan TUKIN – {month}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography color="text.secondary">
                      Kelas Jabatan
                    </Typography>
                    <Typography fontWeight="bold">
                      Kelas {tukinData.grade}
                    </Typography>
                  </Grid>

                  <Grid size={6}>
                    <Typography color="text.secondary">
                      TUKIN Bruto
                    </Typography>
                    <Typography fontWeight="bold">
                      Rp {tukinData.tukinBruto.toLocaleString("id-ID")}
                    </Typography>
                  </Grid>

                  <Grid size={6}>
                    <Typography color="text.secondary">
                      Total Potongan
                    </Typography>
                    <Typography color="error.main" fontWeight="bold">
                      - Rp {tukinData.totalDeduction.toLocaleString("id-ID")}
                    </Typography>
                  </Grid>

                  <Grid size={6}>
                    <Typography color="text.secondary">
                      TUKIN Diterima
                    </Typography>
                    <Typography color="success.main" fontWeight="bold">
                      Rp {tukinData.tukinReceived.toLocaleString("id-ID")}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* RINCIAN POTONGAN */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Rincian Potongan Presensi
                </Typography>

                <Divider sx={{ mb: 2 }} />

                {tukinData.violations.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                    Tidak ada pelanggaran presensi di bulan ini
                  </Typography>
                ) : (
                  <TableContainer sx={{ overflowX: "auto" }} component={Paper}>
                    <Table size="small" sx={{ minWidth: 400 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>Tanggal</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>Jenis</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>%</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>Nominal (Rp)</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {tukinData.violations.map((row: TukinViolation, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {format(new Date(row.date), "yyyy-MM-dd")}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Chip
                                label={row.typeLabel}
                                size="small"
                                color="warning"
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                              {row.percent}% x (50% × Rp {row.tukinBaseAmount.toLocaleString("id-ID")})
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                              - Rp {row.nominalDeduction.toLocaleString("id-ID")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight="bold">
                    Total Potongan Presensi
                  </Typography>
                  <Typography color="error.main" fontWeight="bold">
                    - Rp {tukinData.totalDeduction.toLocaleString("id-ID")}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {tukinData && !loading && (
          <>
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
          </>
        )}
      </Container>
      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default TukinPage;

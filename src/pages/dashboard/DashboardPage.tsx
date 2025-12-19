import React, { useEffect, useState } from "react";
import {
  Container,
  CircularProgress,
  Alert,
  Grid,
  Box,
  Typography,
} from "@mui/material";
import {
  Person,
  CalendarToday,
  Description,
  RequestQuote,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../contexts/UserContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useStatistics } from "../../contexts/StatisticsContext";
import { ReportPeriod } from "../../types/statistics";
import FileService from "../../services/FileService";
import AttendanceActions from "../../components/AttendanceActions";
import AttendanceChart from "../../components/AttendanceChart";
import DashboardHeader from "../../components/DashboardHeader";
import DashboardLayout from "../../components/DashboardLayout";
import DateTimeBar from "../../components/DateTimeBar";
import QuickActions from "../../components/QuickActions";

/* ===================================================== */

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const {
    fetchUserByGuid,
    selectedUser,
    loading: loadingUser,
    error: userError,
    clearError: clearUserError,
  } = useUsers();

  const {
    todayAttendance,
    fetchTodayAttendance,
    loading: loadingAttendance,
    error: attendanceError,
  } = useAttendance();

  const {
    statistics,
    fetchMyStatistics,
    loading: loadingStatistics,
    error: statisticsError,
    clearError: clearStatisticsError,
  } = useStatistics();

  const [now, setNow] = useState(new Date());
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!authUser?.guid) return;

    fetchUserByGuid(authUser.guid);
    fetchTodayAttendance();

    const d = new Date();
    fetchMyStatistics({
      startDate: new Date(d.getFullYear(), d.getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date(d.getFullYear(), d.getMonth(), d.getDate())
        .toISOString()
        .split("T")[0],
      period: ReportPeriod.MONTHLY,
    });
  }, [authUser?.guid]);

  useEffect(() => {
    if (!selectedUser?.profileImage) return;

    setPhotoURL(
      `${FileService.getFileViewUrl(selectedUser.profileImage)}?t=${Date.now()}`
    );
  }, [selectedUser?.profileImage]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= HELPERS ================= */

  const formatDate = (date: Date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatShortTime = (value?: Date | string) => {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasCheckedIn = !!todayAttendance?.checkInTime;
  const hasCheckedOut = !!todayAttendance?.checkOutTime;

  /* ================= DATA ================= */

  const quickActions = [
    {
      label: "Profil",
      icon: <Person />,
      onClick: () => navigate("/profile"),
    },
    {
      label: "Cuti",
      icon: <CalendarToday />,
      onClick: () => navigate("/leave-request"),
    },
    {
      label: "Histori",
      icon: <Description />,
      onClick: () => navigate("/history"),
    },
    {
      label: "Tukin",
      icon: <RequestQuote />,
      onClick: () => navigate("/daftar-tukin"),
    },
  ];

  const attendanceChartData = statistics
    ? [
      { name: "Hadir", value: statistics.present, color: "#4CAF50" },
      { name: "Cuti", value: statistics.onLeave, color: "#FFC107" },
      { name: "Remote", value: statistics.remoteWorking, color: "#FF7043" },
      { name: "DL", value: statistics.officialTravel, color: "#03A9F4" },
      { name: "Alpha", value: statistics.absent, color: "#F44336" },
    ]
    : [];

  const loading = loadingUser || loadingAttendance || loadingStatistics;
  const error = userError || attendanceError || statisticsError;

  const clearError = () => {
    clearUserError();
    clearStatisticsError();
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout>
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <DashboardHeader
        name={selectedUser?.fullName}
        role={selectedUser?.role}
        nip={selectedUser?.nip}
        photoURL={photoURL}
      />

      <Container sx={{ mt: 3, mb: 8 }}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <DateTimeBar date={formatDate(now)} time={formatTime(now)} />
          </Grid>

          <Grid size={12}>
            <AttendanceActions
              onClick={() => navigate("/presensi")}
              checkInTime={formatShortTime(todayAttendance?.checkInTime)}
              checkOutTime={formatShortTime(todayAttendance?.checkOutTime)}
              hasCheckedIn={hasCheckedIn}
              hasCheckedOut={hasCheckedOut}
            />
          </Grid>

          <Grid size={12}>
            <QuickActions actions={quickActions} />
          </Grid>

          <Grid size={12}>
            {
              loadingStatistics ? (<Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                <CircularProgress />
              </Box>) : (
                statistics ? (
                  <AttendanceChart
                    title={`Rekap Kehadiran ${now.toLocaleString("id-ID", {
                      month: "long",
                    })}`}
                    data={attendanceChartData}
                  />
                ) : (<Typography variant="body1" color="text.secondary" align="center">
                  Tidak ada data kehadiran untuk ditampilkan
                </Typography>)
              )
            }
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
};

export default DashboardPage;

import { Person, CalendarToday, Task, CheckBox } from "@mui/icons-material";
import { Box, CircularProgress, Alert, Container, Grid, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceActions from "../../components/AttendanceActions";
import AttendanceChart from "../../components/AttendanceChart";
import DashboardHeader from "../../components/DashboardHeader";
import DashboardLayout from "../../components/DashboardLayout";
import DateTimeBar from "../../components/DateTimeBar";
import QuickActions from "../../components/QuickActions";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useAuth } from "../../contexts/AuthContext";
import { useCorrections } from "../../contexts/CorrectionsContext";
import { useLeaveRequests } from "../../contexts/LeaveRequestsContext";
import { useStatistics } from "../../contexts/StatisticsContext";
import { useUsers } from "../../contexts/UserContext";
import FileService from "../../services/FileService";
import { ReportPeriod } from "../../types/statistics";
import { formatDate, formatShortTime, formatTime, getNow } from "../../constant/time.constant";

const KasubagDashboardPage: React.FC = () => {
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

  const {
    pendingRequests,
    fetchPendingRequests,
  } = useLeaveRequests();

  const {
    pendingCorrections,
    fetchPendingCorrections,
  } = useCorrections();

  const [now, setNow] = useState(getNow());
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  /* ================= EFFECT ================= */

  useEffect(() => {
    if (!authUser?.guid) return;

    fetchUserByGuid(authUser.guid);
    fetchTodayAttendance();
    fetchPendingRequests();
    fetchPendingCorrections();

    const d = getNow();
    fetchMyStatistics({
      startDate: new Date(d.getFullYear(), d.getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).toISOString().split("T")[0],
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
    const timer = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= DATA ================= */

  const quickActions = [
    {
      label: "Sekretariat",
      icon: <Person />,
      onClick: () => navigate("/sekretariat"),
    },
    {
      label: "Cuti",
      icon: <CalendarToday />,
      onClick: () => navigate("/leave-request"),
    },
    {
      label: "Koreksi",
      icon: <Task />,
      badge: pendingCorrections?.length,
      onClick: () => navigate("/persetujuan-koreksi"),
    },
    {
      label: "Approval",
      icon: <CheckBox />,
      badge: pendingRequests?.length,
      onClick: () => navigate("/persetujuan"),
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

  const loading =
    loadingUser || loadingAttendance || loadingStatistics;

  const error =
    userError || attendanceError || statisticsError;

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
              hasCheckedIn={!!todayAttendance?.checkInTime}
              hasCheckedOut={!!todayAttendance?.checkOutTime}
            />
          </Grid>

          <Grid size={12}>
            <QuickActions actions={quickActions} />
          </Grid>

          <Grid size={12}>
            {statistics ? (
              <AttendanceChart
                title={`Rekap Kehadiran ${now.toLocaleString("id-ID", {
                  month: "long",
                })}`}
                data={attendanceChartData}
              />
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
              >
                Tidak ada data kehadiran
              </Typography>
            )}
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
};
export default KasubagDashboardPage;
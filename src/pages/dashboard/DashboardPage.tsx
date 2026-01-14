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
  Description,
  RequestQuote,
  CheckBox,
  Groups,
  ExitToApp,
  AccessTime
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
import QuickActions from "../../components/QuickActions";
import { formatDate, formatShortTime, formatTime, getNow } from "../../constant/time.constant";
import { useLeaveRequests } from "../../contexts/LeaveRequestsContext";
import { useCorrections } from "../../contexts/CorrectionsContext";
import { UserRole } from "../../types/enums";
import { useSystem } from "../../contexts/SystemContext";

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

  const {
    pendingRequests,
    fetchPendingRequests,
  } = useLeaveRequests();

  const {
    workingDayToday,
    loading: systemLoading,
    error: systemError,
    fetchWorkingDayToday
  } = useSystem();

  const {
    // pendingCorrections,
    fetchPendingCorrections,
  } = useCorrections();

  const [now, setNow] = useState(getNow());
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!authUser?.guid) return;

    fetchUserByGuid(authUser.guid);
    fetchTodayAttendance();
    fetchPendingRequests();
    fetchPendingCorrections();
    fetchWorkingDayToday();

    const d = getNow();
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
    const timer = setInterval(() => setNow(getNow), 1000);
    return () => clearInterval(timer);
  }, []);


  const hasCheckedIn = !!todayAttendance?.checkInTime;
  const hasCheckedOut = !!todayAttendance?.checkOutTime;

  /* ================= DATA ================= */

  const stafQuickActions = [
    {
      label: "Profil",
      icon: <Person color="primary" />,
      onClick: () => navigate("/profile"),
    },
    {
      label: "Pengajuan Cuti",
      icon: <ExitToApp color="primary" />,
      onClick: () => navigate("/leave-request-form"),
    },
    {
      label: "Riwayat Presensi",
      icon: <Description color="primary" />,
      onClick: () => navigate("/history"),
    },
    {
      label: "Tunjangan Kinerja",
      icon: <RequestQuote color="primary" />,
      onClick: () => navigate("/daftar-tukin"),
    },
  ];


  const kasubagQuickActions = [
    {
      label: "Rekap Sekretariat",
      icon: <Groups color="primary" />,
      onClick: () => navigate("/sekretariat"),
    },
    {
      label: "Pengajuan Cuti",
      icon: <ExitToApp color="primary" />,
      onClick: () => navigate("/leave-request-form"),
    },
    {
      label: "Riwayat Presensi",
      icon: <Description color="primary" />,
      onClick: () => navigate("/history"),
    },
    {
      label: "Tunjangan Kinerja",
      icon: <RequestQuote color="primary" />,
      onClick: () => navigate("/daftar-tukin"),
    },
  ];

  const kasubagSdmQuickActions = [
    {
      label: "Rekap Sekretariat",
      icon: <Groups color="primary" />,
      onClick: () => navigate("/sekretariat"),
    },
    {
      label: "Pengajuan Cuti",
      icon: <ExitToApp color="primary" />,
      onClick: () => navigate("/leave-request-form"),
    },
    {
      label: "Riwayat Presensi",
      icon: <Description color="primary" />,
      onClick: () => navigate("/history"),
    },
    {
      label: "Tunjangan Kinerja",
      icon: <RequestQuote color="primary" />,
      onClick: () => navigate("/daftar-tukin"),
    },
    {
      label: "Revisi Kehadiran",
      icon: <CheckBox color="primary" />,
      badge: pendingRequests?.length,
      onClick: () => navigate("/persetujuan"),
    },
  ];

  const renderQuickActions = () => {
    switch (selectedUser?.role) {
      case UserRole.STAF:
        return <QuickActions actions={stafQuickActions} />;

      case UserRole.KASUBAG:
        return <QuickActions actions={kasubagQuickActions} />;

      case UserRole.STAF_SPIP:
        return <QuickActions actions={kasubagQuickActions} />;

      case UserRole.STAF_KUL:
        return <QuickActions actions={kasubagQuickActions} />;

      case UserRole.KASUBAG_SDM:
        return <QuickActions actions={kasubagSdmQuickActions} />;

      case UserRole.SEKRETARIS:
        return <QuickActions actions={kasubagSdmQuickActions} />;

      default:
        return null;
    }
  };

  const attendanceChartData = statistics
    ? [
      { name: "Hadir", value: statistics.present, color: "#4CAF50" },
      { name: "Cuti", value: statistics.onLeave, color: "#FFC107" },
      { name: "Remote", value: statistics.remoteWorking, color: "#FF7043" },
      { name: "DL", value: statistics.officialTravel, color: "#03A9F4" },
      { name: "Alpha", value: statistics.absent, color: "#F44336" },
    ]
    : [];

  const loading = loadingUser || loadingAttendance || loadingStatistics || systemLoading;
  const error = userError || attendanceError || statisticsError || systemError;

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
        nip={selectedUser?.nip}
        photoURL={photoURL}
        date={formatDate(now)}
        time={formatTime(now)}
      />

      <Box
        sx={{
          bgcolor: "#f5f5f5",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,

          mt: -3, // 🔑 NAIK KE HEADER
          pt: 3
        }}
      >
        <Container sx={{ mb: 8 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={1}
              >

                {workingDayToday?.isHoliday && (
                  <Alert severity="warning">
                    {workingDayToday.message}
                  </Alert>
                )}


                {workingDayToday && !workingDayToday.isHoliday && (
                  <>
                    <AccessTime
                      sx={{ fontSize: 16, mr: 0.5, color: "text.primary" }}
                    />
                    <Typography variant="body2" color="text.primary">
                      Jam Kerja Hari Ini: <b>{workingDayToday?.workStart} – {workingDayToday?.workEnd}</b>
                    </Typography>
                  </>
                )}
              </Box>


              <AttendanceActions
                onClick={() => navigate("/presensi")}
                checkInTime={formatShortTime(todayAttendance?.checkInTime)}
                checkOutTime={formatShortTime(todayAttendance?.checkOutTime)}
                hasCheckedIn={hasCheckedIn}
                hasCheckedOut={hasCheckedOut}
                workingDayToday={workingDayToday}
              />
            </Grid>

            <Grid size={12}>
              {renderQuickActions()}
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
      </Box>
    </DashboardLayout>
  );
};

export default DashboardPage;

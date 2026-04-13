import React, { useEffect, useState } from "react";
import {
  Container,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Person,
  Description,
  RequestQuote,
  // CheckBox,
  Groups,
  ExitToApp,
  AccessTime,
  AdminPanelSettings
  , NotificationsActive,
  CheckCircle,
  FactCheck
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../contexts/UserContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useStatistics } from "../../contexts/StatisticsContext";
import { ReportPeriod } from "../../types/statistics";
import FileService from "../../services/FileService";
import SystemService from "../../services/SystemService";
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
import { usePush } from "../../contexts/PushContext";
import { getToken } from "firebase/messaging";
import { messaging } from "../../lib/firebase";
import { useForegroundPush } from "../../hooks/useForegroundPush";

/* ===================================================== */

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const {
    registerDevice,
    getRegistrationStatus,
    loading: pushLoading,
    error: pushError,
    clearError: clearPushError,
  } = usePush();

  useForegroundPush();

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

  const { pendingCorrections, fetchPendingCorrections } = useCorrections();

  // const {
  //   // pendingCorrections,
  //   // fetchPendingCorrections,
  // } = useCorrections();

  const [now, setNow] = useState(getNow());
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isTukinMenuEnabled, setIsTukinMenuEnabled] = useState<boolean>(true);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
  const [isProcessingPush, setIsProcessingPush] = useState<boolean>(false);

  const getOrCreateDeviceId = (): string => {
    const key = "push_device_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, created);
    return created;
  };

  const getPushEnabledKey = (userGuid: string, deviceId: string) =>
    `push_enabled:${userGuid}:${deviceId}`;

  useEffect(() => {
    // Check status from backend (source of truth: fcm_tokens table) and hide button.
    // Fallback to localStorage if endpoint is not available.
    const run = async () => {
      const userGuid = authUser?.guid;
      if (!userGuid) return;

      const deviceId = getOrCreateDeviceId();
      const localKey = getPushEnabledKey(userGuid, deviceId);

      try {
        const res: any = await getRegistrationStatus(deviceId);
        const isRegistered = (res?.registered ?? res?.isRegistered) === true;
        if (isRegistered) {
          localStorage.setItem(localKey, "1");
          setIsPushEnabled(true);
          return;
        } else {
          // jika backend mengatakan belum terdaftar, pastikan flag lokal dihapus
          try {
            localStorage.removeItem(localKey);
          } catch { }
          setIsPushEnabled(false);
          return;
        }
      } catch {
        // ignore (endpoint belum ada / error jaringan). Fallback ke local.
      }

      const local = localStorage.getItem(localKey) === "1";
      setIsPushEnabled(local);
    };

    void run();
  }, [authUser?.guid, getRegistrationStatus]);

  const handleEnableNotifications = async () => {
    setPushSuccess(null);
    clearPushError();
    setIsProcessingPush(true);

    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      alert("Browser ini tidak mendukung notifikasi.");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      alert("Browser ini tidak mendukung Service Worker.");
      return;
    }

    try {
      // Jika izin belum diberikan, minta izin. Jika sudah granted, lewati.
      try {
        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            alert("Izin notifikasi ditolak. Silakan aktifkan lewat pengaturan browser.");
            return;
          }
        }
      } catch (err) {
        // Beberapa browser mungkin me-throw saat requestPermission; tangani aman.
        alert("Gagal meminta izin notifikasi. Coba lagi.");
        return;
      }

      // Daftarkan service worker, lalu tunggu sampai service worker benar-benar siap (active)
      try {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      } catch (err) {
        // Jika registrasi gagal, coba ambil ready (mungkin sudah ter-registrasi sebelumnya)
        // eslint-disable-next-line no-console
        console.warn("Service worker register failed, will await ready:", err);
      }

      const swReg = await navigator.serviceWorker.ready;

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        alert("VAPID key belum diset (VITE_FIREBASE_VAPID_KEY). ");
        return;
      }

      // Pastikan service worker aktif sebelum meminta token FCM
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        alert("Gagal mendapatkan FCM token. Coba refresh dan ulangi.");
        return;
      }

      // log sesuai request awal
      // eslint-disable-next-line no-console
      // console.log("FCM token:", token);

      const deviceId = getOrCreateDeviceId();
      await registerDevice({
        fcmToken: token,
        deviceId,
      });

      if (authUser?.guid) {
        localStorage.setItem(getPushEnabledKey(authUser.guid, deviceId), "1");
      }
      setIsPushEnabled(true);

      setPushSuccess("Notifikasi berhasil diaktifkan pada perangkat ini.");
    } finally {
      setIsProcessingPush(false);
    }
  };



  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!authUser?.guid) return;

    const fetchTukinMenuSetting = async () => {
      try {
        const raw = String(await SystemService.getGeneralSetting("IS_TUKIN_MENU_ENABLED"))
          .trim()
          .toLowerCase();
        const isOff = raw === "off" || raw === "false" || raw === "0" || raw === "no";
        const isOn = raw === "on" || raw === "true" || raw === "1" || raw === "yes";
        setIsTukinMenuEnabled(isOff ? false : isOn ? true : true);
      } catch {
        // default aman: tampilkan menu jika setting gagal dibaca
        setIsTukinMenuEnabled(true);
      }
    };

    fetchTukinMenuSetting();

    fetchUserByGuid(authUser.guid);
    fetchTodayAttendance();
    fetchPendingRequests();
    if (authUser.role === UserRole.KASUBAG_SDM) {
      fetchPendingCorrections();
    }
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
  }, [authUser?.guid, authUser?.role]);


  useEffect(() => {
    if (!selectedUser) {
      setPhotoURL(null);
      return;
    }

    const profile = selectedUser.profileImageUrl?.trim();
    if (!profile) {
      setPhotoURL(null);
      return;
    }

    // jika sudah absolute URL (mis. https://presensi-kpu-kota-batu.online/...)
    if (/^https?:\/\//i.test(profile)) {
      // encode untuk mengubah spasi/karakter menjadi %20 dll
      try {
        setPhotoURL(encodeURI(profile));
      } catch {
        setPhotoURL(profile);
      }
      return;
    }

    // jika bukan absolute -> resolve lewat FileService (internal path/id)
    const viewUrl = FileService.getFileViewUrl(profile);
    setPhotoURL(viewUrl ? `${viewUrl}?t=${Date.now()}` : null);
  }, [selectedUser?.profileImageUrl, selectedUser?.guid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(getNow), 1000);
    return () => clearInterval(timer);
  }, []);


  const hasCheckedIn = !!todayAttendance?.checkInTime || !!todayAttendance?.isForgotCheckIn;
  const hasCheckedOut = !!todayAttendance?.checkOutTime;

  /* ================= DATA ================= */
  const tukinQuickAction = {
    label: "Tunjangan Kinerja",
    icon: <RequestQuote color="primary" />,
    onClick: () => navigate("/daftar-tukin"),
  };


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
      label: "Riwayat Revisi",
      icon: <FactCheck color="primary" />,
      onClick: () => navigate("/riwayat-revisi"),
    },
    ...(isTukinMenuEnabled ? [tukinQuickAction] : []),
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
      label: "Riwayat Revisi",
      icon: <FactCheck color="primary" />,
      onClick: () => navigate("/riwayat-revisi"),
    },
    ...(isTukinMenuEnabled ? [tukinQuickAction] : []),
  ];

  const stafSdmQuickActions = [
    {
      label: "Rekap Sekretariat",
      icon: <Groups color="primary" />,
      onClick: () => navigate("/sekretariat"),
    },
    //buat menu persetujuan disini
    {
      label: "Persetujuan Cuti",
      icon: <CheckCircle color="primary" />,
      badge: pendingRequests?.length,
      onClick: () => navigate("/persetujuan"),
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
      label: "Riwayat Revisi",
      icon: <FactCheck color="primary" />,
      onClick: () => navigate("/riwayat-revisi"),
    },
    ...(isTukinMenuEnabled ? [tukinQuickAction] : []),
  ];

  const kasubagSdmQuickActions = [
    ...stafSdmQuickActions,
    {
      label: "Persetujuan Revisi",
      icon: <CheckCircle color="primary" />,
      badge: pendingCorrections?.length,
      onClick: () => navigate("/persetujuan-koreksi"),
    },
  ];

  const adminQuickActions = [
    {
      label: "Monitoring Scheduler",
      icon: <AdminPanelSettings color="primary" />,
      onClick: () => navigate("/admin/scheduler"),
    },
  ];

  const renderQuickActions = () => {
    switch (selectedUser?.role) {
      case UserRole.ADMIN:
        return <QuickActions actions={adminQuickActions} />;

      case UserRole.STAF:
        return <QuickActions actions={stafQuickActions} />;

      case UserRole.KASUBAG:
        return <QuickActions actions={kasubagQuickActions} />;

      case UserRole.STAF_SDM:
        return <QuickActions actions={stafSdmQuickActions} />;

      case UserRole.KASUBAG_SDM:
        return <QuickActions actions={kasubagSdmQuickActions} />;

      case UserRole.SEKRETARIS:
        return <QuickActions actions={stafSdmQuickActions} />;

      default:
        return null;
    }
  };

  const theme = useTheme();
  const attendanceChartData = statistics
    ? [
      {
        name: "Hadir",
        value: statistics.present,
        color: theme.palette.success.main,
      },
      {
        name: "Cuti",
        value: statistics.onLeave,
        color: theme.palette.info.main,
      },
      {
        name: "Sakit",
        value: statistics.sick || 0,
        color: theme.palette.info.main,
      },
      {
        name: "DL",
        value: statistics.officialTravel,
        color: theme.palette.info.main,
      },
      {
        name: "Revisi",
        value: statistics.revision || 0,
        color: theme.palette.info.main,
      },
      {
        name: "Absen",
        value: statistics.absent,
        color: theme.palette.error.main,
      },
      {
        name: "Masalah Presensi",
        value: statistics.problem,
        color: theme.palette.warning.main,
      },
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
                {(!workingDayToday?.isWorkAllowed && !workingDayToday?.isHoliday) && (
                  <Alert severity="warning">
                    {workingDayToday?.message}
                  </Alert>
                )}
              </Box>
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
              {!isPushEnabled && (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  mb={2}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleEnableNotifications}
                    disabled={pushLoading || isProcessingPush}
                    aria-label="Aktifkan Notifikasi"
                    sx={{ width: "auto", maxWidth: 420, px: 1.5, py: 0.5 }}
                  >
                    {pushLoading || isProcessingPush ? (
                      <CircularProgress size={18} />
                    ) : (
                      <><NotificationsActive color="primary" />
                        Aktifkan Notifikasi Presensi</>
                    )}
                  </Button>

                  {(pushError || pushSuccess) && (
                    <Box sx={{ mt: 1, width: "100%", maxWidth: 420 }}>
                      {pushError && (
                        <Alert severity="error" onClose={clearPushError}>
                          {pushError}
                        </Alert>
                      )}
                      {pushSuccess && (
                        <Alert severity="success" onClose={() => setPushSuccess(null)}>
                          {pushSuccess}
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              )}
              {/* Removed manual "Periksa Notifikasi" button per request */}
              {selectedUser?.role !== UserRole.ADMIN && (
                <AttendanceActions
                  onClick={() => navigate("/presensi")}
                  checkInTime={formatShortTime(todayAttendance?.checkInTime)}
                  checkOutTime={formatShortTime(todayAttendance?.checkOutTime)}
                  hasCheckedIn={hasCheckedIn}
                  hasCheckedOut={hasCheckedOut}
                  workingDayToday={workingDayToday}
                />
              )}
            </Grid>

            <Grid size={12}>
              {renderQuickActions()}
            </Grid>

            <Grid size={12}>
              {selectedUser?.role !== UserRole.ADMIN && (
                <>
                  {loadingStatistics ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                      <CircularProgress />
                    </Box>
                  ) : statistics ? (
                    <AttendanceChart
                      title={`Rekap Kehadiran ${now.toLocaleString("id-ID", {
                        month: "long",
                      })}`}
                      data={attendanceChartData}
                    />
                  ) : (
                    <Typography variant="body1" color="text.secondary" align="center">
                      Tidak ada data kehadiran untuk ditampilkan
                    </Typography>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </DashboardLayout >
  );
};

export default DashboardPage;

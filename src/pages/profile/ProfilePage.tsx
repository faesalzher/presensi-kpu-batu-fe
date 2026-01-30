// Updated ProfilePage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  Container,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../contexts/AuthContext";
import { useUsers } from "../../contexts/UserContext";
import { useStatistics } from "../../contexts/StatisticsContext";
import { ReportPeriod } from "../../types/statistics";
import FileService from "../../services/FileService";
import defaultProfileImage from "../../assets/default-pp.png";
import ReportGenerator from "../../components/ReportGenerator";
import { getNow } from "../../constant/time.constant";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const {
    fetchUserByGuid,
    selectedUser,
    loading: loadingUser,
    error: userError,
    clearError: clearUserError,
  } = useUsers();
  const {
    statistics,
    loading: loadingStatistics,
    error: statisticsError,
    fetchMyStatistics,
    clearError: clearStatisticsError,
  } = useStatistics();

  // State for profile photo
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Calculate stats based on actual statistics data
  const getStatsData = () => {
    if (!statistics) {
      return {
        totalKehadiran: "N/A",
        rataJamKerja: "N/A",
        izinLupaAbsen: 0,
        presentaseKehadiran: 0,
      };
    }

    // Count remote, dl (dinas luar), and cuti as present
    const presentDays = statistics.present || 0;
    const remoteDays = statistics.remoteWorking || 0;
    const dlDays = statistics.officialTravel || 0;
    const cutiDays = statistics.onLeave || 0;

    // Total days that count as "present" now includes remote, dl, and cuti
    const effectivePresentDays = presentDays + remoteDays + dlDays + cutiDays;

    // Total days is unchanged
    const totalDays = statistics.totalDays || 0;

    // Format the attendance fraction
    const totalAttendance = `${effectivePresentDays}/${totalDays} hari`;

    // Calculate average work hours
    const averageWorkHours = statistics.averageWorkHours
      ? `${statistics.averageWorkHours.toFixed(1)} Jam`
      : "N/A";

    // Only count "absent" as missed absences (not cuti, remote, or dl)
    const missedOrPermit = statistics.absent || 0;

    // Calculate attendance percentage with our new definition of "present"
    const attendancePercentage =
      totalDays > 0 ? Math.round((effectivePresentDays / totalDays) * 100) : 0;

    return {
      totalKehadiran: totalAttendance,
      rataJamKerja: averageWorkHours,
      izinLupaAbsen: missedOrPermit,
      presentaseKehadiran: attendancePercentage,
    };
  };

  // Load profile photo
  const loadProfilePhoto = async () => {
    try {
      if (!selectedUser?.guid) return;

      // Reset photo error if any
      setPhotoError(null);

      // First try to use the profileImage field if it exists
      if (selectedUser.profileImageUrl) {
        const cacheBust = (url: string) => {
          const hasQuery = url.includes("?");
          return `${url}${hasQuery ? "&" : "?"}t=${new Date().getTime()}`;
        };

        const canLoadImage = (url: string): Promise<boolean> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.referrerPolicy = "no-referrer";
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = cacheBust(url);
          });
        };

        const tryGetGoogleDriveId = (url: string): string | null => {
          // Examples:
          // - https://drive.google.com/file/d/<id>/view?...
          // - https://drive.google.com/open?id=<id>
          // - https://drive.google.com/uc?id=<id>&...
          const filePathMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
          if (filePathMatch?.[1]) return filePathMatch[1];

          try {
            const parsed = new URL(url);
            const idParam = parsed.searchParams.get("id");
            return idParam || null;
          } catch {
            return null;
          }
        };

        const isHttpUrl = /^https?:\/\//i.test(selectedUser.profileImageUrl);

        if (isHttpUrl) {
          const rawUrl = selectedUser.profileImageUrl.trim();
          const driveId = tryGetGoogleDriveId(rawUrl);
          const candidates = driveId
            ? [
                `https://drive.google.com/uc?export=view&id=${driveId}`,
                `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
                `https://drive.google.com/uc?export=download&id=${driveId}`,
              ]
            : [rawUrl];

          for (const candidate of candidates) {
            // Only set photoURL when it truly loads as an image.
            // This avoids showing Avatar initials when the URL returns HTML/redirects.
            // eslint-disable-next-line no-await-in-loop
            const ok = await canLoadImage(candidate);
            if (ok) {
              setPhotoURL(cacheBust(candidate));
              return;
            }
          }

          setPhotoURL(null);
          setPhotoError(
            "Link foto tidak dapat dimuat. Pastikan file Google Drive sudah public (Anyone with the link) dan berupa file gambar."
          );
          return;
        }

        const photoUrl = FileService.getFileViewUrl(selectedUser.profileImageUrl);
        // Validate that the internal file URL can load
        const ok = await canLoadImage(photoUrl);
        if (ok) {
          setPhotoURL(cacheBust(photoUrl));
        } else {
          setPhotoURL(null);
          setPhotoError("Gagal memuat foto profil dari server.");
        }
        return;
      }

      // Otherwise check if there's a profile photo available for this user
      const url = await FileService.getProfilePhotoUrl(selectedUser.guid);
      if (url) {
        // Add timestamp to prevent caching issues
        const urlWithTimestamp = `${url}?t=${new Date().getTime()}`;
        setPhotoURL(urlWithTimestamp);
      } else {
        setPhotoURL(null);
      }
    } catch (error) {
      setPhotoError("Gagal memuat foto profil");
    }
  };

  // Fetch user details and statistics when component mounts
  useEffect(() => {
    if (authUser?.guid) {
      fetchUserByGuid(authUser.guid);
    }

    // Fetch statistics for the current month
    const now = getNow();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    fetchMyStatistics({
      startDate: firstDayOfMonth.toISOString().split("T")[0],
      endDate: lastDayOfMonth.toISOString().split("T")[0],
      period: ReportPeriod.MONTHLY,
    });

    // Clear any errors when component unmounts
    return () => {
      clearUserError();
      clearStatisticsError();
    };
  }, [authUser?.guid]);

  // Load profile photo when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      loadProfilePhoto();
    }
  }, [selectedUser]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get real statistics data
  const statsData = getStatsData();

  const loading = loadingUser || loadingStatistics;
  const error = userError || statisticsError || photoError;

  const clearError = () => {
    clearUserError();
    clearStatisticsError();
    setPhotoError(null);
  };

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
    <Box
      sx={{
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        overflow: "hidden",
        width: "100%",
        pb: 8,
      }}
    >
      {/* Header */}
      <Box
        sx={{ bgcolor: "primary.main", p: 2, color: "white", textAlign: "center" }}
      >
        <Typography variant="h6" fontWeight="bold">Profile</Typography>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Avatar (read-only) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            mt: 3,
          }}
        >
          {/* Add key to force re-render when photoURL changes */}
          <Avatar
            key={photoURL || "default-image"}
            sx={{
              width: 100,
              height: 100,
              // bgcolor: "#ff6347",
              border: "4px solid white",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
            alt={selectedUser?.fullName || "User"}
            src={photoURL || defaultProfileImage}
            imgProps={{
              referrerPolicy: "no-referrer",
              // Add error handling in case image fails to load
              onError: (e) => {
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = defaultProfileImage;
                setPhotoURL(null);
              },
            }}
          />
        </Box>

        {/* Info */}
        <Paper
          elevation={1}
          sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}
        >
          <List disablePadding>
            {[
              { label: "Nama", value: selectedUser?.fullName || "N/A" },
              { label: "NIP", value: selectedUser?.nip || "N/A" },
              { label: "Email", value: selectedUser?.email || "N/A" },
              { label: "Subbagian", value: selectedUser?.department || "N/A" },
              { label: "Jabatan", value: selectedUser?.position || "N/A" },
            ].map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={item.label}
                    secondary={item.value}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{
                      variant: "body1",
                      fontWeight: "medium",
                    }}
                  />
                </ListItem>
                {index < 4 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Stats */}
        <Grid
          container
          spacing={1}
          sx={{ mb: 2, justifyContent: "center", alignItems: "center" }}
        >
          <Grid size={{ xs: 6, sm: 12 }}>
            <Card
              sx={{
                bgcolor: "success.main",
                color: "white",
                height: 120,
                width: '100%',
                pb: { xs: 0, sm: 1 }
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                  Total Kehadiran
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {statsData.totalKehadiran}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 12 }}>
            <Card
              sx={{
                bgcolor: "#FFC107",
                color: "white",
                height: 120,
                width: '100%',
                pb: { sm: 1 },
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                  Rata-rata Jam Kerja
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {statsData.rataJamKerja}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 12 }}>
            <Card
              sx={{
                bgcolor: "#F44336",
                color: "white",
                height: 120,
                width: '100%',
                pb: { sm: 1 },
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                  Tidak Hadir
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {statsData.izinLupaAbsen}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 12 }}>
            <Card
              sx={{
                bgcolor: "#00BCD4",
                color: "white",
                height: 120,
                width: '100%',
                pb: { sm: 1 },
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                  noWrap
                >
                  Persentase Kehadiran
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {statsData.presentaseKehadiran}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        Report Generator Button
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ReportGenerator />
        </Box>

        {/* <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<EditIcon />}
            onClick={() => navigate("/edit-profile")}
            sx={{
              width: "100%",
              py: 1.5,
              textTransform: "none",
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            Edit Profile
          </Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<LockIcon />}
            endIcon={<KeyboardArrowRightIcon />}
            onClick={handleChangePassword}
            sx={{
              width: "100%",
              py: 1.5,
              textTransform: "none",
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            Ganti Password
          </Button>
        </Box> */}

        {/* Logout Button */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              width: "100%",
              bgcolor: "#F44336",
              py: 1.5,
              textTransform: "none",
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            Logout
          </Button>
        </Box>
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default ProfilePage;

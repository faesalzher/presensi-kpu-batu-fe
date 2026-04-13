// src/pages/correction/PersetujuanKoreksiDetailPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  IconButton,
  Divider,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useCorrections } from "../../contexts/CorrectionsContext";
import { useUsers } from "../../contexts/UserContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import FileService from "../../services/FileService";
import {
  CORRECTION_TYPE_LABELS,
  CORRECTION_STATUS_LABELS,
  CorrectionType,
  CorrectionStatus,
} from "../../types/corrections";

const PersetujuanKoreksiDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { guid } = useParams<{ guid: string }>();
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);

  const {
    selectedCorrection,
    loading: correctionLoading,
    error: correctionError,
    fetchCorrectionById,
    reviewCorrection,
    clearSelectedCorrection,
  } = useCorrections();

  const {
    selectedUser,
    loading: userLoading,
    error: userError,
    fetchUserByGuid,
  } = useUsers();

  // Combined loading state
  const isLoading = correctionLoading || userLoading || processing;

  // Combined error state
  const fetchError = correctionError || userError;

  useEffect(() => {
    // Load data when component mounts
    if (guid) {
      loadData();
    }

    // Clear selected correction when component unmounts
    return () => {
      clearSelectedCorrection();
    };
  }, [guid]);

  // Load correction and user data
  const loadData = async () => {
    if (!guid) {
      navigate("/persetujuan-koreksi");
      return;
    }

    try {
      // First fetch the correction
      const correction = await fetchCorrectionById(guid);

      // Then fetch the associated user if requestedBy exists
      if (correction && correction.requestedBy) {
        await fetchUserByGuid(correction.requestedBy);
      }
    } catch (err: any) {
      console.error("Failed to load correction details:", err);
    }
  };

  // Get user data for the correction
  const getUserData = () => {
    if (!selectedCorrection && !selectedUser) {
      return {
        name: "Unknown",
        nip: "Unknown",
        position: "Unknown",
        role: "Unknown",
        department: "Unknown",
      };
    }

    return {
      name:
        selectedCorrection?.username || selectedUser?.fullName || "Unknown",
      nip: selectedCorrection?.nip || selectedUser?.nip || "Unknown",
      position: selectedUser?.position || "Unknown",
      role: selectedCorrection?.role || (selectedUser as any)?.role || "Unknown",
      department: selectedUser?.department || "Unknown",
    };
  };

  const handleBack = () => {
    navigate("/persetujuan-koreksi");
  };

  const handleOpenRejectDialog = () => {
    setRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
  };

  const handleOpenApproveDialog = () => {
    setApproveDialogOpen(true);
  };

  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
  };

  const handleReject = async () => {
    if (!guid) return;

    setProcessing(true);
    setError(null);
    handleCloseRejectDialog();

    try {
      await reviewCorrection(guid, {
        status: CorrectionStatus.REJECTED,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to reject correction");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!guid) return;

    setProcessing(true);
    setError(null);
    handleCloseApproveDialog();

    try {
      await reviewCorrection(guid, {
        status: CorrectionStatus.APPROVED,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to approve correction");
    } finally {
      setProcessing(false);
    }
  };

  // Format date
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd MMMM yyyy", { locale: id });
  };

  // Get the formatted correction type label
  const getCorrectionTypeLabel = (type: string): string => {
    if (type in CorrectionType) {
      return CORRECTION_TYPE_LABELS[type as CorrectionType] || type;
    }
    return type || "Tipe tidak tersedia";
  };

  // Get user info
  const userData = getUserData();

  // Get first letter for avatar
  const userInitial =
    userData.name !== "Unknown" ? userData.name.charAt(0).toUpperCase() : "U";

  const cacheBust = (url: string) => {
    const hasQuery = url.includes("?");
    return `${url}${hasQuery ? "&" : "?"}t=${Date.now()}`;
  };

  const tryGetGoogleDriveId = (url: string): string | null => {
    const filePathMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (filePathMatch?.[1]) return filePathMatch[1];
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get("id") || null;
    } catch {
      return null;
    }
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

  const loadProfilePhoto = async () => {
    try {
      const rawPhotoUrl =
        selectedCorrection?.profileImageUrl?.trim() ||
        (selectedUser as any)?.profileImageUrl?.trim() ||
        String((selectedUser as any)?.profileImage || "").trim();

      if (!rawPhotoUrl) {
        setPhotoURL(null);
        return;
      }

      const isHttpUrl = /^https?:\/\//i.test(rawPhotoUrl);
      let photoUrl: string | null = null;

      if (isHttpUrl) {
        const driveId = tryGetGoogleDriveId(rawPhotoUrl);
        if (driveId) {
          const candidates = [
            `https://drive.google.com/uc?export=view&id=${driveId}`,
            `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
            `https://drive.google.com/uc?export=download&id=${driveId}`,
          ];
          for (const candidate of candidates) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await canLoadImage(candidate);
            if (ok) {
              photoUrl = cacheBust(candidate);
              break;
            }
          }
        } else {
          const ok = await canLoadImage(rawPhotoUrl);
          if (ok) {
            photoUrl = cacheBust(rawPhotoUrl);
          }
        }
      } else {
        const internalUrl = FileService.getFileViewUrl(rawPhotoUrl);
        const ok = await canLoadImage(internalUrl);
        if (ok) {
          photoUrl = cacheBust(internalUrl);
        }
      }

      setPhotoURL(photoUrl);
    } catch (err: any) {
      console.error("Failed to load profile photo:", err);
      setPhotoURL(null);
    }
  };

  useEffect(() => {
    void loadProfilePhoto();
  }, [selectedCorrection?.profileImageUrl, selectedUser]);


  const isCheckOutCorrection = (correction: typeof selectedCorrection): boolean => {
    if (!correction) return false;
    const checkOutCodes = [
      "MISSED_CHECK_OUT",
      "TECHNICAL_ISSUE_CHECK_OUT",
    ];
    return (
      checkOutCodes.includes(correction.type) ||
      checkOutCodes.includes(correction.reason)
    );
  };

  const getOldTime = (): string => {
    if (!selectedCorrection) return "-";
    if (isCheckOutCorrection(selectedCorrection)) {
      return formatTimeOnly(selectedCorrection.checkOutTimeOld);
    }
    return formatTimeOnly(selectedCorrection.checkInTimeOld);
  };

  const getNewTime = (): string => {
    if (!selectedCorrection) return "-";
    if (isCheckOutCorrection(selectedCorrection)) {
      return formatTimeOnly(selectedCorrection.checkOutTimeNew);
    }
    return formatTimeOnly(selectedCorrection.checkInTimeNew);
  };

  const formatTimeOnly = (value?: string | Date | null): string => {
    if (!value) return "-";
    try {
      return format(new Date(value), "HH:mm");
    } catch {
      return "-";
    }
  };

  const statusCfg = selectedCorrection
    ? {
        label: CORRECTION_STATUS_LABELS[selectedCorrection.status as CorrectionStatus] ?? selectedCorrection.status,
        color:
          selectedCorrection.status === CorrectionStatus.APPROVED
            ? "success.main"
            : selectedCorrection.status === CorrectionStatus.REJECTED
            ? "error.main"
            : "warning.main",
      }
    : { label: "-", color: "text.secondary" };

  const canReviewCorrection =
    selectedCorrection?.status === CorrectionStatus.PENDING;

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", width: "100%", pb: 7 }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            disabled={isLoading}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, textAlign: "center", mr: 4 }}
          >
            Detail Persetujuan Revisi
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {(fetchError || error) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {fetchError || error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !selectedCorrection ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography>Koreksi tidak ditemukan</Typography>
          </Paper>
        ) : (
          <>
            <Paper
              elevation={1}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box sx={{ bgcolor: "#fff", p: 3, textAlign: "center" }}>
                <Avatar
                  src={photoURL || undefined}
                  sx={{
                    width: 88,
                    height: 88,
                    bgcolor: photoURL ? undefined : "#ff5722",
                    mx: "auto",
                    mb: 2,
                  }}
                  imgProps={{
                    referrerPolicy: "no-referrer",
                    onError: () => setPhotoURL(null),
                    style: {
                      objectFit: "cover",
                      objectPosition: "center 20%",
                    },
                  }}
                >
                  {!photoURL && (
                    <Typography variant="h4" sx={{ color: "#fff" }}>
                      {userInitial}
                    </Typography>
                  )}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {userData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userData.nip}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {userData.position !== "Unknown" ? userData.position : userData.role} • {userData.department}
                </Typography>
                <Chip
                  label={statusCfg.label}
                  size="small"
                  sx={{ mt: 2, fontWeight: 600, color: statusCfg.color, borderColor: statusCfg.color }}
                  variant="outlined"
                />
              </Box>

              <Divider />

              <Box sx={{ p: 3, display: "grid", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tanggal Pengajuan
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {formatDate(selectedCorrection.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Jenis Koreksi
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {getCorrectionTypeLabel(selectedCorrection.type)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tanggal Presensi
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {selectedCorrection.date ? formatDate(selectedCorrection.date) : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Waktu Presensi Lama
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {getOldTime()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Waktu Presensi Baru
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {getNewTime()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Alasan Koreksi
                  </Typography>
                  <Typography variant="body1">
                    {selectedCorrection.reasonDescription || "Tidak ada alasan yang diberikan"}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {canReviewCorrection && (
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: "#f44336",
                  "&:hover": { bgcolor: "#d32f2f" },
                  py: 1.5,
                  borderRadius: 1,
                }}
                onClick={handleOpenRejectDialog}
                disabled={isLoading}
              >
                Tolak
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: "success.main",
                  "&:hover": { bgcolor: "success.dark" },
                  py: 1.5,
                  borderRadius: 1,
                }}
                onClick={handleOpenApproveDialog}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Setuju"}
              </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog}>
        <DialogTitle sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
          Konfirmasi Penolakan
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Apakah Anda yakin ingin menolak pengajuan koreksi ini?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseRejectDialog} sx={{ color: "#757575" }}>
            Batal
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            sx={{ bgcolor: "#f44336", "&:hover": { bgcolor: "#d32f2f" } }}
          >
            Tolak
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog}>
        <DialogTitle sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
          Konfirmasi Persetujuan
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Apakah Anda yakin ingin menyetujui pengajuan koreksi ini?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseApproveDialog} sx={{ color: "#757575" }}>
            Batal
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            sx={{ bgcolor: "success.main", "&:hover": { bgcolor: "success.dark" } }}
          >
            Setuju
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default PersetujuanKoreksiDetailPage;

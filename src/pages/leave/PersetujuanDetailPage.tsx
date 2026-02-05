// src/pages/leave/PersetujuanDetailPage.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  IconButton,
  Divider,
  Grid,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useLeaveRequests } from "../../contexts/LeaveRequestsContext";
import { useUsers } from "../../contexts/UserContext";
import { useFiles } from "../../contexts/FileContext"; // Import useFiles hook
import { format } from "date-fns";
import { id } from "date-fns/locale";
import FileService from "../../services/FileService";
import defaultAvatar from "../../assets/default-pp.png";
import {
  LeaveRequestType,
  LeaveRequestStatus,
} from "../../types/leave-requests";

const PersetujuanDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { guid } = useParams<{ guid: string }>();
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<boolean>(false);

  const {
    selectedRequest,
    loading,
    error: fetchError,
    fetchLeaveRequestByGuid,
    reviewLeaveRequest,
    clearSelectedRequest,
  } = useLeaveRequests();

  const { users, selectedUser, fetchUserByGuid } = useUsers();

  // Use FileContext for file-related operations
  const { downloadFile } = useFiles();

  // Get user data for the request
  const getUserData = (userId?: string) => {
    if (!userId) return { name: "Unknown", nip: "Unknown", department: "Unknown" };

    if (selectedUser && selectedUser.guid === userId) {
      return {
        name: selectedUser.fullName || "Unknown",
        nip: selectedUser.nip || "Unknown",
        department: selectedUser.department || "Unknown",
      };
    }

    const user = users.find((u) => u.guid === userId);
    return {
      name: user?.fullName || "Unknown",
      nip: user?.nip || "Unknown",
      department: user?.department || "Unknown",
    };
  };

  useEffect(() => {
    // Fetch the leave request data when component mounts
    if (guid) {
      fetchLeaveRequestByGuid(guid);
    }

    // Clear selected request when component unmounts
    return () => {
      clearSelectedRequest();
    };
  }, [guid]);

  // Track last fetched userId to avoid repeated fetches caused by context or re-renders
  const lastFetchedUserId = useRef<string | null>(null);

  // When selectedRequest is loaded, fetch the specific user only if userId changed
  useEffect(() => {
    const userId = selectedRequest?.userId;
    if (!userId) {
      lastFetchedUserId.current = null;
      return;
    }

    if (lastFetchedUserId.current === userId) return;

    lastFetchedUserId.current = userId;
    void fetchUserByGuid(userId);
    // Intentionally omit fetchUserByGuid from deps to avoid function identity causing loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest?.userId]);

  const handleBack = () => {
    navigate("/persetujuan");
  };

  const handleReject = () => {
    // Navigate to rejection form with the request ID
    navigate(`/reject-pengajuan?id=${guid}`);
  };

  const handleApprove = async () => {
    if (!guid) return;

    setProcessing(true);
    setError(null);

    try {
      await reviewLeaveRequest(guid, {
        status: LeaveRequestStatus.APPROVED,
        comments: "Disetujui",
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };

  // Function to handle attachment download using FileContext
  const handleDownloadAttachment = async () => {
    // Prefer opening the attachment path in a new tab when available
    const attachment = selectedRequest?.attachment;
    if (!attachment) return;

    // If there's a direct path (external link or stored URL), open in new tab
    if (attachment.path && String(attachment.path).trim()) {
      setDownloadingFile(true);
      try {
        const rawUrl = String(attachment.path).trim();
        const url = /^https?:\/\//i.test(rawUrl)
          ? resolveDriveDownloadUrl(rawUrl)
          : rawUrl;
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err: any) {
        setError(err?.message || "Gagal membuka lampiran");
      } finally {
        setDownloadingFile(false);
      }
      return;
    }

    // Fallback: if there's an attachmentId stored server-side, use the authenticated download
    if (selectedRequest?.attachmentId) {
      setDownloadingFile(true);
      try {
        await downloadFile(
          selectedRequest.attachmentId,
          selectedRequest.attachment?.originalName
        );
      } catch (err: any) {
        setError(err.message || "Failed to download file");
      } finally {
        setDownloadingFile(false);
      }
    }
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

  const resolveDriveDownloadUrl = (url: string) => {
    const driveId = tryGetGoogleDriveId(url);
    if (!driveId) return url;
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
  };

  // Format dates for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd MMMM yyyy", { locale: id });
  };

  // Get leave request type label
  const getTypeLabel = (type?: LeaveRequestType) => {
    if (!type) return "Unknown";
    switch (type) {
      case LeaveRequestType.LEAVE:
        return "Cuti";
      // case LeaveRequestType.WFH:
      // return "Work From Home";
      case LeaveRequestType.DL:
        return "Dinas Luar";
      case LeaveRequestType.SICK:
        return "Sakit";
      // case LeaveRequestType.WFA:
      // return "Work From Anywhere";
      default:
        return type;
    }
  };

  // Get initial for avatar
  const getInitial = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // Get user info from the request
  const userData = getUserData(selectedRequest?.userId);

  // Profile photo handling (load from user data or FileService)
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  const cacheBust = (url: string) => {
    const hasQuery = url.includes("?");
    return `${url}${hasQuery ? "&" : "?"}t=${Date.now()}`;
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
      if (!selectedUser) return;
      setError(null);

      const rawProfileImageUrl = (selectedUser as any).profileImageUrl as
        | string
        | undefined;
      if (rawProfileImageUrl && rawProfileImageUrl.trim()) {
        const rawUrl = rawProfileImageUrl.trim();
        const isHttpUrl = /^https?:\/\//i.test(rawUrl);

        if (isHttpUrl) {
          const driveId = tryGetGoogleDriveId(rawUrl);
          const candidates = driveId
            ? [
              `https://drive.google.com/uc?export=view&id=${driveId}`,
              `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
              `https://drive.google.com/uc?export=download&id=${driveId}`,
            ]
            : [rawUrl];

          for (const candidate of candidates) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await canLoadImage(candidate);
            if (ok) {
              setPhotoURL(cacheBust(candidate));
              return;
            }
          }

          setPhotoURL(null);
          setError(
            "Link foto tidak dapat dimuat. Pastikan file Google Drive sudah public (Anyone with the link) dan berupa file gambar."
          );
          return;
        }

        const internalUrl = FileService.getFileViewUrl(rawUrl);
        const ok = await canLoadImage(internalUrl);
        if (ok) {
          setPhotoURL(cacheBust(internalUrl));
          return;
        }
      }

      if ((selectedUser as any).profileImage) {
        const raw = String((selectedUser as any).profileImage).trim();
        const isHttpUrl = /^https?:\/\//i.test(raw);

        if (isHttpUrl) {
          const driveId = tryGetGoogleDriveId(raw);
          const candidates = driveId
            ? [
              `https://drive.google.com/uc?export=view&id=${driveId}`,
              `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
              `https://drive.google.com/uc?export=download&id=${driveId}`,
            ]
            : [raw];

          for (const candidate of candidates) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await canLoadImage(candidate);
            if (ok) {
              setPhotoURL(cacheBust(candidate));
              return;
            }
          }

          setPhotoURL(null);
          setError(
            "Link foto tidak dapat dimuat. Pastikan file Google Drive sudah public (Anyone with the link) dan berupa file gambar."
          );
          return;
        }

        const photoUrl = FileService.getFileViewUrl(raw);
        const ok = await canLoadImage(photoUrl);
        setPhotoURL(ok ? cacheBust(photoUrl) : null);
        return;
      }

      const url = await FileService.getProfilePhotoUrl((selectedUser as any).guid);
      if (url) {
        const ok = await canLoadImage(url);
        setPhotoURL(ok ? cacheBust(url) : null);
      } else {
        setPhotoURL(null);
      }
    } catch (err) {
      setError("Gagal memuat foto profil");
    }
  };

  useEffect(() => {
    if (selectedUser) void loadProfilePhoto();
  }, [selectedUser]);

  // Combine loading states
  const isLoading = loading || processing || downloadingFile;

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
            {getTypeLabel(selectedRequest?.type)}
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
        ) : !selectedRequest ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography>Pengajuan tidak ditemukan</Typography>
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
              {/* Profile Section */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  bgcolor: "#fff",
                  py: 3,
                  position: "relative",
                }}
              >

                {/* Updated Avatar to use photoURL or default image */}
                <Avatar
                  key={photoURL || "default-image"}
                  src={photoURL || defaultAvatar}
                  alt={userData.name}
                  sx={{
                    width: 80,
                    height: 80,
                    border: "3px solid #ff",
                  }}

                  imgProps={{
                    referrerPolicy: "no-referrer",
                    // Add error handling in case image fails to load
                    onError: (e: any) => {
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.src = defaultAvatar;
                      setPhotoURL(null);
                    },
                    style: {
                      objectFit: "cover",
                      // Move the visible crop slightly downward so the top of the head isn't cut off
                      objectPosition: "center 20%",
                    }
                  }}
                >
                  {/* Only show initial if no image is loaded */}
                  {!photoURL && (
                    <Typography sx={{ color: "#fff", fontWeight: "bold" }}>
                      {getInitial(userData.name)}
                    </Typography>
                  )}
                </Avatar>
              </Box>

              {/* User Info */}
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  {userData.name}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {userData.nip}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, textAlign: "center" }}
                >
                  {userData.department}
                </Typography>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Date Range */}
                <Grid
                  container
                  sx={{
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Grid>
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      Mulai
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {formatDate(selectedRequest.startDate)}
                    </Typography>
                  </Grid>
                  <Grid sx={{ textAlign: "right" }}>
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      Selesai
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {formatDate(selectedRequest.endDate)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Type of leave request */}
                <Box sx={{ width: "100%", px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    Jenis Pengajuan
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {getTypeLabel(selectedRequest.type)}
                  </Typography>
                </Box>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Description */}
                <Box sx={{ width: "100%", px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    Keterangan
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.reason || "-"}
                  </Typography>
                </Box>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Status */}
                <Box sx={{ width: "100%", px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    Status
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "bold",
                      color:
                        selectedRequest.status === "APPROVED"
                          ? "success.main"
                          : selectedRequest.status === "REJECTED"
                            ? "error.main"
                            : "warning.main",
                    }}
                  >
                    {selectedRequest.status === "APPROVED"
                      ? "Disetujui"
                      : selectedRequest.status === "REJECTED"
                        ? "Ditolak"
                        : "Pengajuan"}
                  </Typography>
                </Box>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Komentar */}
                <Box sx={{ width: "100%", px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    Komentar
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.comments && String(selectedRequest.comments).trim()
                      ? selectedRequest.comments
                      : "-"}
                  </Typography>
                </Box>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Attachment - Updated to use FileContext */}
                {selectedRequest.attachment && (
                  <>
                    <Box
                      sx={{
                        width: "100%",
                        px: 2,
                        py: 1,
                        display: "flex",
                        alignItems: "center",
                        cursor: downloadingFile ? "default" : "pointer",
                      }}
                      onClick={
                        downloadingFile ? undefined : handleDownloadAttachment
                      }
                    >
                      <Avatar
                        sx={{ width: 36, height: 36, bgcolor: "primary.main", mr: 1.5 }}
                      >
                        <InsertDriveFileIcon fontSize="small" />
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "medium",
                          display: "flex",
                          alignItems: "center",
                          "&:hover": {
                            textDecoration: downloadingFile ? "none" : "underline",
                          },
                        }}
                      >
                        {downloadingFile ? (
                          <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            Downloading...
                          </>
                        ) : (
                          selectedRequest.attachment.originalName
                        )}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>

            {/* Action Buttons: show when request is pending */}
            {selectedRequest.status !== "APPROVED" && selectedRequest.status !== "REJECTED" && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 2,
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: "#f44336",
                    "&:hover": { bgcolor: "#d32f2f" },
                    py: 1.5,
                    borderRadius: 1,
                  }}
                  onClick={handleReject}
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
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Setuju"}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default PersetujuanDetailPage;

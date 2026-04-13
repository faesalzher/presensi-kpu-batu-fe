// src/pages/correction/RevisiDetailPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useUsers } from "../../contexts/UserContext";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";
import {
  Correction,
  CorrectionStatus,
  CORRECTION_TYPE_LABELS,
  CorrectionType,
  CORRECTION_STATUS_LABELS,
} from "../../types/corrections";
import CorrectionsService from "../../services/CorrectionsService";
import FileService from "../../services/FileService";

const REASON_CODE_LABELS: Record<string, string> = {
  MISSED_CHECK_IN: "Lupa Absen Masuk",
  MISSED_CHECK_OUT: "Lupa Absen Pulang",
  LATE_ARRIVAL: "Koreksi Keterlambatan",
  TECHNICAL_ISSUE_CHECK_IN: "Kendala Teknis Masuk",
  TECHNICAL_ISSUE_CHECK_OUT: "Kendala Teknis Pulang",
};

const isCheckOutCorrection = (correction?: Correction | null): boolean => {
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

const formatTimeOnly = (isoString?: string | null): string => {
  if (!isoString) return "-";
  try {
    return format(new Date(isoString), "HH:mm");
  } catch {
    return "-";
  }
};

const formatDateFull = (value?: string | Date | null): string => {
  if (!value) return "-";
  try {
    return format(new Date(value), "EEEE, dd MMMM yyyy", { locale: idLocale });
  } catch {
    return "-";
  }
};

// ─── Info row ────────────────────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}
const InfoRow: React.FC<InfoRowProps> = ({ label, children }) => (
  <>
    <Box sx={{ width: "100%", px: 2, py: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
    <Divider sx={{ width: "100%", mx: 2 }} />
  </>
);

// ─── Status chip ─────────────────────────────────────────────────────────────
const statusConfig: Record<
  CorrectionStatus,
  { label: string; color: "warning" | "success" | "error" }
> = {
  [CorrectionStatus.PENDING]: { label: "Menunggu Persetujuan", color: "warning" },
  [CorrectionStatus.APPROVED]: { label: "Disetujui", color: "success" },
  [CorrectionStatus.REJECTED]: { label: "Ditolak", color: "error" },
};

// ─── Main page ────────────────────────────────────────────────────────────────
const RevisiDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { guid } = useParams<{ guid: string }>();

  const { selectedUser, fetchUserByGuid } = useUsers();
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

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

  const getImageUrl = (rawUrl: string) => {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) {
      const driveId = tryGetGoogleDriveId(trimmed);
      return driveId
        ? `https://drive.google.com/uc?export=view&id=${driveId}`
        : trimmed;
    }
    return FileService.getFileViewUrl(trimmed);
  };

  const shouldLoadUser = (userId?: string) => {
    return !!userId && selectedUser?.guid !== userId;
  };

  useEffect(() => {
    if (!guid) return;
    setLoading(true);
    CorrectionsService.getCorrectionById(guid)
      .then((data) => setCorrection(data))
      .catch(() => setError("Gagal memuat detail revisi."))
      .finally(() => setLoading(false));
  }, [guid]);

  useEffect(() => {
    if (!correction?.userId) return;
    if (shouldLoadUser(correction.userId)) {
      void fetchUserByGuid(correction.userId);
    }
  }, [correction?.userId]);

  useEffect(() => {
    const rawPhotoUrl =
      correction?.profileImageUrl?.trim() ||
      (selectedUser as any)?.profileImageUrl?.trim() ||
      String((selectedUser as any)?.profileImage || "").trim();
    const resolvedUrl = rawPhotoUrl ? getImageUrl(rawPhotoUrl) : null;
    setPhotoURL(resolvedUrl ? cacheBust(resolvedUrl) : null);
  }, [correction?.profileImageUrl, selectedUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !correction) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", px: 3 }}>
        <Alert severity="error">{error || "Data tidak ditemukan."}</Alert>
      </Box>
    );
  }

  const reasonLabel =
    REASON_CODE_LABELS[correction.reason] ||
    CORRECTION_TYPE_LABELS[correction.type as CorrectionType] ||
    correction.reason;

  const isCheckOut = isCheckOutCorrection(correction);
  const timeOld = isCheckOut ? correction.checkOutTimeOld : correction.checkInTimeOld;
  const timeNew = isCheckOut ? correction.checkOutTimeNew : correction.checkInTimeNew;

  const userData = {
    name: correction.username || selectedUser?.fullName || "Unknown",
    nip: correction.nip || selectedUser?.nip || "Unknown",
    role: correction.role || (selectedUser as any)?.role || "Unknown",
    department: selectedUser?.department || "Unknown",
  };

  const statusCfg = statusConfig[correction.status as CorrectionStatus] ?? {
    label: CORRECTION_STATUS_LABELS[correction.status as CorrectionStatus] ?? correction.status,
    color: "default" as any,
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", width: "100%", pb: 8 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 1,
          px: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton color="inherit" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ flexGrow: 1, textAlign: "center", mr: 5 }}
        >
          Detail Revisi
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Avatar Section */}
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
            <Avatar
              src={photoURL || undefined}
              sx={{
                width: 80,
                height: 80,
                bgcolor: photoURL ? undefined : "#ff7043",
                fontWeight: 700,
                border: "3px solid #fff",
              }}
              imgProps={{
                style: {
                  objectFit: "cover",
                  objectPosition: "center 20%",
                },
                referrerPolicy: "no-referrer",
                onError: () => setPhotoURL(null),
              }}
            >
              {!photoURL && userData.name.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, textAlign: "center" }}>
              {userData.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, textAlign: "center" }}>
              {userData.nip}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: "center" }}>
              {[userData.role, userData.department]
                .filter((value) => value && value !== "Unknown")
                .join(" • ") || "Unknown"}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#fff",
              px: 2,
              py: 1.5,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Chip
              label={statusCfg.label}
              color={statusCfg.color}
              size="medium"
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Jenis Revisi */}
            <InfoRow label="Jenis Revisi">
              <Typography variant="body1" fontWeight="bold">
                {reasonLabel}
              </Typography>
            </InfoRow>

            {/* Tanggal Presensi */}
            {correction.date && (
              <InfoRow label="Tanggal Presensi">
                <Typography variant="body1" fontWeight="bold">
                  {formatDateFull(correction.date)}
                </Typography>
              </InfoRow>
            )}

            {/* Tanggal Pengajuan */}
            <InfoRow label="Tanggal Pengajuan">
              <Typography variant="body1" fontWeight="bold">
                {formatDateFull(correction.requestDate ?? correction.createdAt)}
              </Typography>
            </InfoRow>

            {/* Waktu Presensi Lama */}
            <InfoRow label="Waktu Presensi Lama">
              <Typography variant="body1" fontWeight="bold">
                {formatTimeOnly(timeOld)}
              </Typography>
            </InfoRow>

            {/* Waktu Presensi Baru */}
            <InfoRow label="Waktu Presensi Baru">
              <Typography variant="body1" fontWeight="bold">
                {formatTimeOnly(timeNew)}
              </Typography>
            </InfoRow>

            {/* Rincian Keterangan */}
            <InfoRow label="Rincian Keterangan">
              <Typography variant="body1">
                {correction.reasonDescription || "-"}
              </Typography>
            </InfoRow>

            {/* Catatan Penolakan */}
            {correction.status === CorrectionStatus.REJECTED &&
              correction.rejectionReason && (
                <InfoRow label="Catatan Penolakan">
                  <Typography variant="body1" color="error">
                    {correction.rejectionReason}
                  </Typography>
                </InfoRow>
              )}

            {/* Reviewed at */}
            {correction.reviewedAt && (
              <Box sx={{ width: "100%", px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Ditinjau pada
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatDateFull(correction.reviewedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      <BottomNav />
    </Box>
  );
};

export default RevisiDetailPage;

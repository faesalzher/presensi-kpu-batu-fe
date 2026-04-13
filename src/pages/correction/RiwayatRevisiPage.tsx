// src/pages/correction/RiwayatRevisiPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Pagination,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpIcon from "@mui/icons-material/Help";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { id } from "date-fns/locale/id";
import { getNow } from "../../constant/time.constant";
import {
  Correction,
  CorrectionStatus,
  CORRECTION_TYPE_LABELS,
  CorrectionType,
} from "../../types/corrections";
import CorrectionsService from "../../services/CorrectionsService";
import FileService from "../../services/FileService";

// Backend may return `id` or `guid` — handle both
const getCorrectionId = (c: Correction): string =>
  (c as any).id ?? c.guid;

// Reason code labels (matching CorrectionPage options)
const REASON_CODE_LABELS: Record<string, string> = {
  MISSED_CHECK_IN: "Lupa Absen Masuk",
  MISSED_CHECK_OUT: "Lupa Absen Pulang",
  LATE_ARRIVAL: "Terlambat Datang",
  TECHNICAL_ISSUE_CHECK_IN: "Kendala Teknis Absen Masuk",
  TECHNICAL_ISSUE_CHECK_OUT: "Kendala Teknis Absen Pulang",
};

interface CorrectionItemProps {
  correction: Correction;
  onClick?: () => void;
}

const CorrectionItem: React.FC<CorrectionItemProps> = ({
  correction,
  onClick,
}) => {
  const { type, date, status, reason, requestDate, createdAt } = correction;

  const formattedRequestDate = (requestDate ?? createdAt)
    ? format(new Date((requestDate ?? createdAt) as string), "dd MMMM yyyy", { locale: id })
    : "-";

  const formattedAttendanceDate = date
    ? format(new Date(date), "EEEE, dd MMMM yyyy", { locale: id })
    : null;

  const typeLabel =
    REASON_CODE_LABELS[reason] ||
    CORRECTION_TYPE_LABELS[type as CorrectionType] ||
    type;

  return (
    <Card
      sx={{
        mb: 2,
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          "&:last-child": { pb: 1.5 },
        }}
      >
        {/* Avatar */}
        {(() => {
          const src = correction.profileImageUrl
            ? /^https?:\/\//i.test(correction.profileImageUrl)
              ? `${correction.profileImageUrl}?t=${Date.now()}`
              : FileService.getFileViewUrl(correction.profileImageUrl)
            : undefined;
          return (
            <Avatar
              src={src || undefined}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#ff7043",
                fontWeight: 700,
                mr: 1.5,
                flexShrink: 0,
              }}
              imgProps={{
                style: {
                  objectFit: "cover",
                  objectPosition: "center 20%",
                },
                referrerPolicy: "no-referrer",
              }}
            />
          );
        })()}

        {/* Info */}
        <Box sx={{ flex: "1 1 auto", overflow: "hidden", pr: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "medium",
              lineHeight: 1.3,
              mb: 0.5,
            }}
          >
            {typeLabel}
          </Typography>
          {formattedAttendanceDate && (
            <Typography variant="body2" color="text.secondary">
              {formattedAttendanceDate}
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled">
            Diajukan: {formattedRequestDate}
          </Typography>
        </Box>

        {/* Status icon */}
        {status === CorrectionStatus.PENDING && (
          <Box
            sx={{
              bgcolor: "#FFEBBC",
              borderRadius: "8px",
              width: 45,
              height: 45,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 45,
              flexShrink: 0,
            }}
          >
            <HelpIcon sx={{ color: "#F9A825" }} />
          </Box>
        )}
        {status === CorrectionStatus.APPROVED && (
          <Box
            sx={{
              bgcolor: "#D7F5DB",
              borderRadius: "8px",
              width: 45,
              height: 45,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 45,
              flexShrink: 0,
            }}
          >
            <CheckCircleIcon sx={{ color: "success.main" }} />
          </Box>
        )}
        {status === CorrectionStatus.REJECTED && (
          <Box
            sx={{
              bgcolor: "#FEEBEE",
              borderRadius: "8px",
              width: 45,
              height: 45,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 45,
              flexShrink: 0,
            }}
          >
            <CancelIcon sx={{ color: "#F44336" }} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};


interface MonthMapEntry {
  startDate: string;
  endDate: string;
}

const RiwayatRevisiPage: React.FC = () => {
  const navigate = useNavigate();

  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState<string>(
    format(getNow(), "MMMM yyyy", { locale: id })
  );
  const [activeFilter, setActiveFilter] = useState<CorrectionStatus | "ALL">(
    "ALL"
  );

  const itemsPerPage = 5;

  const now = getNow();
  const currentYear = now.getFullYear();
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

  const fetchCorrections = async (monthKey: string) => {
    const range = monthMap[monthKey] || monthMap[Object.keys(monthMap)[0]];
    setLoading(true);
    setError(null);

    try {
      const data = await CorrectionsService.getMyCorrections({
        startDate: range.startDate,
        endDate: range.endDate,
      });
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.requestDate ?? b.createdAt).getTime() -
          new Date(a.requestDate ?? a.createdAt).getTime()
      );
      setCorrections(sorted);
    } catch {
      setError("Gagal memuat riwayat revisi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections(month);
  }, [month]);

  const filteredCorrections = useMemo(() => {
    if (activeFilter === "ALL") return corrections;
    return corrections.filter((c) => c.status === activeFilter);
  }, [corrections, activeFilter]);

  const totalPages = Math.ceil(filteredCorrections.length / itemsPerPage);

  const paginatedCorrections = useMemo(() => {
    return filteredCorrections.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
  }, [filteredCorrections, page]);

  const handleMonthChange = (event: SelectChangeEvent) => {
    setMonth(event.target.value);
    setPage(1);
  };

  // Reset to page 1 when filter changes or month changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, month]);

  // Adjust page if out of range
  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(1);
  }, [page, totalPages]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleDetail = (guid: string) => {
    navigate(`/riwayat-revisi/${guid}`);
  };

  return (
    <Box
      sx={{
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        width: "100%",
        pb: 8,
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
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
        <IconButton color="inherit" onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ flexGrow: 1, textAlign: "center", mr: 5 }}
        >
          Riwayat Revisi
        </Typography>
      </Box>

      {/* Content */}
      <Container sx={{ pt: 2, pb: 2, flex: 1 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
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

        <Tabs
          value={activeFilter}
          onChange={(_, v) => setActiveFilter(v as CorrectionStatus | "ALL")}
          variant="fullWidth"
          sx={{
            mb: 2,
            minHeight: 36,
            "& .MuiTab-root": {
              minHeight: 32,
              py: 0.5,
              px: 1,
              fontSize: 13,
              textTransform: "none",
            },
          }}
        >
          <Tab sx={{ minWidth: 0 }} label={`Semua (${corrections.length})`} value="ALL" />
          <Tab sx={{ minWidth: 0 }} label={`Pending (${corrections.filter(c => c.status === CorrectionStatus.PENDING).length})`} value={CorrectionStatus.PENDING} />
          <Tab sx={{ minWidth: 0 }} label={`Disetujui (${corrections.filter(c => c.status === CorrectionStatus.APPROVED).length})`} value={CorrectionStatus.APPROVED} />
          <Tab sx={{ minWidth: 0 }} label={`Ditolak (${corrections.filter(c => c.status === CorrectionStatus.REJECTED).length})`} value={CorrectionStatus.REJECTED} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : paginatedCorrections.length > 0 ? (
          paginatedCorrections.map((correction) => (
            <CorrectionItem
              key={getCorrectionId(correction)}
              correction={correction}
              onClick={() => handleDetail(getCorrectionId(correction))}
            />
          ))
        ) : (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography color="textSecondary">
              {activeFilter === "ALL"
                ? "Belum ada riwayat revisi."
                : `Tidak ada revisi dengan status ${activeFilter.toLowerCase()}.`}
            </Typography>
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="medium"
            />
          </Box>
        )}
      </Container>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default RiwayatRevisiPage;

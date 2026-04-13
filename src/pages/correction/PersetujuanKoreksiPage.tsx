// src/pages/correction/PersetujuanKoreksiPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  IconButton,
  List,
  ListItem,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Pagination,
  Tabs,
  Tab,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useCorrections } from "../../contexts/CorrectionsContext";
import {
  Correction,
  CORRECTION_TYPE_LABELS,
  CorrectionType,
  CorrectionStatus,
  CORRECTION_STATUS_LABELS,
} from "../../types/corrections";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { id } from "date-fns/locale";
import { getNow } from "../../constant/time.constant";
import FileService from "../../services/FileService";

interface MonthMapEntry {
  startDate: string;
  endDate: string;
}

// Backend may return `id` or `guid` — handle both
const getCorrectionId = (c: Correction): string =>
  (c as any).id ?? c.guid;

const PersetujuanKoreksiPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    corrections,
    loading: correctionsLoading,
    error: correctionsError,
    fetchCorrections,
    clearError: clearCorrectionsError,
  } = useCorrections();

  const loading = correctionsLoading;
  const error = correctionsError;

  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 6;
  const [selectedTab, setSelectedTab] = useState<CorrectionStatus>(
    CorrectionStatus.PENDING
  );
  const [month, setMonth] = useState<string>(
    format(getNow(), "MMMM yyyy", { locale: id })
  );

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

  // Format dates for display in Indonesian
  const formatDate = (date: string | Date) => {
    return format(
      typeof date === "string" ? new Date(date) : date,
      "dd MMMM yyyy",
      { locale: id }
    );
  };

  useEffect(() => {
    const range = monthMap[month] || monthMap[Object.keys(monthMap)[0]];
    fetchCorrections({
      startDate: range.startDate,
      endDate: range.endDate,
    });
  }, [month]);

  useEffect(() => {
    setPage(1);
  }, [selectedTab, month]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleDetail = (guid: string) => {
    navigate(`/persetujuan-koreksi-detail/${guid}`);
  };

  const handleMonthChange = (event: SelectChangeEvent) => {
    setMonth(event.target.value);
    setPage(1);
  };

  const filteredCorrections = useMemo(() => {
    return corrections.filter(
      (correction) => correction.status === selectedTab
    );
  }, [corrections, selectedTab]);

  const totalPages = Math.max(1, Math.ceil(filteredCorrections.length / itemsPerPage));

  const paginatedCorrections = useMemo(() => {
    return filteredCorrections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [filteredCorrections, page]);

  // Get initial for avatar
  const getInitial = (name: string) => {
    return name && name !== "Unknown" ? name.charAt(0).toUpperCase() : "U";
  };

  // Get the formatted correction type label
  const getCorrectionTypeLabel = (type: string): string => {
    if (type in CorrectionType) {
      return CORRECTION_TYPE_LABELS[type as CorrectionType] || type;
    }
    return type || "Tipe tidak tersedia";
  };

  // Clear errors from both contexts
  const handleClearError = () => {
    clearCorrectionsError();
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", width: "100%", minHeight: "100vh", pb: 7 }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, textAlign: "center", mr: 4 }}
          >
            Persetujuan Revisi
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={handleClearError}>
            {error}
          </Alert>
        )}

        {/* Loading indicator */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4, overflow: "hidden" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
              value={selectedTab}
              onChange={(_, v) => setSelectedTab(v as CorrectionStatus)}
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
                "& .MuiTabs-flexContainer": {
                  gap: 2,
                },
              }}
            >
              <Tab
                sx={{ minWidth: 0 }}
                label={`Pengajuan (${corrections.filter(c => c.status === CorrectionStatus.PENDING).length})`}
                value={CorrectionStatus.PENDING}
              />
              <Tab
                sx={{ minWidth: 0 }}
                label={`Disetujui (${corrections.filter(c => c.status === CorrectionStatus.APPROVED).length})`}
                value={CorrectionStatus.APPROVED}
              />
              <Tab
                sx={{ minWidth: 0 }}
                label={`Ditolak (${corrections.filter(c => c.status === CorrectionStatus.REJECTED).length})`}
                value={CorrectionStatus.REJECTED}
              />
            </Tabs>

            {paginatedCorrections.length === 0 ? (
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="body1">
                  Tidak ada koreksi dengan status {CORRECTION_STATUS_LABELS[selectedTab].toLowerCase()}.
                </Typography>
              </Paper>
            ) : (
              <List sx={{ p: 0 }}>
                {paginatedCorrections.map((correction: Correction) => {
                  const rawProfile = correction.profileImageUrl?.trim() || "";
                  const src = rawProfile
                    ? /^https?:\/\//.test(rawProfile)
                      ? `${rawProfile}?t=${Date.now()}`
                      : FileService.getFileViewUrl(rawProfile)
                    : undefined;

                  return (
                    <Paper
                      onClick={() => handleDetail(getCorrectionId(correction))}
                      key={getCorrectionId(correction)}
                      elevation={1}
                      sx={{
                        mb: 2,
                        borderRadius: 3,
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ListItem
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={src || undefined}
                            sx={{ width: 44, height: 44, bgcolor: "#ff7043" }}
                            imgProps={{
                              style: { objectFit: "cover", objectPosition: "center 20%" },
                              referrerPolicy: "no-referrer",
                            }}
                          >
                            {getInitial(correction.username || "Unknown")}
                          </Avatar>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {correction.username || "Unknown"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {correction.nip || "Unknown"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              {getCorrectionTypeLabel(correction.type)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {formatDate(correction.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    </Paper>
                  );
                })}
              </List>
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
          </>
        )}
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default PersetujuanKoreksiPage;

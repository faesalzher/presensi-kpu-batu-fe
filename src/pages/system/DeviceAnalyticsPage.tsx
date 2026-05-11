import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import AnalyticsSummaryCards from "../../components/device-analytics/AnalyticsSummaryCards";
import DeviceAnalyticsDetailDialog from "../../components/device-analytics/DeviceAnalyticsDetailDialog";
import DeviceAnalyticsTable from "../../components/device-analytics/DeviceAnalyticsTable";
import { useAuth } from "../../contexts/AuthContext";
import DeviceAnalyticsService from "../../services/DeviceAnalyticsService";
import {
  DeviceAnalyticsDetailResponse,
  DeviceAnalyticsFilters,
  DeviceAnalyticsListItem,
  DeviceAnalyticsSummaryResponse,
  SortByField,
  SortDirection,
} from "../../types/device-analytics";
import { UserRole } from "../../types/enums";

const INITIAL_FILTERS: DeviceAnalyticsFilters = {
  search: "",
  platform: "",
  browser: "",
  trustStatus: "",
  startDate: "",
  endDate: "",
};

const INITIAL_SUMMARY: DeviceAnalyticsSummaryResponse = {
  totalActiveDevices: 0,
  usersWithMultipleDevices: 0,
  suspiciousDeviceChanges: 0,
  highTrustUsers: 0,
};

const DeviceAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [rows, setRows] = useState<DeviceAnalyticsListItem[]>([]);
  const [summary, setSummary] = useState<DeviceAnalyticsSummaryResponse>(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [sortBy, setSortBy] = useState<SortByField>("lastAttendance");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [filters, setFilters] = useState<DeviceAnalyticsFilters>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState<DeviceAnalyticsFilters>(INITIAL_FILTERS);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<DeviceAnalyticsDetailResponse | null>(null);

  const loadMainList = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await DeviceAnalyticsService.getList({
        page: page + 1,
        pageSize,
        sortBy,
        sortDirection,
        ...filters,
      });

      setRows(response.items);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch device analytics list");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, sortBy, sortDirection]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await DeviceAnalyticsService.getSummary(filters);
      setSummary(response);
    } catch {
      setSummary(INITIAL_SUMMARY);
    } finally {
      setSummaryLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadMainList();
  }, [loadMainList]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const heading = useMemo(() => {
    if (location.pathname.includes("trust-monitoring")) {
      return "Trust Monitoring";
    }
    return "Device Analytics";
  }, [location.pathname]);

  const handleSortChange = (field: SortByField) => {
    setPage(0);
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortDirection("desc");
  };

  const handleDraftSelect =
    (key: keyof DeviceAnalyticsFilters) =>
    (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

  const handleApplyFilters = () => {
    setPage(0);
    setFilters(draftFilters);
  };

  const handleResetFilters = () => {
    setPage(0);
    setDraftFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
  };

  const handleOpenDetail = async (row: DeviceAnalyticsListItem) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);

    try {
      const response = await DeviceAnalyticsService.getDetail(row.userId);
      setDetailData(response);
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || err?.message || "Failed to fetch user detail");
    } finally {
      setDetailLoading(false);
    }
  };

  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ bgcolor: "#f6f8fc", minHeight: "100vh", pb: 8 }}>
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          color: "#fff",
          bgcolor: "primary.main",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {heading}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.95 }}>
          Analytics and observation dashboard only. No automatic blocking or attendance rejection.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <AnalyticsSummaryCards summary={summary} loading={summaryLoading} />
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 2, p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} useFlexGap flexWrap="wrap">
            <TextField
              size="small"
              label="Search user or fingerprint"
              value={draftFilters.search}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
              sx={{ minWidth: { xs: "100%", lg: 260 } }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
              <InputLabel id="platform-filter">Platform</InputLabel>
              <Select
                labelId="platform-filter"
                label="Platform"
                value={draftFilters.platform}
                onChange={handleDraftSelect("platform")}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Android">Android</MenuItem>
                <MenuItem value="iOS">iOS</MenuItem>
                <MenuItem value="Windows">Windows</MenuItem>
                <MenuItem value="MacOS">MacOS</MenuItem>
                <MenuItem value="Linux">Linux</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
              <InputLabel id="browser-filter">Browser</InputLabel>
              <Select
                labelId="browser-filter"
                label="Browser"
                value={draftFilters.browser}
                onChange={handleDraftSelect("browser")}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Chrome">Chrome</MenuItem>
                <MenuItem value="Edge">Edge</MenuItem>
                <MenuItem value="Firefox">Firefox</MenuItem>
                <MenuItem value="Safari">Safari</MenuItem>
                <MenuItem value="Samsung Internet">Samsung Internet</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
              <InputLabel id="trust-filter">Trust Status</InputLabel>
              <Select
                labelId="trust-filter"
                label="Trust Status"
                value={draftFilters.trustStatus}
                onChange={handleDraftSelect("trustStatus")}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="HIGH">High Trust</MenuItem>
                <MenuItem value="MEDIUM">Medium Trust</MenuItem>
                <MenuItem value="LOW">Low Trust</MenuItem>
                <MenuItem value="SUSPICIOUS">Suspicious</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={draftFilters.startDate}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              sx={{ minWidth: { xs: "100%", sm: 170 } }}
            />

            <TextField
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={draftFilters.endDate}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              sx={{ minWidth: { xs: "100%", sm: 170 } }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleApplyFilters}>
                Apply
              </Button>
              <Button variant="outlined" onClick={handleResetFilters}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <DeviceAnalyticsTable
          rows={rows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPage(0);
            setPageSize(next);
          }}
          onSortChange={handleSortChange}
          onRowClick={handleOpenDetail}
        />
      </Container>

      <DeviceAnalyticsDetailDialog
        open={detailOpen}
        loading={detailLoading}
        error={detailError}
        detail={detailData}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
};

export default DeviceAnalyticsPage;

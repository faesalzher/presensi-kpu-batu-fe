import React from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import {
  DeviceAnalyticsListItem,
  SortByField,
  SortDirection,
} from "../../types/device-analytics";
import TrustScoreBadge from "./TrustScoreBadge";

interface DeviceAnalyticsTableProps {
  rows: DeviceAnalyticsListItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: SortByField;
  sortDirection: SortDirection;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  onSortChange: (sortBy: SortByField) => void;
  onRowClick: (row: DeviceAnalyticsListItem) => void;
}

const DeviceAnalyticsTable: React.FC<DeviceAnalyticsTableProps> = ({
  rows,
  loading,
  page,
  pageSize,
  totalCount,
  sortBy,
  sortDirection,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onRowClick,
}) => {
  const sortableHeader = (label: string, field: SortByField) => {
    const isActive = sortBy === field;

    return (
      <TableSortLabel
        active={isActive}
        direction={isActive ? sortDirection : "asc"}
        onClick={() => onSortChange(field)}
      >
        {label}
      </TableSortLabel>
    );
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 1260 }}>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Dominant Device</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Browser</TableCell>
              <TableCell align="right">Total Attendance</TableCell>
              <TableCell align="right">{sortableHeader("Unique Device Count", "deviceCount")}</TableCell>
              <TableCell align="right">{sortableHeader("Dominant Device Ratio", "dominantRatio")}</TableCell>
              <TableCell align="right">{sortableHeader("Trust Score", "trustScore")}</TableCell>
              <TableCell>Trust Status</TableCell>
              <TableCell>{sortableHeader("Last Attendance", "lastAttendance")}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={10}>
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading device analytics...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      No analytics data found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try changing search keywords, filters, or date range.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((row) => (
                <TableRow key={String(row.userId)} hover sx={{ cursor: "pointer" }} onClick={() => onRowClick(row)}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.userName}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.dominantFingerprint}</TableCell>
                  <TableCell>{row.dominantPlatform}</TableCell>
                  <TableCell>{row.dominantBrowser}</TableCell>
                  <TableCell align="right">{row.totalAttendance}</TableCell>
                  <TableCell align="right">{row.uniqueDeviceCount}</TableCell>
                  <TableCell align="right">{row.dominantDeviceRatio}%</TableCell>
                  <TableCell align="right">{row.trustScore}</TableCell>
                  <TableCell>
                    <TrustScoreBadge status={row.trustStatus} />
                  </TableCell>
                  <TableCell>
                    {row.lastAttendanceAt ? format(new Date(row.lastAttendanceAt), "dd-MM-yyyy HH:mm") : "-"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_e, nextPage) => onPageChange(nextPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  );
};

export default DeviceAnalyticsTable;

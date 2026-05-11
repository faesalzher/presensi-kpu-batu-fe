import React from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { DeviceAnalyticsDetailResponse } from "../../types/device-analytics";

interface DeviceAnalyticsDetailDialogProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  detail: DeviceAnalyticsDetailResponse | null;
  onClose: () => void;
}

const DeviceAnalyticsDetailDialog: React.FC<DeviceAnalyticsDetailDialogProps> = ({
  open,
  loading,
  error,
  detail,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {detail?.userName ?? "Device Analytics Detail"}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading user device history...
            </Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && detail && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Trust Observations
            </Typography>

            {detail.trustObservations.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No trust observations provided by backend.
                </Typography>
              </Paper>
            ) : (
              <Box component="ul" sx={{ pl: 2.5, mt: 0, mb: 2 }}>
                {detail.trustObservations.map((obs) => (
                  <li key={obs}>
                    <Typography variant="body2" color="text.secondary">
                      {obs}
                    </Typography>
                  </li>
                ))}
              </Box>
            )}

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Device History
            </Typography>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Fingerprint</TableCell>
                    <TableCell>Device Type</TableCell>
                    <TableCell>Platform</TableCell>
                    <TableCell>Browser</TableCell>
                    <TableCell>Mobile-like</TableCell>
                    <TableCell>Trust Score</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {detail.history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No device history found for this user.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {detail.history.map((item, idx) => (
                    <TableRow key={`${item.timestamp}-${item.fingerprint}-${idx}`}>
                      <TableCell>{format(new Date(item.timestamp), "dd-MM-yyyy HH:mm")}</TableCell>
                      <TableCell>{item.fingerprint}</TableCell>
                      <TableCell>{item.deviceType}</TableCell>
                      <TableCell>{item.platform}</TableCell>
                      <TableCell>{item.browser}</TableCell>
                      <TableCell>{item.mobileLike ? "Yes" : "No"}</TableCell>
                      <TableCell>{item.trustScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeviceAnalyticsDetailDialog;

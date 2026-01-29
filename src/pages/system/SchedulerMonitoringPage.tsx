import React, { useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Alert,
  TableContainer,
} from "@mui/material";
import { format } from "date-fns";
import { useSystem } from "../../contexts/SystemContext";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/enums";

const SchedulerMonitoringPage: React.FC = () => {
  const { schedulerLogs, schedulerLoading, fetchSchedulerLogs, runSchedulerJob, error } = useSystem();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchSchedulerLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  if (user?.role !== UserRole.ADMIN) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Akses ditolak. Hanya admin yang dapat melihat halaman ini.</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#f5f5f5",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        pb: 8,
      }}
    >
      <Box
        sx={{
          bgcolor: "primary.main",
          p: 1.5,
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Monitoring Scheduler
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <Paper sx={{ p: 2, borderRadius: 2 }}>
          {schedulerLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {/* make table horizontally scrollable on small screens */}
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Executed</TableCell>
                  <TableCell>Delay</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(schedulerLogs || []).map((r) => {
                  const scheduled = r.scheduledAt ? format(new Date(r.scheduledAt), "dd-MM-yyyy HH:mm") : "-";
                  const executed = r.executedAt ? format(new Date(r.executedAt), "dd-MM-yyyy HH:mm") : "-";
                  const delay =
                    r.scheduledAt && r.executedAt
                      ? `${Math.round((new Date(r.executedAt).getTime() - new Date(r.scheduledAt).getTime()) / 60000)}m`
                      : "-";

                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.createdAt ? format(new Date(r.createdAt), "dd-MM-yyyy") : "-"}</TableCell>
                      <TableCell>{r.jobName}</TableCell>
                      <TableCell>{scheduled}</TableCell>
                      <TableCell>{executed}</TableCell>
                      <TableCell>{delay}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>
                        {r.status === "NOT_RUN" ? (
                          <Button
                            size="small"
                            onClick={() => runSchedulerJob(r.jobName, r.scheduledAt || null)}
                          >
                            ▶ Run
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default SchedulerMonitoringPage;
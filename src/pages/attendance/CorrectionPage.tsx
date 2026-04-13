import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BottomNav from "../../components/BottomNav";
import { useCorrections } from "../../contexts/CorrectionsContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { format } from "date-fns";
import { CreateCorrectionDto } from "../../types/corrections";

const REVISION_REASON_OPTIONS = [
  {
    value: "MISSED_CHECK_IN",
    label: "Lupa Absen Masuk",
    correctionType: "MISSED_CHECK_IN",
  },
  {
    value: "MISSED_CHECK_OUT",
    label: "Lupa Absen Pulang",
    correctionType: "MISSED_CHECK_OUT",
  },
  {
    value: "LATE_ARRIVAL",
    label: "Koreksi Keterlambatan",
    correctionType: "LATE_ARRIVAL",
  },
  {
    value: "TECHNICAL_ISSUE_CHECK_IN",
    label: "Kendala Teknis Masuk",
    correctionType: "TECHNICAL_ISSUE_CHECK_IN",
  },
  {
    value: "TECHNICAL_ISSUE_CHECK_OUT",
    label: "Kendala Teknis Pulang",
    correctionType: "TECHNICAL_ISSUE_CHECK_OUT",
  },
] as const;

type RevisionReasonValue = (typeof REVISION_REASON_OPTIONS)[number]["value"];

const inputFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
  },
};

const isCheckOutReason = (reason: RevisionReasonValue): boolean => {
  return (
    reason === "MISSED_CHECK_OUT" || reason === "TECHNICAL_ISSUE_CHECK_OUT"
  );
};

const toIsoDateTime = (value?: Date | string | null): string | null => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const combineAttendanceDateWithTime = (
  attendanceDate: Date | string,
  timeValue: Date
): string => {
  const baseDate = new Date(attendanceDate);
  const result = new Date(baseDate);

  result.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);

  return result.toISOString();
};

const AttendanceCorrectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const { createCorrection, loading, error, clearError } = useCorrections();
  const { selectedAttendance, fetchAttendanceById } = useAttendance();

  const [revisionReason, setRevisionReason] =
    useState<RevisionReasonValue>("MISSED_CHECK_IN");
  const [revisedTime, setRevisedTime] = useState<Date | null>(null);
  const [detailDescription, setDetailDescription] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    if (attendanceId) {
      fetchAttendanceById(attendanceId);
    }
  }, [attendanceId, fetchAttendanceById]);

  useEffect(() => {
    if (!selectedAttendance) return;

    if (!selectedAttendance.checkInTime) {
      setRevisionReason("MISSED_CHECK_IN");
      return;
    }

    if (!selectedAttendance.checkOutTime) {
      setRevisionReason("MISSED_CHECK_OUT");
      return;
    }

    setRevisionReason("TECHNICAL_ISSUE_CHECK_IN");
  }, [selectedAttendance]);

  const attendanceDate = useMemo(() => {
    if (!selectedAttendance) return "-";
    return format(new Date(selectedAttendance.date), "dd MMMM yyyy");
  }, [selectedAttendance]);

  const originalTime = useMemo(() => {
    if (!selectedAttendance) return "--:--";

    const sourceTime =
      isCheckOutReason(revisionReason)
        ? selectedAttendance.checkOutTime
        : selectedAttendance.checkInTime;

    if (!sourceTime) return "--:--";
    return format(new Date(sourceTime), "HH:mm");
  }, [selectedAttendance, revisionReason]);

  useEffect(() => {
    if (!selectedAttendance) return;

    const sourceTime = isCheckOutReason(revisionReason)
      ? selectedAttendance.checkOutTime
      : selectedAttendance.checkInTime;

    setRevisedTime(sourceTime ? new Date(sourceTime) : null);
  }, [selectedAttendance, revisionReason]);

  const handleCloseError = () => {
    setValidationError("");
    clearError();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    setValidationError("");

    if (!attendanceId) {
      setValidationError("Attendance tidak ditemukan.");
      return;
    }

    if (!revisedTime) {
      setValidationError("Jam Revisi wajib diisi.");
      return;
    }

    if (!detailDescription.trim()) {
      setValidationError("Rincian Keterangan wajib diisi.");
      return;
    }

    const selectedOption = REVISION_REASON_OPTIONS.find(
      (option) => option.value === revisionReason
    );

    if (!selectedOption) {
      setValidationError("Tipe alasan revisi tidak valid.");
      return;
    }

    const checkInTimeOld = toIsoDateTime(selectedAttendance?.checkInTime);
    const checkOutTimeOld = toIsoDateTime(selectedAttendance?.checkOutTime);
    const revisedTimeValue = combineAttendanceDateWithTime(
      selectedAttendance ? selectedAttendance.date : new Date(),
      revisedTime
    );
    const isCheckOutRevision = isCheckOutReason(revisionReason);

    const correctionData: CreateCorrectionDto = {
      attendanceId,
      type: selectedOption.correctionType,
      date: format(
        selectedAttendance ? new Date(selectedAttendance.date) : new Date(),
        "yyyy-MM-dd"
      ),
      reasonCode: selectedOption.correctionType,
      reasonDescription: detailDescription.trim(),
      checkInTimeOld,
      checkInTimeNew: isCheckOutRevision ? checkInTimeOld : revisedTimeValue,
      checkOutTimeOld,
      checkOutTimeNew: isCheckOutRevision ? revisedTimeValue : checkOutTimeOld,
    };

    try {
      await createCorrection(correctionData);
      navigate("/history", {
        state: {
          success: true,
          message: "Pengajuan revisi kehadiran berhasil dikirim",
        },
      });
    } catch {
      // Error from context is shown in snackbar
    }
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
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 2,
          display: "flex",
          alignItems: "center",
          px: 1,
        }}
      >
        <IconButton onClick={handleBack} sx={{ color: "white", mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, textAlign: "center", mr: 5 }}>
          Revisi Kehadiran
        </Typography>
      </Box>

      {/* Content */}
      <Container sx={{ pt: 2, pb: 2, flex: 1, overflowY: "auto" }}>
        {(loading && !selectedAttendance) ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Tanggal Absensi
                </Typography>
                <TextField
                  fullWidth
                  value={attendanceDate}
                  InputProps={{ readOnly: true }}
                  sx={inputFieldSx}
                  disabled  
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Alasan Revisi
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={revisionReason}
                  onChange={(event) =>
                    setRevisionReason(event.target.value as RevisionReasonValue)
                  }
                  sx={inputFieldSx}
                >
                  {REVISION_REASON_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Jam Sebelum Revisi
                </Typography>
                <TextField
                  fullWidth
                  value={originalTime}
                  InputProps={{ readOnly: true }}
                  sx={inputFieldSx}
                  disabled
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Jam Revisi
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    ampm={false}
                    value={revisedTime}
                    onChange={(value) => setRevisedTime(value)}
                    views={["hours", "minutes"]}
                    format="HH:mm"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        sx: inputFieldSx,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Rincian Keterangan
                </Typography>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  value={detailDescription}
                  onChange={(event) => setDetailDescription(event.target.value)}
                  placeholder="Tuliskan rincian alasan revisi"
                  sx={inputFieldSx}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                disabled={loading}
                onClick={handleSubmit}
                sx={{
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: 2,
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Ajukan Revisi"}
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error || validationError)}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: "100%" }}>
          {validationError || error}
        </Alert>
      </Snackbar>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default AttendanceCorrectionPage;

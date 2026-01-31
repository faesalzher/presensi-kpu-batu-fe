// LeaveRequestPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Fab,
  CircularProgress,
  Alert,
  Snackbar,
  Pagination,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpIcon from "@mui/icons-material/Help";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useLeaveRequests } from "../../contexts/LeaveRequestsContext";
import { format } from "date-fns";
import {
  LeaveRequestStatus,
  LeaveRequestTypeLabels,
} from "../../types/leave-request-enums";
import { LeaveRequest } from "../../types/leave-requests";

interface LeaveRequestItemProps {
  leaveRequest: LeaveRequest;
  onClick?: () => void;
}

const LeaveRequestItem: React.FC<LeaveRequestItemProps> = ({
  leaveRequest,
  onClick,
}) => {
  const { type, startDate, status } = leaveRequest;
  const formattedDate = format(new Date(startDate), "dd MMMM yyyy");

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
        }}
      >
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: "medium" }}
          >
            {LeaveRequestTypeLabels[type] || type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formattedDate}
          </Typography>
        </Box>
        {status === LeaveRequestStatus.PENDING && (
          <Box
            sx={{
              bgcolor: "#FFEBBC",
              borderRadius: "8px",
              width: 45,
              height: 45,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HelpIcon sx={{ color: "#F9A825" }} />
          </Box>
        )}
        {status === LeaveRequestStatus.APPROVED && (
          <Box
            sx={{
              bgcolor: "#D7F5DB",
              borderRadius: "8px",
              width: 45,
              height: 45,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CheckCircleIcon sx={{ color: "success.main" }} />
          </Box>
        )}
        {status === LeaveRequestStatus.REJECTED && (
          <Box
            sx={{
              bgcolor: "#FEEBEE",
              borderRadius: "8px",
              width: 45,
              height: 45,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CancelIcon sx={{ color: "#F44336" }} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const LeaveRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { myRequests, loading, error, fetchMyRequests, clearError } =
    useLeaveRequests();

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(myRequests.length / itemsPerPage);

  const paginatedRequests = useMemo(() => {
    return myRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [myRequests, page]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleForm = () => {
    navigate("/leave-request-form");
  };

  const handleDetail = (guid: string) => {
    navigate(`/detail-request/${guid}`); // Use dynamic route
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
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">Pengajuan</Typography>
      </Box>

      {/* Content */}
      <Container sx={{ pt: 2, pb: 2, flex: 1, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : paginatedRequests.length > 0 ? (
          paginatedRequests.map((request) => (
            <LeaveRequestItem
              key={request.guid}
              leaveRequest={request}
              onClick={() => handleDetail(request.guid)}
            />
          ))
        ) : (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography color="textSecondary">
              Belum ada pengajuan. Klik tombol + untuk membuat pengajuan baru.
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

      {/* Upload File Button */}
      <Fab
        onClick={handleForm}
        color="primary"
        size="medium"
        aria-label="Ajukan Izin"
        sx={{
          position: "fixed",
          bottom: 80,
          right: 24,
        }}
      >
        <UploadFileIcon />
      </Fab>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default LeaveRequestPage;

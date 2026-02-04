// src/pages/leave/PersetujuanPage.tsx
import React, { useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Chip,
  List,
  ListItem,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useLeaveRequests } from "../../contexts/LeaveRequestsContext";
import { useUsers } from "../../contexts/UserContext"; // Import UserContext
import { LeaveRequest, LeaveRequestType } from "../../types/leave-requests";
import FileService from "../../services/FileService";
import { format } from "date-fns";

const PersetujuanPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    leaveRequests,
    loading: leaveLoading,
    error: leaveError,
    fetchLeaveRequests,
    clearError: clearLeaveError,
  } = useLeaveRequests();
  const {
    users,
    loading: usersLoading,
    error: usersError,
    // fetchUsers,
    clearError: clearUsersError,
  } = useUsers(); // Use UserContext

  // Track the loading state for both data sources
  const loading = leaveLoading || usersLoading;
  // Combine error messages from both contexts
  const error = leaveError || usersError;

  // Pagination state
  const [page, setPage] = React.useState<number>(1);
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(leaveRequests.length / itemsPerPage));

  const paginatedRequests = React.useMemo(() => {
    return leaveRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [leaveRequests, page]);

  // Format dates for display
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd MMMM yyyy");
  };

  useEffect(() => {
    // Fetch leave requests and users when component mounts
    fetchLeaveRequests();
    // fetchUsers();
  }, []);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleDetail = (guid: string) => {
    navigate(`/persetujuan-detail/${guid}`);
  };

  // Function to get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((user) => user.guid === userId);
    return user ? user.fullName : "Nama tidak tersedia";
  };

  // Function to get user name by ID
  const getUserNIP = (userId: string) => {
    const user = users.find((user) => user.guid === userId);
    return user ? user.nip : "NIP tidak tersedia";
  };

  // Get status color based on leave request type
  const getStatusColor = (type: LeaveRequestType) => {
    switch (type) {
      case LeaveRequestType.LEAVE:
        return "primary.main"; // Blue for Cuti
      // case LeaveRequestType.WFH:
      //   return "success.main"; // Green for Work From Home
      case LeaveRequestType.DL:
        return "#F44336"; // Red for Dinas Luar
      case LeaveRequestType.SICK:
        return "#FFC107"; // Yellow/Amber for Work From Anywhere
      default:
        return "primary.main"; // Default blue
    }
  };

  // Convert LeaveRequestType to display text
  const getTypeLabel = (type: LeaveRequestType) => {
    switch (type) {
      case LeaveRequestType.LEAVE:
        return "Cuti";
      case LeaveRequestType.SICK:
        return "Sakit";
      // case LeaveRequestType.WFH:
      //   return "WFH";
      case LeaveRequestType.DL:
        return "DL";
      // case LeaveRequestType.WFA:
      //   return "WFA";
      default:
        return type;
    }
  };

  // Get initial for avatar
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // Clear errors from both contexts
  const handleClearError = () => {
    clearLeaveError();
    clearUsersError();
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
            Persetujuan
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : leaveRequests.length === 0 ? (
          <Paper
            elevation={1}
            sx={{
              p: 3,
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="body1">
              Tidak ada permohonan yang perlu disetujui saat ini.
            </Typography>
          </Paper>
        ) : (
          <List sx={{ p: 0 }}>
            {paginatedRequests.map((request: LeaveRequest) => {
              // Get user name from users array
              const userName = request.userName;
              const nip = request.nip;

              return (
                <Paper
                  onClick={() => handleDetail(request.guid)}
                  key={request.guid}
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    overflow: "hidden",
                    cursor: "pointer",
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "box-shadow .18s ease, transform .12s ease",
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(16,24,40,0.06)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <ListItem
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {
                        (() => {
                          const rawProfile = (request as any).ProfileImageUrl ?? (request as any).profileImageUrl ?? null;
                          let src: string | undefined;
                          if (rawProfile && String(rawProfile).trim()) {
                            const raw = String(rawProfile).trim();
                            const isHttp = /^https?:\/\//i.test(raw);
                            src = isHttp ? raw : FileService.getFileViewUrl(raw);
                            // cache-bust param to avoid stale images when updated
                            src = src ? `${src}?t=${Date.now()}` : undefined;
                          }

                          return (
                            <Avatar
                              src={src || undefined}
                              sx={{
                                width: 44,
                                height: 44,
                                bgcolor: "#ff7043",
                                fontWeight: 700,
                              }}
                              imgProps={{
                                style: {
                                  objectFit: "cover",
                                  objectPosition: "center 20%",
                                },
                                referrerPolicy: "no-referrer",
                              }}
                            >
                            </Avatar>
                          );
                        })()
                      }

                      <Box sx={{ ml: 2 }}> 
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: 0.2 }}>
                          {userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {nip}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {formatDate(request.startDate)} — {formatDate(request.endDate)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Chip
                        label={getTypeLabel(request.type)}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: getStatusColor(request.type),
                          borderColor: getStatusColor(request.type),
                          borderRadius: 2,
                          fontWeight: 700,
                          minWidth: 64,
                        }}
                      />
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
        
      </Container>

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default PersetujuanPage;

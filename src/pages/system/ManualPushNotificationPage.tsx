import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import LanguageIcon from "@mui/icons-material/Language";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from "../../contexts/AuthContext";
import { usePush } from "../../contexts/PushContext";
import { UserRole } from "../../types/enums";

const PRESET_TOKENS = [
  {
    label: "Trigger HP",
    token:
      "d3iPtlqcxwwxpobn7opQ8Y:APA91bGeaXoHybkTUBcCUoi_EQ6adWU-wGC4rxnY_IV4Jv3I_1N6fecKhSYxIjuP2ox4wLTy3Kp3x6kxgTZGe9ZT11W2m0zJrHQDC85AGSLh9omEAe1HyRw",
    icon: <SmartphoneIcon />,
  },
  {
    label: "Trigger Chrome",
    token:
      "eEW2nT7mb68c0MfzKHBpMx:APA91bGh2OvDkmaOpVjUUIw2sbAiztAb6OwCfD9uei157XHVkiQhFKZ1TxBU8-3sNyGqk4YH7FoaWRMSnQHON1MZONx7P8Rb5dd9tvaubCNR2jM4dlBti94",
    icon: <LanguageIcon />,
  },
  {
    label: "Trigger Edge",
    token:
      "flzC3TwZmcwrANz9eT3ddb:APA91bFthklI5I-WIUqpcHSn4_3tH21pQZlFU-eSK46lAoA_C7R7h7WO2OrqcmLr79Q_GW50Nq2pV2ZjgTfwNaIIfj0VrBLAqvC1Siu-URERf7vrvKve1RI",
    icon: <NotificationsActiveIcon />,
  },
] as const;

const ManualPushNotificationPage: React.FC = () => {
  const { user } = useAuth();
  const { triggerTestPush, loading, error, clearError } = usePush();

  const [manualToken, setManualToken] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const handleTriggerPush = async (token: string, label: string) => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      clearError();
      setSuccessMessage(null);
      return;
    }

    setActiveToken(trimmedToken);
    setSuccessMessage(null);
    clearError();

    try {
      await triggerTestPush({ token: trimmedToken });
      setSuccessMessage(`${label} berhasil dikirim.`);
    } finally {
      setActiveToken(null);
    }
  };

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
          Manual Push Notification
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
        <Stack spacing={2}>
          {(error || successMessage) && (
            <Box>
              {error && (
                <Alert severity="error" onClose={clearError}>
                  {error}
                </Alert>
              )}
              {successMessage && (
                <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                  {successMessage}
                </Alert>
              )}
            </Box>
          )}

          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Trigger Manual
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Endpoint yang dipakai adalah POST push/test dengan query param token.
                </Typography>
              </Box>

              <TextField
                label="FCM Token"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Tempel token FCM di sini"
                multiline
                minRows={4}
                fullWidth
              />

              <Box>
                <Button
                  variant="contained"
                  startIcon={loading && activeToken === manualToken.trim() ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  onClick={() => handleTriggerPush(manualToken, "Push manual")}
                  disabled={loading || !manualToken.trim()}
                >
                  Kirim Manual Push
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Trigger Cepat
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Tombol di bawah memakai token hardcode untuk perangkat yang diminta.
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                {PRESET_TOKENS.map((preset) => {
                  const isSubmitting = loading && activeToken === preset.token;

                  return (
                    <Button
                      key={preset.label}
                      variant="outlined"
                      color="primary"
                      startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : preset.icon}
                      onClick={() => handleTriggerPush(preset.token, preset.label)}
                      disabled={loading}
                      sx={{ justifyContent: "flex-start", py: 1.2 }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default ManualPushNotificationPage;
import React, { useEffect, useMemo, useState } from "react";
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
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem } from "../../contexts/SystemContext";
import { UserRole } from "../../types/enums";

const GeneralSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    generalSettings,
    generalSettingsLoading,
    fetchGeneralSettings,
    updateGeneralSetting,
    error,
    clearError,
  } = useSystem();

  const [search, setSearch] = useState("");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      void fetchGeneralSettings();
    }
  }, [fetchGeneralSettings, user?.role]);

  useEffect(() => {
    if (!generalSettings) return;

    setDraftValues((prev) => {
      const next = { ...prev };
      generalSettings.forEach((item) => {
        next[item.key] = prev[item.key] ?? item.value ?? "";
      });
      return next;
    });
  }, [generalSettings]);

  const filteredSettings = useMemo(() => {
    const items = generalSettings || [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) return items;

    return items.filter((item) => {
      const haystack = [item.key, item.description || "", item.value]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [generalSettings, search]);

  const handleChangeDraft = (key: string, value: string) => {
    setDraftValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = (key: string, value: string) => {
    setDraftValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key: string) => {
    const nextValue = (draftValues[key] ?? "").trim();
    setSavingKey(key);
    setSuccessMessage(null);
    clearError();

    try {
      await updateGeneralSetting(key, nextValue);
      setSuccessMessage(`Setting ${key} berhasil diperbarui.`);
    } finally {
      setSavingKey(null);
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
          General Setting
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
              <TextField
                label="Cari setting"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari key, deskripsi, atau value"
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => void fetchGeneralSettings()}
                disabled={generalSettingsLoading}
              >
                Refresh
              </Button>
            </Stack>
          </Paper>

          {generalSettingsLoading && (!generalSettings || generalSettings.length === 0) ? (
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredSettings.map((item) => {
                const draftValue = draftValues[item.key] ?? item.value ?? "";
                const hasChanged = draftValue !== (item.value ?? "");
                const isSaving = savingKey === item.key;
                const shouldUseMultiline = draftValue.length > 40 || draftValue.includes(",");

                return (
                  <Paper key={item.id || item.key} sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {item.key}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {item.description}
                          </Typography>
                        )}
                      </Box>

                      <TextField
                        label="Value"
                        value={draftValue}
                        onChange={(event) => handleChangeDraft(item.key, event.target.value)}
                        fullWidth
                        multiline={shouldUseMultiline}
                        minRows={shouldUseMultiline ? 3 : 1}
                      />

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button
                          variant="contained"
                          startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                          onClick={() => void handleSave(item.key)}
                          disabled={!hasChanged || !!savingKey}
                        >
                          Simpan
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          startIcon={<RestartAltIcon />}
                          onClick={() => handleReset(item.key, item.value ?? "")}
                          disabled={!hasChanged || !!savingKey}
                        >
                          Reset
                        </Button>
                      </Stack>

                      {item.updatedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Update terakhir: {new Date(item.updatedAt).toLocaleString("id-ID")}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                );
              })}

              {filteredSettings.length === 0 && (
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Tidak ada setting yang cocok dengan pencarian.
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default GeneralSettingsPage;
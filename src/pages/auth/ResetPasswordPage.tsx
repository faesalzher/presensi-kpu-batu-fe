import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  CssBaseline,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import { supabase } from "../../lib/supabase";
import bg from "../../assets/images/bg.png";
import loginSvg from "../../assets/images/login-logo.png";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 🔐 Pastikan halaman ini hanya dibuka via recovery flow
  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setError("Link reset password tidak valid atau sudah kedaluwarsa.");
      }
    };

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess("Password berhasil diubah. Silakan login kembali.");

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/", { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "20% center",
      }}
    >
      <CssBaseline />

      <Container
        maxWidth="sm"
        component={Paper}
        sx={{
          p: 4,
          borderRadius: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box
            component="img"
            src={loginSvg}
            alt="Reset Password"
            sx={{ width: 120, mb: 2 }}
          />

          <Typography variant="h6" fontWeight={600} mb={1}>
            Reset Password
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={3}
          >
            Masukkan password baru untuk akun Anda.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Password Baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, bgcolor: "#f9f9f9", borderRadius: 2 }}
            required
          />

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Konfirmasi Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 3, bgcolor: "#f9f9f9", borderRadius: 2 }}
            required
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 6,
              textTransform: "none",
            }}
          >
            {loading ? "Saving..." : "Reset Password"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;

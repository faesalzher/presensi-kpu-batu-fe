import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  InputAdornment,
  CssBaseline,
  Paper,
  Alert,
  useMediaQuery,
  Theme,
} from "@mui/material";
import { Email } from "@mui/icons-material";
import { supabase } from "../../lib/supabase";
import loginSvg from "../../assets/images/login-logo.png";
import bg from "../../assets/images/bg.png";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(
        "Link reset password sudah dikirim ke email Anda. Silakan cek inbox."
      );
    } catch (err: any) {
      setError(err.message || "Gagal mengirim reset password.");
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
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { md: 6 },
        }}
      >
        <Box
          sx={{
            mb: { xs: 4, md: 0 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: { md: "1" },
          }}        >

          <Box
            component="img"
            src={loginSvg}
            alt="Login Illustration"
            sx={{
              width: { xs: "30%", sm: "20%", md: "30%" },
              maxWidth: { xs: 320, md: 320 },
              height: "auto",
              mt: 8,
              mb: 4,
            }}
          />
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontSize: {
                xs: '1rem',
                sm: '2rem',
                md: '1rem',
              },
            }}
          >
            PRESENSI
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontSize: {
                xs: '1rem',
                sm: '2rem',
                md: '1rem',
              },
            }}
          >
            KOMISI PEMILIHAN UMUM
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontSize: {
                xs: '1rem',
                sm: '2rem',
                md: '1rem',
              },
            }}
          >
            KOTA BATU
          </Typography>
        </Box>  

        {/* Form */}
        <Container
          ref={formRef}
          component={Paper}
          maxWidth={isDesktop ? "sm" : "xs"}
          sx={{
            p: 4,
            borderRadius: 4,
            width: { xs: "100%", md: 400 },
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            textAlign="center"
            mb={1}
          >
            Forgot Password
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={3}
          >
            Masukkan email akun Anda untuk menerima link reset password.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} mt={2}>
            <TextField
              fullWidth
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                bgcolor: "#f9f9f9",
                borderRadius: 2,
              }}
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
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{ mt: 2, textTransform: "none" }}
              onClick={() => navigate("/")}
            >
              Back to Login
            </Button>
          </Box>
        </Container>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;

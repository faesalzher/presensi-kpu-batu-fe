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
  useMediaQuery,
  Theme,
  Alert,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  AccountCircle,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import loginSvg from "../../assets/images/login-logo.png";
import bg from '../../assets/images/bg.png'

// Define types for login
interface LoginCredentials {
  email: string;
  password: string;
  keepLoggedIn: boolean;
}

const LoginPage: React.FC = () => {
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("md"));
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();

  // Ref for form container to scroll to it on mobile
  const formRef = useRef<HTMLDivElement>(null);

  // State for form inputs
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
    keepLoggedIn: false
  });

  // State for error handling
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // State for password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);



  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password visibility toggle
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle input focus on mobile - scroll to form
  const handleInputFocus = () => {
    if (isMobile && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use the login function from AuthContext
      await login(credentials.email, credentials.password, credentials.keepLoggedIn);

      // Default for "staf" or any other role
      navigate("/dashboard");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',

        // FULLSCREEN BACKGROUND
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: '20% center',
        backgroundRepeat: 'no-repeat',
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
          height: "100%",
        }}
      >
        {/* Logo and illustration section */}
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

        {/* Login form container */}
        <Container
          ref={formRef}
          component={Paper}
          maxWidth={isDesktop ? "sm" : "xs"}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            borderBottomLeftRadius: { xs: 15, md: 15 },
            borderBottomRightRadius: { xs: 15, md: 15 },
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: { xs: "calc(100% - 10px)", md: "400px" },
            flex: { md: "1" },
            height: { xs: "auto", md: "auto" },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Email input */}
            <TextField
              fullWidth
              name="email"
              placeholder="Email"
              variant="outlined"
              value={credentials.email}
              onChange={handleChange}
              onFocus={handleInputFocus}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "#f9f9f9",
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Password input */}
            <TextField
              fullWidth
              name="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              value={credentials.password}
              onChange={handleChange}
              onFocus={handleInputFocus}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      sx={{
                        color: "#666",
                        "&:hover": {
                          color: "primary.main",
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "#f9f9f9",
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Forgot password link */}
            <div>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={credentials.keepLoggedIn}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        keepLoggedIn: e.target.checked,
                      }))
                    }
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ userSelect: "none" }}
                  >
                    Keep me logged in
                  </Typography>
                }
                sx={{
                  alignItems: "center",
                }}
              />
              <Typography
                variant="body2"
                align="left"
                sx={{
                  color: "#666",
                  cursor: "pointer",
                }}
                onClick={handleForgotPassword}
              >
                Forget Password?
              </Typography>

            </div>

            {/* Login button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || authLoading}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                bgcolor: "primary.main",
                borderRadius: 6,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              {loading || authLoading ? "Logging in..." : "Login"}
            </Button>
          </Box>
        </Container>
      </Container>
    </Box>
  );
};

export default LoginPage;

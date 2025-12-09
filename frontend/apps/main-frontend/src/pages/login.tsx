import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { Email, Lock } from "@mui/icons-material";
import { api } from '@shared/services/api/apiInstance'
import { authStore } from '@shared/services/stores/auth'
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const Auth = authStore()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      api.post('auth/login', {email, password}, (status: number, data: any, message:string, response:any) => {
        if(status === 200) auth(response.data.token)
      }, 'identity')
    } catch (err: any) {
      console.error("Login exception:", err);
      setError(
        err?.message ||
          "Terjadi kesalahan saat login. Pastikan backend berjalan dan endpoint benar.",
      );
    } finally {
      setLoading(false);
    }
  };

  const auth = async (token: string) => {
    if (!token) return;
    setSuccess(true);
    Auth.setTokenInfo(token);    // simpan token di store
    await checkAuth();           // update user state di AuthProvider
    navigate("/dashboard");      // baru redirect
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 2,
          width: "100%",
          background: "linear-gradient(145deg, #f5f7ff 0%, #ffffff 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <img
            src="/unais.png"
            alt="Unais MiniERP Logo"
            style={{
              height: 60,
              width: "auto",
              marginBottom: 16,
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Silakan masuk ke akun Anda
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Login berhasil! Mengarahkan ke dashboard...
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Alamat Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Kata Sandi"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 1,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: "#1976d2",
              "&:hover": {
                backgroundColor: "#1565c0",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
              },
              transition: "all 0.3s ease",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "MASUK"}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2, fontSize: "0.75rem" }}
        >
          v1.0 - Unais MiniERP System
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;

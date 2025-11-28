import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Paper, TextField, Button, Alert, CircularProgress } from "@mui/material";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.data.email);
        navigate("/dashboard");
      } else {
        setError(data.message || "Login gagal");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                margin: "0 auto 16px",
                borderRadius: 2,
                background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              U
            </Box>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 700, color: "#1F2937" }}>
              miniERP Identity
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6B7280" }}>
              User Management System
            </p>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              size="small"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  "&.Mui-focused fieldset": {
                    borderColor: "#667EEA",
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              size="small"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  "&.Mui-focused fieldset": {
                    borderColor: "#667EEA",
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 600,
                py: 1.2,
                "&:hover": {
                  background: "linear-gradient(135deg, #5568D3 0%, #6A3F8F 100%)",
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>
              Demo Credentials:
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6B7280" }}>
              Email: admin@example.com | Password: password123
            </p>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

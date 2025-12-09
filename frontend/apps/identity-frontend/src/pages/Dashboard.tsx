import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  CircularProgress,
  Stack,
  Paper,
  Alert,
  Badge,
} from "@mui/material";
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Today as TodayIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  NotificationsActive as NotificationIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../config";

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6" color="text.secondary">
            Memuat data...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Hero Header */}
          <Paper
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #06103A 0%, #4E88BE 100%)",
              color: "white",
              p: 4,
              mb: 4,
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(6, 16, 58, 0.15)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: "200px",
                height: "200px",
                background: "rgba(200, 168, 112, 0.1)",
                borderRadius: "50%",
                transform: "translate(60px, -100px)",
              },
            }}
          >
            <Box position="relative" zIndex={1}>
              <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
                Dashboard CRM ✨
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Selamat datang di sistem miniERP
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <TodayIcon fontSize="small" />
                <Typography variant="body1">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default HomePage;

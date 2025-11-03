import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";

const StatCard: React.FC<{ title: string; value: string; subtitle?: string; color?: string }> = ({ title, value, subtitle, color }) => {
  const theme = useTheme();
  const accent = color || theme.palette.primary.main;

  return (
    <Paper sx={{ p: 0, borderRadius: 2, minWidth: 200, flex: 1, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" }}>
      <Box sx={{ height: 8, background: accent, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default StatCard;

import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  minHeight?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = 40,
  minHeight = "400px",
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight,
        gap: 2,
      }}
    >
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: "primary.main",
          "& .MuiCircularProgress-circle": {
            strokeLinecap: "round",
          },
        }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: "0.875rem", fontWeight: 500 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
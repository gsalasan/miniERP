import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6 }}>
    <CircularProgress />
    <Typography sx={{ mt: 2 }} variant="body2">
      {message}
    </Typography>
  </Box>
);

export default LoadingSpinner;
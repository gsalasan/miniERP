import React from "react";
import { Box, Typography, Button } from "@mui/material";

const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title = "No data", description = "No items found.", actionText, onAction }) => (
  <Box sx={{ textAlign: "center", py: 8 }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      {description}
    </Typography>
    {actionText && (
      <Button variant="contained" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </Box>
);

export default EmptyState;

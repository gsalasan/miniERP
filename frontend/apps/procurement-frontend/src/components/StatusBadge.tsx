import React from "react";
import { Chip } from "@mui/material";

const StatusBadge: React.FC<{ preferred?: boolean }> = ({ preferred }) => {
  if (preferred) return <Chip label="Preferred" color="success" size="small" />;
  return <Chip label="Normal" color="default" size="small" />;
};

export default StatusBadge;
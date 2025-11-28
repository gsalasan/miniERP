import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import {
  LocalOffer as PriceIcon,
  TrendingUp as MarkupIcon,
  ShoppingCart as ItemsIcon,
} from "@mui/icons-material";
import { PricingSummary } from "../../types/estimation";

interface PricingSummaryCardProps {
  pricingSummary: PricingSummary;
}

export const PricingSummaryCard: React.FC<PricingSummaryCardProps> = ({ pricingSummary }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const markupColor =
    pricingSummary.average_markup_percentage >= 30
      ? "success.main"
      : pricingSummary.average_markup_percentage >= 20
        ? "primary.main"
        : pricingSummary.average_markup_percentage >= 15
          ? "warning.main"
          : "error.main";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <PriceIcon sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight="700" color="primary.dark">
          Ringkasan Pricing
        </Typography>
        <Chip
          label="PricingEngine"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: "auto", fontSize: "0.65rem" }}
        />
      </Box>

      {/* Compact Stats */}
      <Box display="flex" gap={1.5} mb={2}>
        <Chip
          icon={<ItemsIcon sx={{ fontSize: 16 }} />}
          label={`${pricingSummary.total_items} items`}
          color="info"
          variant="outlined"
        />
        <Chip
          icon={<MarkupIcon sx={{ fontSize: 16 }} />}
          label={`Avg Markup: ${formatPercentage(pricingSummary.average_markup_percentage)}`}
          sx={{
            bgcolor: markupColor,
            color: "white",
            "& .MuiChip-icon": { color: "white" },
          }}
        />
      </Box>

      {/* Financial Breakdown - Compact Version */}
      <Box>
        <Box display="flex" justifyContent="space-between" py={1}>
          <Typography variant="body2" color="text.secondary">
            Total HPP
          </Typography>
          <Typography variant="body2" fontWeight="600">
            {formatCurrency(pricingSummary.total_hpp)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" py={1}>
          <Typography variant="body2" color="text.secondary">
            Total Markup
          </Typography>
          <Typography variant="body2" fontWeight="600" color="success.main">
            + {formatCurrency(pricingSummary.total_markup)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box display="flex" justifyContent="space-between" py={1}>
          <Typography variant="body1" fontWeight="700" color="text.primary">
            Total Sell Price
          </Typography>
          <Typography variant="body1" fontWeight="700" color="primary.main">
            {formatCurrency(pricingSummary.total_sell_price)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

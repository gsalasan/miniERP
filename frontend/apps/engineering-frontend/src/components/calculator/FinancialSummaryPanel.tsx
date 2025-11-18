import React from "react";
import { Card, CardContent, Typography, Box, Divider, Chip, LinearProgress } from "@mui/material";
import { FinancialSummary } from "../../types/estimation";
import { TrendingUp, AccountBalance, ShowChart } from "@mui/icons-material";

interface FinancialSummaryPanelProps {
  summary: FinancialSummary;
  loading?: boolean;
}

export const FinancialSummaryPanel: React.FC<FinancialSummaryPanelProps> = ({
  summary,
  loading = false,
}) => {
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

  const SummaryRow = ({
    label,
    value,
    bold = false,
    large = false,
  }: {
    label: string;
    value: string | number;
    bold?: boolean;
    large?: boolean;
  }) => (
    <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
      <Typography
        variant={large ? "body1" : "body2"}
        color="text.secondary"
        fontWeight={bold ? 600 : 400}
      >
        {label}
      </Typography>
      <Typography
        variant={large ? "h6" : "body2"}
        fontWeight={bold ? 700 : 600}
        color="text.primary"
      >
        {typeof value === "number" ? formatCurrency(value) : value}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Card
        sx={{
          position: "sticky",
          top: 80,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="700" mb={3} color="primary.main">
            Ringkasan Finansial
          </Typography>
          <Box textAlign="center" py={6}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Menghitung estimasi...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const marginHealth =
    summary.estimasi_net_margin_pct >= 15
      ? { label: "Sangat Sehat", color: "success" as const }
      : summary.estimasi_net_margin_pct >= 10
        ? { label: "Sehat", color: "success" as const }
        : summary.estimasi_net_margin_pct >= 5
          ? { label: "Perlu Perbaikan", color: "warning" as const }
          : { label: "Tidak Profitable", color: "error" as const };

  return (
    <Card
      sx={{
        position: "sticky",
        top: 80,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <AccountBalance sx={{ color: "primary.main", mr: 1 }} />
          <Typography variant="h6" fontWeight="700" color="primary.main">
            Ringkasan Finansial
          </Typography>
        </Box>

        {/* HPP Section */}
        <Box mb={3} p={2} bgcolor="primary.50" borderRadius={2}>
          <Typography variant="caption" fontWeight="700" color="primary.dark" gutterBottom>
            HARGA POKOK PRODUKSI
          </Typography>
          <Box mt={1.5}>
            <SummaryRow label="HPP Langsung" value={summary.total_direct_hpp} />
            <SummaryRow label="Overhead" value={summary.overhead_allocation} />
            <Divider sx={{ my: 1 }} />
            <SummaryRow label="Total HPP" value={summary.total_estimasi_hpp} bold large />
          </Box>
        </Box>

        {/* Pricing Section */}
        <Box mb={3} p={2} bgcolor="success.50" borderRadius={2}>
          <Box display="flex" alignItems="center" mb={1}>
            <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: "success.dark" }} />
            <Typography variant="caption" fontWeight="700" color="success.dark">
              HARGA JUAL
            </Typography>
          </Box>
          <SummaryRow
            label="Harga Jual Standar"
            value={summary.total_harga_jual_standar}
            bold
            large
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Margin Analysis */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" mb={2}>
            <ShowChart sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
            <Typography variant="caption" fontWeight="700" color="text.secondary">
              ANALISIS MARGIN
            </Typography>
          </Box>

          {/* Gross Margin */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight="600">
                Gross Margin
              </Typography>
              <Chip
                label={formatPercentage(summary.estimasi_gross_margin_pct)}
                size="small"
                color={summary.estimasi_gross_margin_pct >= 20 ? "success" : "warning"}
              />
            </Box>
            <Typography variant="h6" fontWeight="700" color="success.main">
              {formatCurrency(summary.estimasi_gross_margin)}
            </Typography>
          </Box>

          {/* Net Margin */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight="600">
                Net Margin
              </Typography>
              <Chip
                label={formatPercentage(summary.estimasi_net_margin_pct)}
                size="small"
                color={summary.estimasi_net_margin_pct >= 10 ? "success" : "warning"}
              />
            </Box>
            <Typography variant="h6" fontWeight="700" color="primary.main">
              {formatCurrency(summary.estimasi_net_margin)}
            </Typography>
          </Box>
        </Box>

        {/* Health Status */}
        <Box p={2} bgcolor={`${marginHealth.color}.50`} borderRadius={2} textAlign="center">
          <Typography variant="caption" fontWeight="600" color="text.secondary" gutterBottom>
            STATUS PROFITABILITAS
          </Typography>
          <Box mt={1}>
            <Chip
              label={marginHealth.label}
              color={marginHealth.color}
              sx={{ fontWeight: 700, px: 2 }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

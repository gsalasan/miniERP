import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  AccountTree as CategoryIcon,
} from "@mui/icons-material";
import { OverheadBreakdownItem } from "../../types/estimation";

interface OverheadBreakdownTableProps {
  overheadBreakdown: OverheadBreakdownItem[];
  totalOverhead: number;
  policyApplied?: string;
}

export const OverheadBreakdownTable: React.FC<OverheadBreakdownTableProps> = ({
  overheadBreakdown,
  totalOverhead,
  policyApplied,
}) => {
  const [expanded, setExpanded] = useState(false);

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

  // Group categories for better visualization
  const categoryGroups = {
    gaji: overheadBreakdown.filter((item) => item.category.includes("GAJI")),
    operasional: overheadBreakdown.filter(
      (item) =>
        item.category.includes("SEWA") ||
        item.category.includes("LISTRIK") ||
        item.category.includes("AIR") ||
        item.category.includes("INTERNET"),
    ),
    perawatan: overheadBreakdown.filter(
      (item) => item.category.includes("PERAWATAN") || item.category.includes("PERBAIKAN"),
    ),
    adminUmum: overheadBreakdown.filter(
      (item) =>
        item.category.includes("ATK") ||
        item.category.includes("KONSUMSI") ||
        item.category.includes("KEBERSIHAN") ||
        item.category.includes("KEAMANAN"),
    ),
    depresiasi: overheadBreakdown.filter((item) => item.category.includes("DEPRESIASI")),
    lainnya: overheadBreakdown.filter(
      (item) =>
        item.category.includes("ASURANSI") ||
        item.category.includes("PERJALANAN") ||
        item.category.includes("TRAINING") ||
        item.category.includes("LISENSI") ||
        item.category.includes("MARKETING") ||
        item.category.includes("LAIN_LAIN"),
    ),
  };

  const CategoryGroupRow = ({
    groupName,
    items,
  }: {
    groupName: string;
    items: OverheadBreakdownItem[];
  }) => {
    if (items.length === 0) return null;

    const groupTotal = items.reduce((sum, item) => sum + item.allocated_amount, 0);

    return (
      <>
        <TableRow sx={{ bgcolor: "grey.100" }}>
          <TableCell colSpan={4}>
            <Typography variant="subtitle2" fontWeight="700" color="primary.dark">
              {groupName}
            </Typography>
          </TableCell>
        </TableRow>
        {items.map((item) => (
          <TableRow key={item.category} hover>
            <TableCell sx={{ pl: 4 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">{item.category.replace(/_/g, " ")}</Typography>
                <Tooltip title={item.description} arrow>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <InfoIcon fontSize="small" sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="600">
                {formatPercentage(item.allocation_percentage_to_hpp)}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2">{formatCurrency(item.allocated_amount)}</Typography>
            </TableCell>
            <TableCell align="right">
              <Chip
                label={formatPercentage((item.allocated_amount / totalOverhead) * 100)}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        "&:before": { display: "none" },
        boxShadow: "none",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: "primary.50",
          "&:hover": { bgcolor: "primary.100" },
          minHeight: 48,
          "& .MuiAccordionSummary-content": { my: 1 },
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="body2" fontWeight="700" color="primary.dark">
              Detail Alokasi Overhead
            </Typography>
            <Chip
              label={`${overheadBreakdown.length} kategori`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          {policyApplied && (
            <Chip
              label={policyApplied}
              size="small"
              color="info"
              variant="filled"
              sx={{ mr: 2, fontSize: "0.7rem" }}
            />
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell>
                  <Typography variant="caption" fontWeight="700">
                    Kategori
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption" fontWeight="700">
                    % terhadap HPP
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption" fontWeight="700">
                    Alokasi
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption" fontWeight="700">
                    % dari Total
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <CategoryGroupRow groupName="💼 Gaji & Kompensasi" items={categoryGroups.gaji} />
              <CategoryGroupRow
                groupName="🏢 Operasional Fasilitas"
                items={categoryGroups.operasional}
              />
              <CategoryGroupRow
                groupName="🔧 Perawatan & Perbaikan"
                items={categoryGroups.perawatan}
              />
              <CategoryGroupRow
                groupName="📋 Administrasi & Umum"
                items={categoryGroups.adminUmum}
              />
              <CategoryGroupRow groupName="📉 Depresiasi Aset" items={categoryGroups.depresiasi} />
              <CategoryGroupRow groupName="🔄 Lain-lain" items={categoryGroups.lainnya} />

              {/* Total Row */}
              <TableRow sx={{ bgcolor: "primary.100", borderTop: "2px solid", borderColor: "primary.main" }}>
                <TableCell>
                  <Typography variant="body2" fontWeight="700" color="primary.dark">
                    TOTAL OVERHEAD
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="700">
                    {formatPercentage(
                      overheadBreakdown.reduce(
                        (sum, item) => sum + item.allocation_percentage_to_hpp,
                        0,
                      ),
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="700" color="primary.dark">
                    {formatCurrency(totalOverhead)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip label="100%" size="small" color="primary" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};

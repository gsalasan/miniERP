import React from 'react';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';

interface VendorRow {
  vendorName: string;
  ratingAvg: number;
  jumlahProyek: number;
}

interface Props {
  rows: VendorRow[];
}

const VendorPerformanceTable: React.FC<Props> = ({ rows }) => {
  const safeRows = rows || [];

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Kinerja Vendor / Freelancer</Typography>

      {safeRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No vendor performance data</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Rating Avg</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Jumlah Proyek</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{r.vendorName}</TableCell>
                <TableCell align="right">{Number(r.ratingAvg || 0).toFixed(2)}</TableCell>
                <TableCell align="right">{r.jumlahProyek ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default VendorPerformanceTable;

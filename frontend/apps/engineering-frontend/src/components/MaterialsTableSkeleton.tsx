import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Box,
} from "@mui/material";

interface MaterialsTableSkeletonProps {
  rows?: number;
}

const MaterialsTableSkeleton: React.FC<MaterialsTableSkeletonProps> = ({ rows = 5 }) => {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Item Details</TableCell>
            <TableCell>SBU / System</TableCell>
            <TableCell>Brand / Vendor</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            <TableCell align="right">Cost (RP)</TableCell>
            <TableCell>Components</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index} hover>
              <TableCell>
                <Box>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="text" width="40%" height={16} />
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Skeleton variant="text" width="70%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="70%" height={16} />
                </Box>
              </TableCell>
              <TableCell>
                <Skeleton variant="rounded" width={80} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rounded" width={70} height={24} />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ textAlign: "right" }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                </Box>
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width="90%" height={16} />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MaterialsTableSkeleton;

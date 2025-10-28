import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Skeleton,
} from "@mui/material";

interface ServicesTableSkeletonProps {
  rows?: number;
}

const ServicesTableSkeleton: React.FC<ServicesTableSkeletonProps> = ({ rows = 10 }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Service Name</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Provider</TableCell>
          <TableCell>System</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Cost (IDR)</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from(new Array(rows)).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={80} height={24} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="70%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={70} height={24} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="50%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="circular" width={32} height={32} sx={{ display: "inline-block", mr: 1 }} />
              <Skeleton variant="circular" width={32} height={32} sx={{ display: "inline-block", mr: 1 }} />
              <Skeleton variant="circular" width={32} height={32} sx={{ display: "inline-block" }} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ServicesTableSkeleton;
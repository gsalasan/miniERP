import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Skeleton } from "@mui/material";

interface ServicesTableSkeletonProps {
  rows?: number;
}

const ServicesTableSkeleton: React.FC<ServicesTableSkeletonProps> = ({ rows = 10 }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Kode Layanan</TableCell>
          <TableCell>Nama Layanan</TableCell>
          <TableCell>Kategori</TableCell>
          <TableCell>Unit</TableCell>
          <TableCell align="right">Biaya Internal</TableCell>
          <TableCell align="right">Biaya Freelance</TableCell>
          <TableCell align="center">Status</TableCell>
          <TableCell align="center">Aksi</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from(new Array(rows)).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton variant="text" width="60%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="80%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="50%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="rounded" width={40} height={24} />
            </TableCell>
            <TableCell align="right">
              <Skeleton variant="text" width="70%" />
            </TableCell>
            <TableCell align="right">
              <Skeleton variant="text" width="70%" />
            </TableCell>
            <TableCell align="center">
              <Skeleton variant="rounded" width={60} height={24} />
            </TableCell>
            <TableCell align="center">
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ display: "inline-block", mr: 1 }}
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ display: "inline-block", mr: 1 }}
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ display: "inline-block" }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ServicesTableSkeleton;

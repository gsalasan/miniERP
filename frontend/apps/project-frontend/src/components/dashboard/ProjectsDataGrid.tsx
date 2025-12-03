import React from 'react';
import { DataGrid, GridColDef, GridRowParams, GridToolbar } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface ProjectRow {
  id: string;
  project_name: string;
  pm_user?: { employee?: { full_name?: string }; email?: string } | null;
  customer?: { customer_name?: string } | null;
  progress?: number;
  margin?: number;
  budgetStatus?: string;
  timelineStatus?: string;
}

interface Props {
  rows: ProjectRow[];
}

const ProjectsDataGrid: React.FC<Props> = ({ rows }) => {
  const navigate = useNavigate();
  // Ensure rows is a safe array and each row has an `id` required by DataGrid
  const safeRows = (rows || []).filter(Boolean).map((r, i) => ({
    ...r,
    id: (r as any).id ?? (r as any).project_id ?? (r as any).projectId ?? `row-${i}`,
  }));

  const columns: GridColDef[] = [
    { field: 'project_name', headerName: 'Nama Proyek', flex: 1, minWidth: 200 },
    {
      field: 'pm',
      headerName: 'PM',
      width: 180,
        valueGetter: (params) => {
          const row = params?.row || {};
          // Try common shapes for PM
          const pm = row.pm_user || row.project_manager || row.pm || null;
          if (pm && typeof pm === 'object') return pm.employee?.full_name || pm.full_name || pm.name || pm.email || 'Belum ditugaskan';
          // Try separate fields
          const pmName = row.pm_name || row.pm_full_name || row.project_manager_name || row.manager_name || row.owner_name || row.owner;
          const pmEmail = row.pm_email || row.project_manager_email || row.owner_email;
          if (pmName) return pmName;
          if (pmEmail) return pmEmail;
          return 'Belum ditugaskan';
        },
    },
    {
      field: 'customer',
      headerName: 'Pelanggan',
      width: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        const c = row.customer || row.client || null;
        if (c) {
          if (typeof c === 'string') return c;
          return c.customer_name || c.company_name || c.name || '-';
        }
        // Try top-level fallbacks
        return row.customer_name || row.client_name || '-';
      },
    },
    { field: 'progress', headerName: 'Progress (%)', width: 140, valueGetter: (p) => Number(p?.row?.progress || 0).toFixed(0) },
    { field: 'margin', headerName: 'Margin Aktual (%)', width: 160, valueGetter: (p) => Number(p?.row?.margin || 0).toFixed(2) },
    { field: 'budgetStatus', headerName: 'Status Anggaran', width: 140 },
    { field: 'timelineStatus', headerName: 'Status Timeline', width: 140 },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Daftar Proyek Aktif</Typography>
      <Box sx={{ height: { xs: 420, md: 520 }, width: '100%' }}>
        <DataGrid
          rows={safeRows as any}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25]}
          components={{ Toolbar: GridToolbar }}
          onRowClick={(params: GridRowParams) => navigate(`/projects/${params.id}/dashboard`)}
        />
      </Box>
    </Box>
  );
};

export default ProjectsDataGrid;

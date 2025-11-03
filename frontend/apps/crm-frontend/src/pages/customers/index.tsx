import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Alert } from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { customersApi } from "../../api/customers";
import { Customer, CustomerStatus, UpdateCustomerData } from "../../types/customer";
import { StatusBadge, LoadingSpinner, EmptyState } from "../../components";
import CustomerEditDialog from "../../components/CustomerEditDialog";

// Type declaration for window
declare global {
  interface Window {
    confirm: (message?: string) => boolean;
  }
}

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // DataGrid columns definition
  const columns: GridColDef[] = [
    {
      field: "customer_name",
      headerName: "Nama Customer",
      width: 200,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Customer, string>) => (
        <Button
          variant="text"
          sx={{ p: 0, textTransform: "none", justifyContent: "flex-start" }}
          onClick={() => navigate(`/customers/${params.row.id}`)}
        >
          {params.value}
        </Button>
      ),
    },
    {
      field: "channel",
      headerName: "Channel",
      width: 130,
      sortable: true,
    },
    {
      field: "city",
      headerName: "Kota",
      width: 130,
      sortable: true,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Customer, CustomerStatus>) => {
        const status = params.value;
        if (!status) return null;
        return <StatusBadge status={status} />;
      },
    },
    {
      field: "top_days",
      headerName: "TOP (Hari)",
      width: 100,
      sortable: true,
      type: "number",
    },
    {
      field: "credit_limit",
      headerName: "Credit Limit",
      width: 130,
      sortable: true,
      type: "number",
      valueFormatter: (value: number | null | undefined) => {
        if (value == null) return "-";
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(value);
      },
    },
    {
      field: "assigned_sales_id",
      headerName: "Sales",
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Customer, string>) => {
        return params.value || "-";
      },
    },
    {
      field: "contacts_count",
      headerName: "Jumlah Kontak",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Customer>) => {
        const customer = params.row;
        return customer.customer_contacts?.length || 0;
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Aksi",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="Detail"
          onClick={() => navigate(`/customers/${params.row.id}`)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

  // Load customers data
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customersApi.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      // eslint-disable-next-line no-console
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle update customer
  const handleUpdateCustomer = async (id: string, data: UpdateCustomerData) => {
    try {
      await customersApi.updateCustomer(id, data);
      await loadCustomers(); // Reload data after update
      setError(null); // Clear any previous errors
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengupdate customer";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error updating customer:", err);
      throw err; // Re-throw error so dialog can handle it
    }
  };

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Handle delete customer
  const handleDelete = async (customerId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus customer ini?")) {
      try {
        await customersApi.deleteCustomer(customerId);
        await loadCustomers(); // Reload data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus customer");
        // eslint-disable-next-line no-console
        console.error("Error deleting customer:", err);
      }
    }
  };

  // Handle add new customer
  const handleAdd = () => {
    navigate("/customers/new");
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Memuat data customer..." />;
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h2"
            sx={{
              mb: 1,
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700,
            }}
          >
            Customers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kelola data pelanggan dan kontak
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            minWidth: 160,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
            },
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            "& .MuiAlert-message": {
              fontSize: "0.875rem",
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Content */}
      {customers.length === 0 ? (
        <EmptyState
          title="Belum ada customer"
          description="Mulai dengan menambahkan customer pertama Anda untuk membangun database pelanggan yang kuat."
          actionText="Tambah Customer Pertama"
          onAction={handleAdd}
        />
      ) : (
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <DataGrid
            rows={customers}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight={false}
            sx={{
              minHeight: 500,
              border: "none",
              "& .MuiDataGrid-cell": {
                fontSize: "0.875rem",
                borderBottom: "1px solid #f0f0f0",
                py: 1.5,
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8f9fa",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#495057",
                borderBottom: "2px solid #e9ecef",
              },
              "& .MuiDataGrid-row": {
                "&:hover": {
                  backgroundColor: "#f8f9fa",
                },
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid #e9ecef",
                backgroundColor: "#fafafa",
              },
            }}
          />
        </Box>
      )}

      {/* Edit Dialog */}
      <CustomerEditDialog
        open={editDialogOpen}
        customer={selectedCustomer}
        onClose={handleCloseEditDialog}
        onSave={handleUpdateCustomer}
      />
    </Box>
  );
};

export default CustomersPage;
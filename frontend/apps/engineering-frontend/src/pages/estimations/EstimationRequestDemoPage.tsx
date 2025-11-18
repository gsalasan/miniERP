import React, { useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { RequestEstimationModal, EstimationRequestData } from "../../components/modals";
import { EstimationsService } from "../../api/estimationsApi";
import { useNavigate } from "react-router-dom";

/**
 * Demo Page untuk Test FITUR 3.1.D: Proses Permintaan Estimasi
 *
 * Halaman ini mensimulasikan flow Sales Person membuat permintaan estimasi
 * dari halaman Project/Opportunity
 */
export const EstimationRequestDemoPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const estimationsService = new EstimationsService();

  // Mock project data
  const mockProject = {
    id: "demo-project-001",
    name: "Proyek Pemasangan CCTV Gudang PT ABC",
    customer: "PT ABC Indonesia",
    salesPic: "Diki Setiawan", // Mock sales person name
    salesUserId: "mock-sales-user-id-123", // Mock sales user ID
  };

  const handleCreateRequest = async (data: EstimationRequestData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("📤 Sending estimation request:", data);

      const response = await estimationsService.requestEstimation(data);

      console.log("✅ Response:", response);

      setSuccess(`Permintaan estimasi berhasil dibuat! ID: ${response.data.id}`);

      // Auto navigate ke queue setelah 2 detik
      setTimeout(() => {
        navigate("/estimations/queue");
      }, 2000);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Gagal membuat permintaan estimasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Demo: Permintaan Estimasi (FITUR 3.1.D)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Halaman ini untuk testing flow Sales Person membuat permintaan estimasi baru
          </Typography>
        </Box>

        {/* Alerts */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Project Info Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informasi Proyek (Mock Data)
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  ID Proyek:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {mockProject.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nama Proyek:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {mockProject.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Customer:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {mockProject.customer}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              disabled={loading}
              size="large"
              fullWidth
            >
              Buat Permintaan Estimasi
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Instruksi Testing
            </Typography>
            <Stack spacing={1} component="ol" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                Klik tombol "Buat Permintaan Estimasi" di atas
              </Typography>
              <Typography component="li" variant="body2">
                Modal akan terbuka dengan form permintaan estimasi
              </Typography>
              <Typography component="li" variant="body2">
                Isi field "Ringkasan Kebutuhan & Brief Teknis" (required)
              </Typography>
              <Typography component="li" variant="body2">
                Opsional: Pilih Project Engineer dari dropdown
              </Typography>
              <Typography component="li" variant="body2">
                Opsional: Upload dokumen pendukung (RFQ, denah, dll)
              </Typography>
              <Typography component="li" variant="body2">
                Klik "Kirim Permintaan"
              </Typography>
              <Typography component="li" variant="body2">
                Estimasi akan dibuat dan otomatis redirect ke halaman Queue
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* API Info */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 Technical Info
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>API Endpoint:</strong> POST /api/v1/estimations
              </Typography>
              <Typography variant="body2">
                <strong>Backend Service:</strong> engineering-service (port 4001)
              </Typography>
              <Typography variant="body2">
                <strong>Request Body:</strong>
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: "grey.100",
                  p: 2,
                  borderRadius: 1,
                  overflow: "auto",
                  fontSize: "0.75rem",
                }}
              >
                {`{
  "projectId": "demo-project-001",
  "assignedToUserId": "user-uuid", // optional
  "technicalBrief": "Brief kebutuhan teknis...",
  "attachmentUrls": [
    {"name": "denah.pdf", "url": "https://..."}
  ]
}`}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔗 Quick Links
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => navigate("/estimations/queue")}>
                Lihat Queue
              </Button>
              <Button variant="outlined" onClick={() => navigate("/estimations")}>
                Lihat Semua Estimasi
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Modal */}
      <RequestEstimationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateRequest}
        projectName={mockProject.name}
        customerName={mockProject.customer}
        projectId={mockProject.id}
        salesPic={mockProject.salesPic}
        salesUserId={mockProject.salesUserId}
      />
    </Container>
  );
};

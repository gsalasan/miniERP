import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import { AssignedUser } from "../../types/estimation";

interface RequestEstimationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EstimationRequestData) => Promise<void>;
  projectName: string;
  customerName: string;
  projectId: string;
  salesPic?: string; // Nama sales person
  salesUserId?: string; // ID sales person (untuk requested_by_user_id)
}

export interface EstimationRequestData {
  projectId: string;
  assignedToUserId?: string;
  technicalBrief: string;
  attachmentUrls?: Array<{ name: string; url: string }>;
  requestedByUserId?: string; // ID sales yang buat request
  sales_pic?: string; // Legacy field
  customer_name?: string; // Legacy field
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 600 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

/**
 * FITUR 3.1.D: Modal Formulir Permintaan Estimasi
 *
 * Digunakan oleh Sales Person untuk membuat permintaan estimasi baru
 * setelah opportunity dikualifikasi dan mencapai tahap Pre-Sales
 */
export const RequestEstimationModal: React.FC<RequestEstimationModalProps> = ({
  open,
  onClose,
  onSubmit,
  projectName,
  customerName,
  projectId,
  salesPic,
  salesUserId,
}) => {
  const [technicalBrief, setTechnicalBrief] = useState("");
  const [selectedPE, setSelectedPE] = useState<AssignedUser | null>(null);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Mock data PE - TODO: Replace with real API call to Identity Service
  const projectEngineers: AssignedUser[] = [
    {
      id: "user-1",
      email: "hafizh@example.com",
      employee: { id: "emp-1", full_name: "Hafizh" },
    },
    {
      id: "user-2",
      email: "budi@example.com",
      employee: { id: "emp-2", full_name: "Budi Santoso" },
    },
    {
      id: "user-3",
      email: "siti@example.com",
      employee: { id: "emp-3", full_name: "Siti Aminah" },
    },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setError(null);

    try {
      // TODO: Implement real file upload to storage (S3, GCS, etc.)
      // For now, just mock the upload
      const newAttachments = Array.from(files).map((file) => ({
        name: file.name,
        url: `https://storage.example.com/estimations/${projectId}/${file.name}`, // Mock URL
      }));

      setAttachments([...attachments, ...newAttachments]);

      // Reset input
      event.target.value = "";
    } catch (err) {
      setError("Gagal mengunggah file. Silakan coba lagi.");
      console.error("File upload error:", err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validasi
    if (!technicalBrief.trim()) {
      setError("Ringkasan Kebutuhan & Brief Teknis wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData: EstimationRequestData = {
        projectId,
        assignedToUserId: selectedPE?.id,
        technicalBrief: technicalBrief.trim(),
        attachmentUrls: attachments.length > 0 ? attachments : undefined,
        requestedByUserId: salesUserId, // ID sales dari props
        sales_pic: salesPic, // Legacy field
        customer_name: customerName, // Legacy field
      };

      await onSubmit(requestData);

      // Reset form
      setTechnicalBrief("");
      setSelectedPE(null);
      setAttachments([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim permintaan.");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTechnicalBrief("");
      setSelectedPE(null);
      setAttachments([]);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="request-estimation-modal-title">
      <Box sx={modalStyle}>
        <Typography
          id="request-estimation-modal-title"
          variant="h5"
          component="h2"
          gutterBottom
          fontWeight="bold"
        >
          Formulir Permintaan Estimasi
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 3 }}>
          {/* Project Info */}
          <Box>
            <Typography variant="body1" color="text.secondary">
              <strong>Proyek:</strong> {projectName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              <strong>Pelanggan:</strong> {customerName}
            </Typography>
          </Box>

          {/* Assign PE (Optional) */}
          <Autocomplete
            options={projectEngineers}
            getOptionLabel={(option) => option.employee?.full_name || option.email}
            value={selectedPE}
            onChange={(_, newValue) => setSelectedPE(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tugaskan ke (Opsional)"
                placeholder="Pilih Project Engineer"
                helperText="Jika kosong, akan masuk ke antrian umum"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body1">{option.employee?.full_name || "Unknown"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          {/* Technical Brief (Required) */}
          <TextField
            label="Ringkasan Kebutuhan & Brief Teknis"
            multiline
            rows={6}
            value={technicalBrief}
            onChange={(e) => setTechnicalBrief(e.target.value)}
            placeholder="Contoh:
- Instalasi CCTV 12 kamera untuk area gudang
- Sistem akses kontrol 4 pintu
- Kebutuhan khusus: Integrasi dengan sistem existing
- Budget estimasi: Rp 50jt - 75jt"
            required
            helperText="Jelaskan kebutuhan teknis dan ekspektasi pelanggan secara detail"
            error={!technicalBrief.trim() && error !== null}
          />

          {/* File Upload */}
          <Box>
            <Button variant="outlined" component="label" disabled={uploadingFile} fullWidth>
              {uploadingFile ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Mengunggah...
                </>
              ) : (
                "Lampirkan Dokumen Pendukung"
              )}
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png,.dwg"
                onChange={handleFileUpload}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Format: PDF, Word, Excel, Gambar, DWG (maks. 10MB per file)
            </Typography>
          </Box>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                File Terlampir ({attachments.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveAttachment(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleClose} disabled={loading} variant="outlined">
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !technicalBrief.trim()}
              variant="contained"
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? "Mengirim..." : "Kirim Permintaan"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
};

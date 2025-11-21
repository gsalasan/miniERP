import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Autocomplete,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { usersApi, SalesUserOption } from '../../api/users';

interface EstimationAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  fileData: string; // Base64 encoded
  uploadedAt: string;
}

interface EstimationRequestModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  customerName: string;
  onSubmit: (data: {
    assignedToUserId?: string;
    technicalBrief: string;
    attachmentUrls: string[];
  }) => Promise<void>;
}

const EstimationRequestModal: React.FC<EstimationRequestModalProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  customerName,
  onSubmit,
}) => {
  const [engineers, setEngineers] = useState<SalesUserOption[]>([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<SalesUserOption | null>(null);
  const [technicalBrief, setTechnicalBrief] = useState('');
  const [attachments, setAttachments] = useState<EstimationAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load engineers on mount
  useEffect(() => {
    if (!open) return;
    const loadEngineers = async () => {
      try {
        setLoadingEngineers(true);
        setError(''); // Clear previous errors
        const list = await usersApi.getEngineeringUsers();
        setEngineers(list);
      } catch {
        // Gracefully degrade: continue without engineer list
        setEngineers([]);
      } finally {
        setLoadingEngineers(false);
      }
    };
    loadEngineers();
  }, [open]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setSelectedEngineer(null);
      setTechnicalBrief('');
      setAttachments([]);
      setError('');
    }
  }, [open]);

  // Load saved attachments when modal opens
  useEffect(() => {
    if (!open) return;

    const storageKey = `estimation_attachments_${projectId}_temp`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setAttachments(JSON.parse(saved));
      }
    } catch {
      setAttachments([]);
    }
  }, [open, projectId]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError('');

      const fileArray = Array.from(files);
      const newAttachments: EstimationAttachment[] = [];

      for (const file of fileArray) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} terlalu besar (maksimal 10MB)`);
          continue;
        }

        // Convert file to base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
          reader.readAsDataURL(file);
        });

        const attachment: EstimationAttachment = {
          id: `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          fileData,
          uploadedAt: new Date().toISOString(),
        };

        newAttachments.push(attachment);
      }

      const updatedAttachments = [...attachments, ...newAttachments];
      setAttachments(updatedAttachments);

      // Store in localStorage temporarily
      const storageKey = `estimation_attachments_${projectId}_temp`;
      localStorage.setItem(storageKey, JSON.stringify(updatedAttachments));

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Gagal mengunggah file. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updatedAttachments = attachments.filter((a) => a.id !== attachmentId);
    setAttachments(updatedAttachments);

    // Update localStorage
    const storageKey = `estimation_attachments_${projectId}_temp`;
    localStorage.setItem(storageKey, JSON.stringify(updatedAttachments));
  };

  const handleSubmit = async () => {
    if (!technicalBrief.trim()) {
      setError('Ringkasan kebutuhan teknis wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Convert local attachments to 'URLs' that can be referenced later
      const attachmentUrls = attachments.map((attachment) => {
        // Store the attachment permanently with the estimation
        const permanentKey = `estimation_attachment_${attachment.id}`;
        localStorage.setItem(permanentKey, JSON.stringify(attachment));

        // Return a local reference URL that the backend can understand
        return `localStorage://${permanentKey}`;
      });

      await onSubmit({
        assignedToUserId: selectedEngineer?.id,
        technicalBrief: technicalBrief.trim(),
        attachmentUrls,
      });

      // Clean up temporary attachments after successful submission
      const tempKey = `estimation_attachments_${projectId}_temp`;
      localStorage.removeItem(tempKey);

      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Gagal mengirim permintaan estimasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6'>Formulir Permintaan Estimasi</Typography>
          <IconButton onClick={onClose} size='small' disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Project Info */}
          <Box>
            <Typography variant='body2' color='text.secondary'>
              <strong>Proyek:</strong> {projectName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              <strong>Pelanggan:</strong> {customerName}
            </Typography>
          </Box>

          {/* Engineer Assignment */}
          <Autocomplete
            options={engineers}
            getOptionLabel={(option) => option.name}
            value={selectedEngineer}
            onChange={(_, newValue) => setSelectedEngineer(newValue)}
            loading={loadingEngineers}
            disabled={submitting}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Tugaskan ke Project Engineer (opsional)'
                placeholder='Pilih engineer atau biarkan kosong untuk antrian umum'
                helperText='Jika kosong, permintaan akan masuk ke antrian Engineering Manager'
              />
            )}
          />

          {/* Technical Brief */}
          <TextField
            label='Ringkasan Kebutuhan & Brief Teknis'
            multiline
            rows={6}
            value={technicalBrief}
            onChange={(e) => setTechnicalBrief(e.target.value)}
            placeholder='Jelaskan kebutuhan teknis dari pelanggan, scope pekerjaan, spesifikasi yang diminta, dll.'
            required
            disabled={submitting}
            error={!technicalBrief.trim() && error !== ''}
          />

          {/* File Upload */}
          <Box>
            <Button
              variant='outlined'
              component='label'
              startIcon={<AttachFileIcon />}
              disabled={uploading || submitting}
            >
              {uploading ? 'Mengunggah...' : 'Lampirkan Dokumen Pendukung'}
              <input
                type='file'
                hidden
                multiple
                onChange={handleFileUpload}
                accept='.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg'
              />
            </Button>
            <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>
              Format: PDF, Word, Excel, Gambar, DWG
            </Typography>
          </Box>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <List dense>
              {attachments.map((attachment) => (
                <ListItem key={attachment.id}>
                  <ListItemText
                    primary={attachment.name}
                    secondary={`${formatFileSize(attachment.size)} • ${new Date(attachment.uploadedAt).toLocaleDateString()}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge='end'
                      size='small'
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      disabled={submitting}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {/* Error */}
          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={submitting || !technicalBrief.trim()}
        >
          {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EstimationRequestModal;

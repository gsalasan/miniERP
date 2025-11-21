import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Modal,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { estimationsApi, Estimation } from '../../api/engineering';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, SalesUserOption } from '../../api/users';

interface EstimationTabProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
  onEstimationCreated?: () => void;
}

const EstimationTab: React.FC<EstimationTabProps> = ({
  projectId,
  projectName,
  projectStatus,
  onEstimationCreated,
}) => {
  const { user } = useAuth();
  const userDisplay =
    user?.name || (user as any)?.fullName || (user as any)?.full_name || user?.email || user?.id || 'System';
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state
  const [technicalBrief, setTechnicalBrief] = useState('');
  const [assignedPE, setAssignedPE] = useState<SalesUserOption | null>(null);
  const [peOptions, setPeOptions] = useState<SalesUserOption[]>([]);
  const [peLoading, setPeLoading] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Load estimations for this project
  const loadEstimations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await estimationsApi.listByProject(projectId);
      setEstimations(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data estimasi');
    } finally {
      setLoading(false);
    }
  };

  // Load PE options when modal opens
  const loadPEOptions = async () => {
    try {
      setPeLoading(true);
      const list = await usersApi.getEngineeringUsers();
      setPeOptions(list);
    } catch {
      setPeOptions([]);
    } finally {
      setPeLoading(false);
    }
  };

  useEffect(() => {
    loadEstimations();
  }, [projectId]);

  const handleOpenModal = () => {
    setModalOpen(true);
    loadPEOptions();
    setTechnicalBrief('');
    setAssignedPE(null);
    setAttachmentFiles([]);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachmentFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (!technicalBrief.trim()) {
        setError('Ringkasan kebutuhan teknis wajib diisi');
        return;
      }

      // TODO: Upload files to storage service (stub for now)
      const attachmentUrls: string[] = [];
      if (attachmentFiles.length > 0) {
        // Placeholder: in real implementation, upload to S3/GCS and get URLs
        // For now, we'll use file names as placeholders
        attachmentUrls.push(...attachmentFiles.map((f) => `placeholder://${f.name}`));
      }

      const payload = {
        projectId,
        assignedToUserId: assignedPE?.id,
        technicalBrief: technicalBrief.trim(),
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      };

      const newEstimation = await estimationsApi.create(payload);
      setSuccess('Permintaan estimasi berhasil dibuat!');

      // Refresh estimations list
      await loadEstimations();

      // Notify parent
      if (onEstimationCreated) {
        onEstimationCreated();
      }

      // Close modal after short delay
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat permintaan estimasi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        color: 'warning' | 'info' | 'success' | 'error' | 'default';
      }
    > = {
      PENDING: { label: 'Menunggu Dikerjakan', color: 'warning' },
      IN_PROGRESS: { label: 'Sedang Dikerjakan', color: 'info' },
      APPROVED: { label: 'Disetujui', color: 'success' },
      REJECTED: { label: 'Ditolak', color: 'error' },
      DRAFT: { label: 'Draft', color: 'default' },
    };
    const config = statusMap[status] || {
      label: status,
      color: 'default' as const,
    };
    return <Chip label={config.label} color={config.color} size='small' />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if we can create estimation (only for Pre-Sales status and no existing estimation)
  const canCreateEstimation = projectStatus === 'PRE_SALES' && estimations.length === 0;

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && !modalOpen && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {estimations.length === 0 && (
        <Box textAlign='center' py={4}>
          <Typography variant='body1' color='text.secondary' gutterBottom>
            Belum ada estimasi untuk proyek ini.
          </Typography>
          {projectStatus === 'PRE_SALES' ? (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
              sx={{ mt: 2 }}
            >
              Buat Permintaan Estimasi
            </Button>
          ) : (
            <Typography variant='caption' color='text.secondary' display='block' mt={2}>
              Permintaan estimasi hanya dapat dibuat saat proyek berada di tahap Pre-Sales
            </Typography>
          )}
        </Box>
      )}

      {/* Estimation List */}
      {estimations.length > 0 && (
        <Stack spacing={2}>
          {estimations.map((est) => (
            <Card key={est.id} variant='outlined'>
              <CardContent>
                <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
                  <Typography variant='h6' fontWeight='bold'>
                    Estimasi v{est.version}
                  </Typography>
                  {getStatusChip(est.status)}
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ '& > *': { mb: 1 } }}>
                  <Box display='flex' alignItems='center'>
                    <PersonIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant='body2'>
                      <strong>Diajukan oleh:</strong>{' '}
                      {(est as any).requested_by_user_name || userDisplay}
                    </Typography>
                  </Box>

                  <Box display='flex' alignItems='center'>
                    <PersonIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant='body2'>
                      <strong>Ditugaskan ke:</strong>{' '}
                      {(est as any).assigned_to_user_name || 'Belum ditentukan'}
                    </Typography>
                  </Box>

                  <Box display='flex' alignItems='center'>
                    <CalendarIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant='body2'>
                      <strong>Dibuat pada:</strong> {formatDate(est.created_at)}
                    </Typography>
                  </Box>

                  {est.technical_brief && (
                    <Box mt={2}>
                      <Typography variant='body2' fontWeight='bold' gutterBottom>
                        Ringkasan Kebutuhan Teknis:
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {est.technical_brief}
                      </Typography>
                    </Box>
                  )}

                  {est.attachments &&
                    Array.isArray(est.attachments) &&
                    est.attachments.length > 0 && (
                      <Box mt={2}>
                        <Typography variant='body2' fontWeight='bold' gutterBottom>
                          Lampiran:
                        </Typography>
                        <List dense>
                          {est.attachments.map((url, idx) => (
                            <ListItem key={idx} disablePadding>
                              <AttachFileIcon
                                sx={{
                                  fontSize: '1rem',
                                  mr: 1,
                                  color: 'text.secondary',
                                }}
                              />
                              <ListItemText
                                primary={
                                  <Link
                                    href={url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    underline='hover'
                                    color='primary'
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    {url.split('/').pop() || url}
                                  </Link>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Modal: Create Estimation Request */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600 },
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6' fontWeight='bold'>
              Formulir Permintaan Estimasi
            </Typography>
            <IconButton onClick={handleCloseModal} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Stack spacing={2}>
            <Typography variant='body2'>
              <strong>Proyek:</strong> {projectName}
            </Typography>

            <Autocomplete
              options={peOptions}
              getOptionLabel={(option) => option.name}
              value={assignedPE}
              onChange={(_, newValue) => setAssignedPE(newValue)}
              loading={peLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Tugaskan ke (Opsional)'
                  placeholder='Pilih Project Engineer'
                  helperText='Jika kosong, permintaan akan masuk ke antrian umum'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {peLoading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <TextField
              label='Ringkasan Kebutuhan & Brief Teknis *'
              multiline
              rows={6}
              value={technicalBrief}
              onChange={(e) => setTechnicalBrief(e.target.value)}
              placeholder='Jelaskan kebutuhan teknis pelanggan, scope pekerjaan, spesifikasi, dll.'
              required
              fullWidth
            />

            <Box>
              <Button variant='outlined' component='label' startIcon={<AttachFileIcon />} fullWidth>
                Lampirkan Dokumen Pendukung
                <input type='file' hidden multiple onChange={handleFileChange} />
              </Button>
              {attachmentFiles.length > 0 && (
                <Box mt={1}>
                  <Typography variant='caption' color='text.secondary'>
                    File terpilih: {attachmentFiles.map((f) => f.name).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box display='flex' justifyContent='flex-end' gap={1} mt={2}>
              <Button onClick={handleCloseModal} disabled={submitting}>
                Batal
              </Button>
              <Button
                variant='contained'
                onClick={handleSubmit}
                disabled={submitting || !technicalBrief.trim()}
              >
                {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default EstimationTab;

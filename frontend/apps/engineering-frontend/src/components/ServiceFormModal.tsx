import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Autocomplete,
  InputAdornment,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon, Save as SaveIcon, Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { servicesService } from "../api/servicesApi";
import { taxonomyService, TaxonomyItem } from "../api/taxonomyApi";
import CreateTaxonomyDialog from "./CreateTaxonomyDialog";
import { Service, ServiceFilterOptions } from "../types/service";
import { ServiceUnit } from "../types/enums";
import { useNotification } from "../contexts/NotificationContext";

interface ServiceFormModalProps {
  open: boolean;
  onClose: (refreshData?: boolean) => void;
  service: Service | null;
  mode: "create" | "edit";
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ open, onClose, service, mode }) => {
  const [formData, setFormData] = useState({
    service_name: "",
    service_code: "",
    item_type: "Service",
    kategori_sistem_id: "",
    sub_sistem_id: "",
    kategori_jasa_id: "",
    jenis_jasa_spesifik_id: "",
    deskripsi_id: "",
    rekomendasi_tim_id: "",
    fase_proyek_id: "",
    sbu_id: "",
    unit: "Jam",
    default_duration: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [filterOptions, setFilterOptions] = useState<ServiceFilterOptions | null>(null);
  // Taxonomy options
  const [systemCategories, setSystemCategories] = useState<TaxonomyItem[]>([]);
  const [subSystems, setSubSystems] = useState<TaxonomyItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<TaxonomyItem[]>([]);
  const [specificTypes, setSpecificTypes] = useState<TaxonomyItem[]>([]);
  const [descriptions, setDescriptions] = useState<TaxonomyItem[]>([]);
  const [teamRecommendations, setTeamRecommendations] = useState<TaxonomyItem[]>([]);
  const [faseProyeks, setFaseProyeks] = useState<TaxonomyItem[]>([]);
  const [sbus, setSBUs] = useState<TaxonomyItem[]>([]);
  const { showSuccess, showError } = useNotification();

  // Create dialogs state
  const [openAddSBU, setOpenAddSBU] = useState(false);
  const [openAddFase, setOpenAddFase] = useState(false);
  const [openAddSysCat, setOpenAddSysCat] = useState(false);
  const [openAddSubSys, setOpenAddSubSys] = useState(false);
  const [openAddSvcCat, setOpenAddSvcCat] = useState(false);
  const [openAddSpecType, setOpenAddSpecType] = useState(false);
  const [openAddDesc, setOpenAddDesc] = useState(false);
  const [openAddTeam, setOpenAddTeam] = useState(false);

  // Reset form when modal opens/closes or service changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && service) {
        setFormData({
          service_name: service.service_name || "",
          service_code: service.service_code || "",
          item_type: service.item_type || "Service",
          kategori_sistem_id: service.kategori_sistem_id || "",
          sub_sistem_id: service.sub_sistem_id || "",
          kategori_jasa_id: service.kategori_jasa_id || "",
          jenis_jasa_spesifik_id: service.jenis_jasa_spesifik_id || "",
          deskripsi_id: service.deskripsi_id || "",
          rekomendasi_tim_id: service.rekomendasi_tim_id || "",
          fase_proyek_id: service.fase_proyek_id || "",
          sbu_id: service.sbu_id || "",
          unit: service.unit || "Jam",
          default_duration: service.default_duration?.toString() || "",
          is_active: service.is_active ?? true,
        });
      } else {
        // Reset form for create mode
        setFormData({
          service_name: "",
          service_code: "",
          item_type: "Service",
          kategori_sistem_id: "",
          sub_sistem_id: "",
          kategori_jasa_id: "",
          jenis_jasa_spesifik_id: "",
          deskripsi_id: "",
          rekomendasi_tim_id: "",
          fase_proyek_id: "",
          sbu_id: "",
          unit: "Jam",
          default_duration: "",
          is_active: true,
        });
      }
      fetchFilterOptions();
      fetchTaxonomyData();
    }
  }, [open, mode, service]);

  const fetchTaxonomyData = async () => {
    try {
      const [sysCategories, svcCategories, descs, teams, fases, sbuList] = await Promise.all([
        taxonomyService.getSystemCategories(),
        taxonomyService.getServiceCategories(),
        taxonomyService.getDescriptions(),
        taxonomyService.getTeamRecommendations(),
        taxonomyService.getFaseProyeks(),
        taxonomyService.getSBUs(),
      ]);
      // Filter out items with undefined id to prevent React key errors
      setSystemCategories(sysCategories.filter((item) => item.id));
      setServiceCategories(svcCategories.filter((item) => item.id));
      setDescriptions(descs.filter((item) => item.id));
      setTeamRecommendations(teams.filter((item) => item.id));
      setFaseProyeks(fases.filter((item) => item.id));
      setSBUs(sbuList.filter((item) => item.id));
    } catch {
      showError("Gagal memuat data taxonomy");
    }
  };

  // Load sub-systems when system category changes
  useEffect(() => {
    if (formData.kategori_sistem_id) {
      taxonomyService
        .getSubSystems(formData.kategori_sistem_id)
        .then((data) => setSubSystems(data.filter((item) => item.id)));
    } else {
      setSubSystems([]);
      setFormData((prev) => ({ ...prev, sub_sistem_id: "" }));
    }
  }, [formData.kategori_sistem_id]);

  // Load specific types when service category changes
  useEffect(() => {
    if (formData.kategori_jasa_id) {
      taxonomyService
        .getSpecificTypes(formData.kategori_jasa_id)
        .then((data) => setSpecificTypes(data.filter((item) => item.id)));
    } else {
      setSpecificTypes([]);
      setFormData((prev) => ({ ...prev, jenis_jasa_spesifik_id: "" }));
    }
  }, [formData.kategori_jasa_id]);

  const fetchFilterOptions = async () => {
    try {
      const options = await servicesService.getFilterOptions();
      setFilterOptions(options);
    } catch {
      showError("Gagal memuat opsi filter");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validate numeric-only for default_duration (optional field, but must be a number if filled)
  const isValidNumber = (val: string) => {
    if (val === "" || val === null || val === undefined) return true; // empty allowed
    // allow integer or decimal, dot as separator
    return /^\d+(\.\d+)?$/.test(val.trim());
  };

  const validateForm = () => {
    if (!formData.service_name.trim()) {
      return false;
    }
    if (!formData.service_code.trim()) {
      return false;
    }
    if (!formData.unit) {
      return false;
    }
    if (formData.default_duration && !isValidNumber(formData.default_duration)) {
      return false;
    }
    return true;
  };

  const adjustDuration = (delta: number) => {
    const curr = parseFloat(formData.default_duration || "0");
    const base = isNaN(curr) ? 0 : curr;
    const next = Math.max(0, parseFloat((base + delta).toFixed(2)));
    handleInputChange("default_duration", next.toString());
  };

  const handleSubmit = async () => {
    setTriedSubmit(true);
    if (!validateForm()) {
      if (formData.default_duration && !isValidNumber(formData.default_duration)) {
        showError("Default Duration harus berupa angka yang valid");
      }
      return;
    }

    setLoading(true);

    try {
      const serviceData = {
        service_name: formData.service_name.trim(),
        service_code: formData.service_code.trim(),
        item_type: formData.item_type,
        kategori_sistem_id: formData.kategori_sistem_id || undefined,
        sub_sistem_id: formData.sub_sistem_id || undefined,
        kategori_jasa_id: formData.kategori_jasa_id || undefined,
        jenis_jasa_spesifik_id: formData.jenis_jasa_spesifik_id || undefined,
        deskripsi_id: formData.deskripsi_id || undefined,
        rekomendasi_tim_id: formData.rekomendasi_tim_id || undefined,
        fase_proyek_id: formData.fase_proyek_id || undefined,
        sbu_id: formData.sbu_id || undefined,
        unit: formData.unit as ServiceUnit,
        default_duration: formData.default_duration
          ? parseFloat(formData.default_duration)
          : undefined,
        is_active: formData.is_active,
      };

      if (mode === "edit" && service) {
        await servicesService.updateService(service.id, serviceData);
        showSuccess(`Service "${formData.service_name}" berhasil diperbarui`);
      } else {
        await servicesService.createService(serviceData);
        showSuccess(`Service "${formData.service_name}" berhasil ditambahkan`);
      }

      onClose(true); // Close modal and refresh data
    } catch {
      showError("Terjadi kesalahan saat menyimpan service");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="service-form-title"
      PaperProps={{
        sx: { minHeight: "70vh" },
      }}
    >
      <DialogTitle id="service-form-title" sx={{ pb: 1, px: 2, pt: 2, background: "transparent" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: (theme) => `${theme.palette.primary.main}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mode === "edit" ? (
                <SaveIcon sx={{ fontSize: 20, color: (theme) => theme.palette.primary.main }} />
              ) : (
                <AddIcon sx={{ fontSize: 20, color: (theme) => theme.palette.primary.main }} />
              )}
            </Box>

            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                {mode === "edit" ? "Edit Service" : "Add New Service"}
              </Typography>
              {mode === "edit" && (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {service?.service_name}
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton onClick={handleClose} sx={{ color: (theme) => theme.palette.text.primary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Service Name *"
              value={formData.service_name}
              onChange={(e) =>
                handleInputChange("service_name", (e.target as HTMLInputElement).value)
              }
              disabled={loading}
              error={triedSubmit && !formData.service_name.trim()}
              helperText={triedSubmit && !formData.service_name.trim() ? "Wajib diisi" : " "}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Service Code *"
              value={formData.service_code}
              onChange={(e) =>
                handleInputChange("service_code", (e.target as HTMLInputElement).value)
              }
              disabled={loading}
              placeholder="e.g., GEN-MAINT-001"
              error={triedSubmit && !formData.service_code.trim()}
              helperText={triedSubmit && !formData.service_code.trim() ? "Wajib diisi" : " "}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
              Unit & Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Unit *</InputLabel>
              <Select
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", (e.target as HTMLInputElement).value)}
                label="Unit *"
                disabled={loading}
              >
                {filterOptions?.units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={sbus}
                  getOptionLabel={(option) => option.name}
                  value={sbus.find((s) => s.id === formData.sbu_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("sbu_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="SBU" />}
                  disabled={loading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah SBU">
                <span>
                  <IconButton onClick={() => setOpenAddSBU(true)} disabled={loading} aria-label="Add SBU">
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={faseProyeks}
                  getOptionLabel={(option) => option.name}
                  value={faseProyeks.find((f) => f.id === formData.fase_proyek_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("fase_proyek_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Fase Proyek" />}
                  disabled={loading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Fase Proyek">
                <span>
                  <IconButton onClick={() => setOpenAddFase(true)} disabled={loading} aria-label="Add Fase Proyek">
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
              Klasifikasi Sistem & Jasa
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={systemCategories}
                  getOptionLabel={(option) => option.name}
                  value={systemCategories.find((s) => s.id === formData.kategori_sistem_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("kategori_sistem_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Kategori Sistem" />}
                  disabled={loading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Kategori Sistem">
                <span>
                  <IconButton onClick={() => setOpenAddSysCat(true)} disabled={loading} aria-label="Add Kategori Sistem">
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={subSystems}
                  getOptionLabel={(option) => option.name}
                  value={subSystems.find((s) => s.id === formData.sub_sistem_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("sub_sistem_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Sub Sistem" />}
                  disabled={loading || !formData.kategori_sistem_id}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Sub Sistem">
                <span>
                  <IconButton
                    onClick={() => {
                      if (!formData.kategori_sistem_id) {
                        showError("Pilih Kategori Sistem terlebih dahulu");
                        return;
                      }
                      setOpenAddSubSys(true);
                    }}
                    disabled={loading}
                    aria-label="Add Sub Sistem"
                  >
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={serviceCategories}
                  getOptionLabel={(option) => option.name}
                  value={serviceCategories.find((s) => s.id === formData.kategori_jasa_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("kategori_jasa_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Kategori Jasa" />}
                  disabled={loading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Kategori Jasa">
                <span>
                  <IconButton onClick={() => setOpenAddSvcCat(true)} disabled={loading} aria-label="Add Kategori Jasa">
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={specificTypes}
                  getOptionLabel={(option) => option.name}
                  value={specificTypes.find((s) => s.id === formData.jenis_jasa_spesifik_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("jenis_jasa_spesifik_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Jenis Jasa Spesifik" />}
                  disabled={loading || !formData.kategori_jasa_id}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Jenis Jasa Spesifik">
                <span>
                  <IconButton
                    onClick={() => {
                      if (!formData.kategori_jasa_id) {
                        showError("Pilih Kategori Jasa terlebih dahulu");
                        return;
                      }
                      setOpenAddSpecType(true);
                    }}
                    disabled={loading}
                    aria-label="Add Jenis Jasa Spesifik"
                  >
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
              Deskripsi & Rekomendasi Tim
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={descriptions}
                  getOptionLabel={(option) => option.name || option.text || ""}
                  value={descriptions.find((d) => d.id === formData.deskripsi_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("deskripsi_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Deskripsi" />}
                  disabled={loading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Deskripsi">
                <span>
                  <IconButton onClick={() => setOpenAddDesc(true)} disabled={loading} aria-label="Add Deskripsi">
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={1} alignItems="center">
              <Box flex={1}>
                <Autocomplete
                  fullWidth
                  options={teamRecommendations}
                  getOptionLabel={(option) => option.name}
                  value={teamRecommendations.find((t) => t.id === formData.rekomendasi_tim_id) || null}
                  onChange={(_, newValue) => {
                    handleInputChange("rekomendasi_tim_id", newValue?.id || "");
                  }}
                  renderInput={(params) => <TextField {...params} label="Rekomendasi Tim" />}
                  disabled={loading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Box>
              <Tooltip title="Tambah Rekomendasi Tim">
                <span>
                  <IconButton onClick={() => setOpenAddTeam(true)} disabled={loading} aria-label="Add Rekomendasi Tim">
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
              Durasi & Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default Duration (harus angka)"
              type="number"
              inputProps={{ inputMode: "decimal", step: "1", min: "0" }}
              value={formData.default_duration}
              onChange={(e) => {
                const val = (e.target as HTMLInputElement).value;
                handleInputChange("default_duration", val);
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              disabled={loading}
              placeholder="Contoh: 1 atau 2.5"
              error={!isValidNumber(formData.default_duration)}
              helperText={!isValidNumber(formData.default_duration) ? "Nilai harus berupa angka (contoh: 1 atau 2.5)" : "Biarkan kosong jika tidak diperlukan"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="kurangi"
                      onClick={() => adjustDuration(-1)}
                      edge="end"
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="tambah"
                      onClick={() => adjustDuration(1)}
                      edge="end"
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.value === "true",
                  }))
                }
                label="Status"
                disabled={loading}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
        >
          {mode === "edit" ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Create dialogs */}
    <CreateTaxonomyDialog
      open={openAddSBU}
      title="Tambah SBU"
      label="Nama SBU"
      onClose={() => setOpenAddSBU(false)}
      onCreate={async (name) => {
        try {
          const created = await taxonomyService.createSBU(name);
          const list = await taxonomyService.getSBUs();
          setSBUs(list.filter((i) => i.id));
          handleInputChange("sbu_id", created.id);
          showSuccess("SBU berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan SBU");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddFase}
      title="Tambah Fase Proyek"
      label="Nama Fase"
      onClose={() => setOpenAddFase(false)}
      onCreate={async (name) => {
        try {
          const created = await taxonomyService.createFaseProyek(name);
          const list = await taxonomyService.getFaseProyeks();
          setFaseProyeks(list.filter((i) => i.id));
          handleInputChange("fase_proyek_id", created.id);
          showSuccess("Fase Proyek berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Fase Proyek");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddSysCat}
      title="Tambah Kategori Sistem"
      label="Nama Kategori Sistem"
      onClose={() => setOpenAddSysCat(false)}
      onCreate={async (name) => {
        try {
          const created = await taxonomyService.createSystemCategory(name);
          const list = await taxonomyService.getSystemCategories();
          setSystemCategories(list.filter((i) => i.id));
          // Reset dependent fields
          handleInputChange("kategori_sistem_id", created.id);
          setSubSystems([]);
          handleInputChange("sub_sistem_id", "");
          showSuccess("Kategori Sistem berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Kategori Sistem");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddSubSys}
      title="Tambah Sub Sistem"
      label="Nama Sub Sistem"
      onClose={() => setOpenAddSubSys(false)}
      onCreate={async (name) => {
        if (!formData.kategori_sistem_id) {
          showError("Pilih Kategori Sistem terlebih dahulu");
          return;
        }
        try {
          const created = await taxonomyService.createSubSystem(
            name,
            formData.kategori_sistem_id,
          );
          const list = await taxonomyService.getSubSystems(formData.kategori_sistem_id);
          setSubSystems(list.filter((i) => i.id));
          handleInputChange("sub_sistem_id", created.id);
          showSuccess("Sub Sistem berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Sub Sistem");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddSvcCat}
      title="Tambah Kategori Jasa"
      label="Nama Kategori Jasa"
      onClose={() => setOpenAddSvcCat(false)}
      onCreate={async (name) => {
        try {
          const created = await taxonomyService.createServiceCategory(name);
          const list = await taxonomyService.getServiceCategories();
          setServiceCategories(list.filter((i) => i.id));
          // Reset dependent specific type
          handleInputChange("kategori_jasa_id", created.id);
          setSpecificTypes([]);
          handleInputChange("jenis_jasa_spesifik_id", "");
          showSuccess("Kategori Jasa berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Kategori Jasa");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddSpecType}
      title="Tambah Jenis Jasa Spesifik"
      label="Nama Jenis Jasa Spesifik"
      onClose={() => setOpenAddSpecType(false)}
      onCreate={async (name) => {
        if (!formData.kategori_jasa_id) {
          showError("Pilih Kategori Jasa terlebih dahulu");
          return;
        }
        try {
          const created = await taxonomyService.createSpecificType(
            name,
            formData.kategori_jasa_id,
          );
          const list = await taxonomyService.getSpecificTypes(formData.kategori_jasa_id);
          setSpecificTypes(list.filter((i) => i.id));
          handleInputChange("jenis_jasa_spesifik_id", created.id);
          showSuccess("Jenis Jasa Spesifik berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Jenis Jasa Spesifik");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddDesc}
      title="Tambah Deskripsi"
      label="Deskripsi"
      onClose={() => setOpenAddDesc(false)}
      onCreate={async (text) => {
        try {
          const created = await taxonomyService.createDescription(text);
          const list = await taxonomyService.getDescriptions();
          setDescriptions(list.filter((i) => i.id));
          handleInputChange("deskripsi_id", created.id);
          showSuccess("Deskripsi berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Deskripsi");
        }
      }}
    />

    <CreateTaxonomyDialog
      open={openAddTeam}
      title="Tambah Rekomendasi Tim"
      label="Nama Tim"
      onClose={() => setOpenAddTeam(false)}
      onCreate={async (name) => {
        try {
          const created = await taxonomyService.createTeamRecommendation(name);
          const list = await taxonomyService.getTeamRecommendations();
          setTeamRecommendations(list.filter((i) => i.id));
          handleInputChange("rekomendasi_tim_id", created.id);
          showSuccess("Rekomendasi Tim berhasil ditambahkan");
        } catch {
          showError("Gagal menambahkan Rekomendasi Tim");
        }
      }}
    />
    </>
  );
};

export default ServiceFormModal;

// Creation dialog instances are rendered alongside the main Dialog in the component return

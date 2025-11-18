import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
  Chip,
  Divider,
  Container,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Inventory as MaterialIcon,
  Build as ServiceIcon,
} from "@mui/icons-material";
import {
  MaterialSectionCard,
  ServiceSectionCard,
  FinancialSummaryPanel,
} from "../../components/calculator";
import { estimationsService } from "../../api/estimationsApi";
import { materialsService } from "../../api/materialsApi";
import { servicesService } from "../../api/servicesApi";
import {
  BoQSection,
  MaterialSection,
  ServiceSection,
  FinancialSummary,
  Estimation,
} from "../../types/estimation";

export const EstimationCalculatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isProjectEngineer, isProjectManager, canEditEstimation } = useAuth();

  // Read-only mode detection: `/estimations/:id/view` or `?mode=readonly|readonly=1`
  const searchParams = new URLSearchParams(location.search);
  const readOnly = location.pathname.endsWith("/view") ||
    searchParams.get("mode") === "readonly" ||
    searchParams.get("readonly") === "1";

  // State Management
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [sections, setSections] = useState<BoQSection[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    total_direct_hpp: 0,
    overhead_allocation: 0,
    total_estimasi_hpp: 0,
    total_harga_jual_standar: 0,
    estimasi_gross_margin: 0,
    estimasi_gross_margin_pct: 0,
    estimasi_net_margin: 0,
    estimasi_net_margin_pct: 0,
  });

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Menu Anchor for Add Section
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const addMenuOpen = Boolean(addMenuAnchor);

  // Load Estimation Data
  useEffect(() => {
    if (id) {
      loadEstimation();
    }
  }, [id]);

  // Auto-calculate whenever sections change
  useEffect(() => {
    if (sections.length > 0) {
      calculateFinancialSummary();
    }
  }, [sections]);

  const loadEstimation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await estimationsService.getEstimationById(id!);
      setEstimation(response.data);
      // no-op

      // Load existing sections/items if any
      if (response.data.items && response.data.items.length > 0) {
        console.log("📦 Loading saved items:", response.data.items);

        // Group items by type
        const materialItems = response.data.items.filter(
          (item: any) => item.item_type === "MATERIAL",
        );
        const serviceItems = response.data.items.filter(
          (item: any) => item.item_type === "SERVICE",
        );

        const loadedSections = [];

        // Create material section if exists
        if (materialItems.length > 0) {
          const materialSectionItems = await Promise.all(
            materialItems.map(async (item: any) => {
              try {
                const matResponse = await materialsService.getMaterialById(item.item_id);
                const material = matResponse.data;
                return {
                  id: `mat-${Date.now()}-${Math.random()}`, // temporary UI ID
                  material_id: item.item_id, // real DB ID
                  material_name: material?.item_name || "Unknown Material",
                  brand: material?.brand || "-",
                  vendor: material?.vendor || "-",
                  quantity: Number(item.quantity),
                  unit: material?.satuan || "unit",
                  hpp_per_unit: Number(item.hpp_at_estimation),
                  currency: material?.curr || "IDR",
                  total_hpp: Number(item.sell_price_at_estimation),
                };
              } catch (err) {
                console.error(`Failed to load material ${item.item_id}:`, err);
                return {
                  id: `mat-${Date.now()}-${Math.random()}`,
                  material_id: item.item_id,
                  material_name: `Material ${item.item_id}`,
                  brand: "-",
                  vendor: "-",
                  quantity: Number(item.quantity),
                  unit: "unit",
                  hpp_per_unit: Number(item.hpp_at_estimation),
                  currency: "IDR",
                  total_hpp: Number(item.sell_price_at_estimation),
                };
              }
            }),
          );

          loadedSections.push({
            id: `section-${Date.now()}-${Math.random()}`,
            type: "MATERIAL",
            title: "Bagian Material #1",
            items: materialSectionItems,
          });
        }

        // Create service sections
        if (serviceItems.length > 0) {
          // Group service items (for now, put all in one section)
          const serviceSectionItems = await Promise.all(
            serviceItems.map(async (item: any) => {
              try {
                const svcResponse = await servicesService.getService(item.item_id);
                const service = svcResponse.data;
                return {
                  id: `svc-${Date.now()}-${Math.random()}`,
                  service_id: item.item_id,
                  service_name: service?.service_name || "Unknown Service",
                  service_code: service?.service_code || "-",
                  source: "Internal",
                  quantity: Number(item.quantity),
                  unit: service?.unit || "Jam",
                  cost_per_unit: Number(item.hpp_at_estimation),
                  total_hpp: Number(item.sell_price_at_estimation),
                };
              } catch (err) {
                console.error(`Failed to load service ${item.item_id}:`, err);
                return {
                  id: `svc-${Date.now()}-${Math.random()}`,
                  service_id: item.item_id,
                  service_name: `Service ${item.item_id}`,
                  service_code: "-",
                  source: "Internal",
                  quantity: Number(item.quantity),
                  unit: "Jam",
                  cost_per_unit: Number(item.hpp_at_estimation),
                  total_hpp: Number(item.sell_price_at_estimation),
                };
              }
            }),
          );

          loadedSections.push({
            id: `section-${Date.now()}-${Math.random()}`,
            type: "SERVICE",
            title: "Bagian Jasa #1",
            serviceGroups: [
              {
                id: `group-${Date.now()}-${Math.random()}`,
                group_label: "Grup Jasa 1",
                items: serviceSectionItems,
              },
            ],
          });
        }

        console.log("✅ Loaded sections:", loadedSections);
        setSections(loadedSections);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimation");
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialSummary = async () => {
    if (sections.length === 0) {
      setFinancialSummary({
        total_direct_hpp: 0,
        overhead_allocation: 0,
        total_estimasi_hpp: 0,
        total_harga_jual_standar: 0,
        estimasi_gross_margin: 0,
        estimasi_gross_margin_pct: 0,
        estimasi_net_margin: 0,
        estimasi_net_margin_pct: 0,
      });
      return;
    }

    setCalculating(true);
    try {
      const result = await estimationsService.calculateModularEstimation({
        sections,
        overhead_percentage: 15, // Default 15%
        profit_margin_percentage: 20, // Default 20%
      });

      setFinancialSummary(result.summary || result);
    } catch (err) {
      console.error("Calculation error:", err);
      // Keep last values on error
    } finally {
      setCalculating(false);
    }
  };

  // Section Management
  const handleAddSection = (type: "MATERIAL" | "SERVICE") => {
    const sectionId = `section-${Date.now()}-${Math.random()}`;

    if (type === "MATERIAL") {
      const newSection: MaterialSection = {
        id: sectionId,
        type: "MATERIAL",
        title: `Bagian Material #${sections.filter((s) => s.type === "MATERIAL").length + 1}`,
        items: [],
      };
      setSections([...sections, newSection]);
    } else {
      const newSection: ServiceSection = {
        id: sectionId,
        type: "SERVICE",
        title: `Bagian Jasa #${sections.filter((s) => s.type === "SERVICE").length + 1}`,
        serviceGroups: [],
      };
      setSections([...sections, newSection]);
    }

    setAddMenuAnchor(null);
  };

  const handleUpdateSection = (updatedSection: BoQSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  // Save & Submit Actions
  const handleSaveDraft = async () => {
    if (!id) return;

    if (sections.length === 0) {
      setError("Tidak ada data untuk disimpan. Tambahkan minimal satu item.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await estimationsService.saveDraft(id, { sections });

      // Backend response structure: { success, message, data: { ...estimation, items: [...] } }
      const itemCount = response.data?.data?.items?.length || response.data?.items?.length || 0;

      setSuccessMessage(`✅ Draft berhasil disimpan! (${itemCount} item)`);

      // Don't reload to avoid errors - data is already in state
      // await loadEstimation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "❌ Gagal menyimpan draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id) return;

    if (sections.length === 0) {
      setError("Tidak ada data untuk disubmit. Tambahkan minimal satu bagian material atau jasa.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await estimationsService.submitEstimation(id, {
        sections,
        status: "PENDING_APPROVAL",
      });

      const itemCount = response.data?.data?.items?.length || response.data?.items?.length || 0;

      setSuccessMessage(`✅ Estimasi berhasil disubmit! (${itemCount} item)`);
      setTimeout(() => {
        navigate("/estimations/queue");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "❌ Gagal submit estimasi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !estimation) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/estimations/queue")}
          sx={{ mt: 2 }}
        >
          Kembali ke Antrian
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header dengan Background */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 2,
          px: 3,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate("/estimations/queue")}
              size="small"
              sx={{ mb: 1, color: "text.secondary" }}
            >
              Kembali
            </Button>
            <Typography variant="h5" fontWeight="700" color="primary.main">
              {estimation?.project?.project_name || "Kalkulator Estimasi"}
            </Typography>
            <Box display="flex" gap={2} mt={0.5}>
              <Chip
                label={`ID: ${estimation?.project?.project_number || "-"}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Customer: ${estimation?.project?.customer?.customer_name || "-"}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

            {readOnly && estimation && (
              <Button
                variant="contained"
                onClick={() => navigate(`/estimations/${id}`)}
                size="medium"
                disabled={(() => {
                  const assignedIdMatch = estimation.assigned_to_user_id === user?.userId;
                  const assignedEmailMatch =
                    (estimation.assigned_to?.email || "").toLowerCase() ===
                    (user?.email || "").toLowerCase();
                  const assignedToMe = assignedIdMatch || assignedEmailMatch;
                  return !(
                    canEditEstimation() || (isProjectEngineer() && assignedToMe) || isProjectManager()
                  );
                })()}
              >
                Edit
              </Button>
            )}
          {!readOnly && (
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveDraft}
                disabled={saving || sections.length === 0}
                size="medium"
              >
                {saving ? "Menyimpan..." : "Simpan Draft"}
              </Button>
              {isProjectEngineer() && (
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmitForApproval}
                  disabled={saving || sections.length === 0}
                  size="medium"
                >
                  Submit Approval
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Box px={3} pt={2}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Main Content - 2 Column Layout */}
      <Box display="flex" gap={3} p={3} alignItems="flex-start">
        {/* Left Column: Canvas (65%) */}
        <Box flex="1" sx={{ minWidth: 0 }}>
          {/* Add Section Button */}
          {!readOnly && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2,
                border: "2px dashed",
                borderColor: "primary.main",
                bgcolor: "primary.50",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "primary.100",
                },
              }}
            >
              <Button
                variant="text"
                startIcon={<AddIcon />}
                onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                fullWidth
                size="large"
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                + Tambah Bagian Baru (Material / Jasa)
              </Button>
              <Menu
                anchorEl={addMenuAnchor}
                open={addMenuOpen}
                onClose={() => setAddMenuAnchor(null)}
              >
                <MenuItem onClick={() => handleAddSection("MATERIAL")}>
                  <MaterialIcon sx={{ mr: 1.5 }} />
                  Bagian Material (Bill of Quantity)
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleAddSection("SERVICE")}>
                  <ServiceIcon sx={{ mr: 1.5 }} />
                  Bagian Jasa (Bill of Labor)
                </MenuItem>
              </Menu>
            </Paper>
          )}

          {/* Dynamic Sections */}
          {sections.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                bgcolor: "white",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Belum ada bagian estimasi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mulai dengan menambahkan Bagian Material atau Bagian Jasa
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sections.map((section) => {
                if (section.type === "MATERIAL") {
                  return (
                    <MaterialSectionCard
                      key={section.id}
                      section={section}
                      readOnly={readOnly}
                      onUpdateSection={handleUpdateSection}
                      onDeleteSection={handleDeleteSection}
                    />
                  );
                } else {
                  return (
                    <ServiceSectionCard
                      key={section.id}
                      section={section as ServiceSection}
                      readOnly={readOnly}
                      onUpdateSection={handleUpdateSection}
                      onDeleteSection={handleDeleteSection}
                    />
                  );
                }
              })}
            </Box>
          )}
        </Box>

        {/* Right Column: Financial Summary (35%) */}
        <Box sx={{ width: "400px", flexShrink: 0 }}>
          <FinancialSummaryPanel summary={financialSummary} loading={calculating} />
        </Box>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

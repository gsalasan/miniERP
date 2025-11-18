import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Calculate as CalculateIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { estimationsService } from "../../api/estimationsApi";
import { materialsService } from "../../api/materialsApi";
import { servicesService } from "../../api/servicesApi";
import {
  Estimation,
  EstimationCalculationResult,
  CalculationItem,
  ItemType,
  SourceType,
} from "../../types/estimation";
import { Material } from "../../types/material";
import { Service } from "../../types/service";

interface EstimationItemRow {
  id?: string;
  item_id: string;
  item_type: ItemType;
  item_name: string;
  quantity: number;
  source: SourceType;
  hpp_per_unit?: number;
  total_hpp?: number;
  sell_price_per_unit?: number;
  total_sell_price?: number;
}

export const EstimationCalculatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewEstimation = id === "new";

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [items, setItems] = useState<EstimationItemRow[]>([]);
  const [calculationResult, setCalculationResult] = useState<EstimationCalculationResult | null>(
    null,
  );

  const [projectId, setProjectId] = useState("");
  const [overheadPercentage, setOverheadPercentage] = useState(15);
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(20);
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState<"DRAFT" | "APPROVED" | "REJECTED" | "REVISED">("DRAFT");

  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch materials and services for autocomplete
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, servicesRes] = await Promise.all([
          materialsService.getMaterials({ page: 1, limit: 1000 }),
          servicesService.getServices({ page: 1, limit: 1000 }),
        ]);
        setMaterials(materialsRes.data || []);
        setServices(servicesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch items:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch existing estimation if editing
  useEffect(() => {
    if (!isNewEstimation && id) {
      const fetchEstimation = async () => {
        setLoading(true);
        try {
          const response = await estimationsService.getEstimationById(id);
          setEstimation(response.data);
          setProjectId(response.data.project_id);
          setVersion(response.data.version);
          setStatus(response.data.status);

          // Convert items to rows
          if (response.data.items) {
            const rows: EstimationItemRow[] = response.data.items.map((item) => ({
              id: item.id,
              item_id: item.item_id,
              item_type: item.item_type,
              item_name: "", // Will be fetched
              quantity: Number(item.quantity),
              source: item.source,
              hpp_per_unit: Number(item.hpp_at_estimation),
              sell_price_per_unit: Number(item.sell_price_at_estimation),
            }));
            setItems(rows);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load estimation");
        } finally {
          setLoading(false);
        }
      };
      fetchEstimation();
    }
  }, [id, isNewEstimation]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        item_id: "",
        item_type: "MATERIAL",
        item_name: "",
        quantity: 1,
        source: "INTERNAL",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof EstimationItemRow, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If item is selected, populate item_name
    if (field === "item_id") {
      const item = newItems[index];
      if (item.item_type === "MATERIAL") {
        const material = materials.find((m) => m.id === value);
        if (material) {
          newItems[index].item_name = material.item_name;
        }
      } else if (item.item_type === "SERVICE") {
        const service = services.find((s) => s.id === value);
        if (service) {
          newItems[index].item_name = service.service_name;
        }
      }
    }

    setItems(newItems);
  };

  const handleCalculate = async () => {
    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setCalculating(true);
    setError(null);
    try {
      const calculationItems: CalculationItem[] = items.map((item) => ({
        item_id: item.item_id,
        item_type: item.item_type,
        quantity: item.quantity,
        source: item.source,
      }));

      const result = await estimationsService.calculateEstimation({
        project_id: projectId || undefined,
        items: calculationItems,
        overhead_percentage: overheadPercentage,
        profit_margin_percentage: profitMarginPercentage,
        save_to_db: false,
      });

      setCalculationResult(result);

      // Update items with calculated values
      const updatedItems = items.map((item, index) => ({
        ...item,
        hpp_per_unit: result.items[index]?.hpp_per_unit || 0,
        total_hpp: result.items[index]?.total_hpp || 0,
        sell_price_per_unit: result.items[index]?.sell_price_per_unit || 0,
        total_sell_price: result.items[index]?.total_sell_price || 0,
      }));
      setItems(updatedItems);

      setSuccess("Calculation completed successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!calculationResult) {
      setError("Please calculate the estimation first");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const calculationItems: CalculationItem[] = items.map((item) => ({
        item_id: item.item_id,
        item_type: item.item_type,
        quantity: item.quantity,
        source: item.source,
      }));

      const result = await estimationsService.calculateEstimation({
        project_id: projectId || undefined,
        items: calculationItems,
        overhead_percentage: overheadPercentage,
        profit_margin_percentage: profitMarginPercentage,
        save_to_db: true,
        version: version,
        status: status,
      });

      setSuccess("Estimation saved successfully!");
      if (result.estimation_id) {
        setTimeout(() => {
          navigate(`/estimations/${result.estimation_id}`);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save estimation");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading && !isNewEstimation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/estimations")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            {isNewEstimation ? "New Estimation" : "Edit Estimation"}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={handleCalculate}
            disabled={calculating || items.length === 0}
          >
            {calculating ? "Calculating..." : "Calculate"}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || !calculationResult}
          >
            Save Estimation
          </Button>
        </Box>
      </Box>

      {/* Error & Success Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Main Content - 2 Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Items Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="600">
                  Estimation Items
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem}>
                  Add Item
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="15%">Type</TableCell>
                      <TableCell width="25%">Item</TableCell>
                      <TableCell width="10%">Qty</TableCell>
                      <TableCell width="12%">Source</TableCell>
                      <TableCell width="13%">HPP/Unit</TableCell>
                      <TableCell width="13%">Sell Price</TableCell>
                      <TableCell width="12%">Total</TableCell>
                      <TableCell width="5%"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={item.item_type}
                              onChange={(e) => handleItemChange(index, "item_type", e.target.value)}
                            >
                              <MenuItem value="MATERIAL">Material</MenuItem>
                              <MenuItem value="SERVICE">Service</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            size="small"
                            options={item.item_type === "MATERIAL" ? materials : services}
                            getOptionLabel={(option) =>
                              item.item_type === "MATERIAL"
                                ? (option as Material).item_name
                                : (option as Service).service_name
                            }
                            value={
                              item.item_type === "MATERIAL"
                                ? materials.find((m) => m.id === item.item_id) || null
                                : services.find((s) => s.id === item.item_id) || null
                            }
                            onChange={(_, newValue) => {
                              if (newValue) {
                                handleItemChange(index, "item_id", newValue.id);
                              }
                            }}
                            renderInput={(params) => <TextField {...params} />}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", Number(e.target.value))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={item.source}
                              onChange={(e) => handleItemChange(index, "source", e.target.value)}
                            >
                              <MenuItem value="INTERNAL">Internal</MenuItem>
                              <MenuItem value="EXTERNAL">External</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.hpp_per_unit ? formatCurrency(item.hpp_per_unit) : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.sell_price_per_unit
                              ? formatCurrency(item.sell_price_per_unit)
                              : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {item.total_sell_price ? formatCurrency(item.total_sell_price) : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {items.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    No items added. Click "Add Item" to start.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Summary Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={3}>
                Estimation Details
              </Typography>

              {/* Project ID */}
              <TextField
                fullWidth
                size="small"
                label="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Version */}
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Version"
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
                sx={{ mb: 2 }}
              />

              {/* Status */}
              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="REVISED">Revised</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" fontWeight="600" mb={2}>
                Parameters
              </Typography>

              {/* Overhead Percentage */}
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Overhead (%)"
                value={overheadPercentage}
                onChange={(e) => setOverheadPercentage(Number(e.target.value))}
                InputProps={{ endAdornment: "%" }}
                sx={{ mb: 2 }}
              />

              {/* Profit Margin Percentage */}
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Profit Margin (%)"
                value={profitMarginPercentage}
                onChange={(e) => setProfitMarginPercentage(Number(e.target.value))}
                InputProps={{ endAdornment: "%" }}
                sx={{ mb: 3 }}
              />

              {calculationResult && (
                <>
                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" fontWeight="600" mb={2}>
                    Summary
                  </Typography>

                  <Box sx={{ "& > div": { mb: 1.5 } }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Direct HPP:
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {formatCurrency(calculationResult.summary.total_direct_hpp)}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Overhead ({calculationResult.summary.overhead_percentage}%):
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {formatCurrency(calculationResult.summary.total_overhead_allocation)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight="600">
                        Total HPP:
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {formatCurrency(calculationResult.summary.total_hpp)}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Profit Margin ({calculationResult.summary.profit_margin_percentage}%):
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight="600">
                        {formatCurrency(
                          calculationResult.summary.total_sell_price -
                            calculationResult.summary.total_hpp,
                        )}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6" fontWeight="700">
                        Total Sell Price:
                      </Typography>
                      <Typography variant="h6" fontWeight="700" color="primary.main">
                        {formatCurrency(calculationResult.summary.total_sell_price)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { materialsService } from "../../api/materialsApi";

interface AddMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onMaterialCreated: (material: any) => void;
  initialSearchQuery?: string;
}

const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "JPY"];
const UNITS = ["pcs", "unit", "set", "meter", "kg", "liter", "box", "roll"];
const STATUS_OPTIONS = ["Active", "EndOfLife", "Discontinue"];
const LOCATION_OPTIONS = ["Local", "Import"];

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  open,
  onClose,
  onMaterialCreated,
  initialSearchQuery = "",
}) => {
  // Form state
  const [itemName, setItemName] = useState(initialSearchQuery);
  const [ownerPN, setOwnerPN] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [status, setStatus] = useState("Active");
  const [location, setLocation] = useState("Local");

  // Initial price state
  const [vendor, setVendor] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form
  const handleReset = () => {
    setItemName(initialSearchQuery);
    setOwnerPN("");
    setCategory("");
    setBrand("");
    setUnit("pcs");
    setStatus("Active");
    setLocation("Local");
    setVendor("");
    setPrice("");
    setCurrency("IDR");
    setExchangeRate("");
    setError(null);
  };

  // Handle close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!itemName.trim()) return "Nama item wajib diisi";
    if (!unit) return "Unit wajib diisi";
    if (!vendor.trim()) return "Nama vendor wajib diisi";
    if (!price || parseFloat(price) <= 0) return "Harga beli harus lebih dari 0";
    if (!currency) return "Mata uang wajib dipilih";
    if (currency !== "IDR" && (!exchangeRate || parseFloat(exchangeRate) <= 0)) {
      return "Kurs ke IDR wajib diisi untuk mata uang non-IDR";
    }
    return null;
  };

  // Handle submit
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        item_name: itemName.trim(),
        owner_pn: ownerPN.trim() || undefined,
        category: category.trim() || undefined,
        brand: brand.trim() || undefined,
        satuan: unit,
        status,
        location,
        initialPrice: {
          vendor: vendor.trim(),
          price: parseFloat(price),
          currency,
          exchangeRate: currency !== "IDR" ? parseFloat(exchangeRate) : undefined,
        },
      };

      const response = await materialsService.createMaterialWithVendor(payload);

      // Success! Call callback with new material data
      onMaterialCreated(response.data);

      // Close modal and reset
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="700">
          Tambah Item Material Baru
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tambahkan material baru beserta informasi vendor dan harga belinya
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Bagian 1: Detail Item Inti */}
        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight="600" color="primary" gutterBottom>
            Detail Item Inti
          </Typography>

          <TextField
            fullWidth
            label="Nama Item *"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            disabled={!!initialSearchQuery}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Product Number (P/N) dari Principal"
            placeholder="Contoh: SHT-X1, ABC-12345"
            value={ownerPN}
            onChange={(e) => setOwnerPN(e.target.value)}
            helperText="Penting untuk mencegah duplikasi. Kosongkan jika tidak ada."
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Kategori Item"
            placeholder="Contoh: Sensor, Kabel, Switch"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            helperText="Kategori akan menentukan markup pricing"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Unit *</InputLabel>
            <Select value={unit} onChange={(e) => setUnit(e.target.value)} label="Unit *">
              {UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Bagian 2: Informasi Pembelian Pertama */}
        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight="600" color="primary" gutterBottom>
            Informasi Pembelian Pertama
          </Typography>

          <TextField
            fullWidth
            label="Nama Vendor *"
            placeholder="Contoh: PT Sensorindo, ABC Trading"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            helperText="Jika vendor belum ada, akan dibuat otomatis"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Harga Beli *"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Mata Uang *</InputLabel>
            <Select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (e.target.value === "IDR") {
                  setExchangeRate("");
                }
              }}
              label="Mata Uang *"
            >
              {CURRENCIES.map((curr) => (
                <MenuItem key={curr} value={curr}>
                  {curr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {currency !== "IDR" && (
            <TextField
              fullWidth
              type="number"
              label="Kurs ke IDR (Manual) *"
              placeholder="Contoh: 15000"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={`1 ${currency} = ... IDR`}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">IDR</InputAdornment>,
              }}
            />
          )}

          {/* Preview Price in IDR */}
          {price && currency !== "IDR" && exchangeRate && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Preview Harga dalam IDR:</strong>
                <br />
                {parseFloat(price)} {currency} × {parseFloat(exchangeRate)} ={" "}
                <strong>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(parseFloat(price) * parseFloat(exchangeRate))}
                </strong>
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Bagian 3: Detail Tambahan (Opsional) */}
        <Box>
          <Typography variant="subtitle2" fontWeight="600" color="text.secondary" gutterBottom>
            Detail Tambahan (Opsional)
          </Typography>

          <TextField
            fullWidth
            label="Merek/Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status Ketersediaan</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status Ketersediaan"
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Lokasi</InputLabel>
            <Select value={location} onChange={(e) => setLocation(e.target.value)} label="Lokasi">
              {LOCATION_OPTIONS.map((l) => (
                <MenuItem key={l} value={l}>
                  {l}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Menyimpan..." : "Simpan & Gunakan di Estimasi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

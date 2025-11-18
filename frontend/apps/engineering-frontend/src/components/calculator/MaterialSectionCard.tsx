import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Box,
  Button,
} from "@mui/material";
import { Delete as DeleteIcon, Close as CloseIcon, Add as AddIcon } from "@mui/icons-material";
import { MaterialSection, MaterialRowItem } from "../../types/estimation";
import MaterialFormModal from "../MaterialFormModal";
import { materialsService } from "../../api/materialsApi";

interface MaterialSectionCardProps {
  section: MaterialSection;
  onUpdateSection: (section: MaterialSection) => void;
  onDeleteSection: (sectionId: string) => void;
  readOnly?: boolean;
}

interface MaterialSearchResult {
  id: string;
  item_name: string;
  brand?: string;
  vendor?: string;
  cost_rp?: number;
  satuan?: string;
  curr?: string;
  owner_pn?: string;
  status?: string;
}

export const MaterialSectionCard: React.FC<MaterialSectionCardProps> = ({
  section,
  onUpdateSection,
  onDeleteSection,
  readOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MaterialSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [creatingMaterialName, setCreatingMaterialName] = useState<string>("");
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  const handleSearchMaterial = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const data = await materialsService.searchMaterials(query, 20);
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching materials:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectMaterial = (material: MaterialSearchResult | null) => {
    if (!material) return;

    const newItem: MaterialRowItem = {
      id: `mat-${Date.now()}-${Math.random()}`,
      material_id: material.id,
      material_name: material.item_name,
      brand: material.brand,
      vendor: material.vendor,
      quantity: 1,
      unit: material.satuan || "pcs",
      hpp_per_unit: material.cost_rp || 0,
      currency: material.curr || "IDR",
      total_hpp: material.cost_rp || 0,
    };

    onUpdateSection({
      ...section,
      items: [...section.items, newItem],
    });

    setSearchQuery("");
    setSearchResults([]);
  };

  const handleMaterialCreated = (response: any) => {
    const material = response.data;
    const newItem: MaterialRowItem = {
      id: `mat-${Date.now()}-${Math.random()}`,
      material_id: material.id,
      material_name: material.item_name,
      brand: material.brand,
      vendor: material.vendor,
      quantity: 1,
      unit: material.satuan || "pcs",
      hpp_per_unit: material.cost_rp || 0,
      currency: material.curr || "IDR",
      total_hpp: material.cost_rp || 0,
    };

    onUpdateSection({
      ...section,
      items: [...section.items, newItem],
    });

    setSearchQuery("");
    setSearchResults([]);
  };

  const handleUpdateItem = (itemId: string, field: keyof MaterialRowItem, value: any) => {
    const updatedItems = section.items.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        // Recalculate total
        if (field === "quantity" || field === "hpp_per_unit") {
          updated.total_hpp = updated.quantity * updated.hpp_per_unit;
        }
        return updated;
      }
      return item;
    });

    onUpdateSection({
      ...section,
      items: updatedItems,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateSection({
      ...section,
      items: section.items.filter((item) => item.id !== itemId),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="600">
            {section.title}
          </Typography>
          {!readOnly && (
            <IconButton size="small" onClick={() => onDeleteSection(section.id)} color="error">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Material Search */}
        {!readOnly && (
          <Box mb={2}>
            <Autocomplete
            freeSolo
            options={[
              ...searchResults,
              { id: "add-new", item_name: "", brand: "", vendor: "", cost_rp: 0, satuan: "" },
            ]}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              if (option.id === "add-new") return "";
              return `${option.item_name} - ${option.brand || "N/A"}`;
            }}
            loading={searchLoading}
            onInputChange={(_, value) => {
              setSearchQuery(value);
              setCurrentSearchQuery(value);
              handleSearchMaterial(value);
            }}
            onChange={(_, value) => {
              if (value && typeof value !== "string") {
                if (value.id === "add-new") {
                  setCreatingMaterialName(currentSearchQuery || searchQuery);
                  setAddModalOpen(true);
                } else {
                  handleSelectMaterial(value);
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cari Material..."
                placeholder="Ketik nama material, brand, atau owner PN"
                size="small"
              />
            )}
            renderOption={(props, option) => {
              if (
                option.id === "add-new" &&
                searchQuery.length >= 2 &&
                searchResults.length === 0
              ) {
                return (
                  <li {...props} key="add-new">
                    <Box display="flex" alignItems="center" width="100%" py={1}>
                      <AddIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="body2" color="primary">
                        + Tambah "{searchQuery}" sebagai Item Baru
                      </Typography>
                    </Box>
                  </li>
                );
              }
              if (option.id === "add-new") return null;
              return (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" fontWeight="600">
                      {option.item_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.brand || "N/A"} | {option.vendor || "N/A"} |{" "}
                      {formatCurrency(option.cost_rp || 0)}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            filterOptions={(options, state) => {
              const filtered = options.filter((opt) => opt.id !== "add-new");
              if (state.inputValue.length >= 2 && filtered.length === 0) {
                return [...filtered, options.find((opt) => opt.id === "add-new")!];
              }
              return filtered;
            }}
            />
          </Box>
        )}

        {/* Add Material via unified Items form */}
        {!readOnly && (
          <MaterialFormModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSuccess={async () => {
              // After successful creation, try to auto-add newly created material by name
              const name = creatingMaterialName || currentSearchQuery;
              if (name && name.length >= 2) {
                try {
                  const results = await materialsService.searchMaterials(name, 1);
                  if (results && results.length > 0) {
                    handleSelectMaterial(results[0] as any);
                  }
                } catch {
                  // ignore
                }
              }
              setAddModalOpen(false);
            }}
            material={null}
            initialItemName={creatingMaterialName || currentSearchQuery}
          />
        )}

        {/* Material BoQ Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  HPP/Unit
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Total HPP
                </TableCell>
                {!readOnly && (
                  <TableCell sx={{ fontWeight: 600, width: 50 }} align="center">
                    Aksi
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {section.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={readOnly ? 7 : 8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Belum ada material. Gunakan pencarian di atas untuk menambah.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                section.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.material_name}</TableCell>
                    <TableCell>{item.brand || "-"}</TableCell>
                    <TableCell>{item.vendor || "-"}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                        }
                        size="small"
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={{ width: 80 }}
                        disabled={readOnly}
                      />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(item.hpp_per_unit)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="600">
                        {formatCurrency(item.total_hpp)}
                      </Typography>
                    </TableCell>
                    {!readOnly && (
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

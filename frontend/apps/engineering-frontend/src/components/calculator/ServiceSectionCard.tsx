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
  Select,
  MenuItem,
  FormControl,
  Divider,
} from "@mui/material";
import { Delete as DeleteIcon, Close as CloseIcon, Add as AddIcon } from "@mui/icons-material";
import { ServiceSection, ServiceGroup, ServiceRowItem } from "../../types/estimation";
import ServiceFormModal from "../ServiceFormModal";

interface ServiceSectionCardProps {
  section: ServiceSection;
  onUpdateSection: (section: ServiceSection) => void;
  onDeleteSection: (sectionId: string) => void;
  readOnly?: boolean;
}

interface ServiceSearchResult {
  id: string;
  service_name: string;
  service_code: string;
  unit: string;
  default_duration?: number;
  internal_cost_per_unit?: number;
  freelance_cost_per_unit?: number;
}

export const ServiceSectionCard: React.FC<ServiceSectionCardProps> = ({
  section,
  onUpdateSection,
  onDeleteSection,
  readOnly = false,
}) => {
  const [searchResults, setSearchResults] = useState<ServiceSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [creatingServiceName, setCreatingServiceName] = useState<string>("");
  const [creatingForGroupId, setCreatingForGroupId] = useState<string>("");

  const handleAddServiceGroup = () => {
    const newGroup: ServiceGroup = {
      id: `group-${Date.now()}-${Math.random()}`,
      group_label: `Grup Jasa ${section.serviceGroups.length + 1}`,
      items: [],
    };

    onUpdateSection({
      ...section,
      serviceGroups: [...section.serviceGroups, newGroup],
    });
  };

  const handleUpdateGroupLabel = (groupId: string, label: string) => {
    const updatedGroups = section.serviceGroups.map((group) =>
      group.id === groupId ? { ...group, group_label: label } : group,
    );

    onUpdateSection({
      ...section,
      serviceGroups: updatedGroups,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    onUpdateSection({
      ...section,
      serviceGroups: section.serviceGroups.filter((group) => group.id !== groupId),
    });
  };

  const handleSearchService = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:4001/api/v1/services/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error("Error searching services:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddServiceItem = (groupId: string, service: ServiceSearchResult | null) => {
    if (!service) return;

    const newItem: ServiceRowItem = {
      id: `svc-${Date.now()}-${Math.random()}`,
      service_id: service.id,
      service_name: service.service_name,
      service_code: service.service_code,
      source: "Internal",
      quantity: service.default_duration || 1,
      unit: service.unit || "Jam",
      cost_per_unit: service.internal_cost_per_unit || 0,
      total_hpp: (service.default_duration || 1) * (service.internal_cost_per_unit || 0),
    };

    const updatedGroups = section.serviceGroups.map((group) =>
      group.id === groupId ? { ...group, items: [...group.items, newItem] } : group,
    );

    onUpdateSection({
      ...section,
      serviceGroups: updatedGroups,
    });
  };

  const handleUpdateServiceItem = (
    groupId: string,
    itemId: string,
    field: keyof ServiceRowItem,
    value: any,
  ) => {
    const updatedGroups = section.serviceGroups.map((group) => {
      if (group.id === groupId) {
        const updatedItems = group.items.map((item) => {
          if (item.id === itemId) {
            const updated = { ...item, [field]: value };

            // Update cost_per_unit when source changes
            if (field === "source") {
              const serviceData = searchResults.find((s) => s.id === item.service_id);
              if (serviceData) {
                updated.cost_per_unit =
                  value === "Internal"
                    ? serviceData.internal_cost_per_unit || 0
                    : serviceData.freelance_cost_per_unit || 0;
              }
            }

            // Recalculate total
            if (field === "quantity" || field === "cost_per_unit" || field === "source") {
              updated.total_hpp = updated.quantity * updated.cost_per_unit;
            }

            return updated;
          }
          return item;
        });

        return { ...group, items: updatedItems };
      }
      return group;
    });

    onUpdateSection({
      ...section,
      serviceGroups: updatedGroups,
    });
  };

  const handleDeleteServiceItem = (groupId: string, itemId: string) => {
    const updatedGroups = section.serviceGroups.map((group) =>
      group.id === groupId
        ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
        : group,
    );

    onUpdateSection({
      ...section,
      serviceGroups: updatedGroups,
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
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddServiceGroup}
              >
                Tambah Grup Jasa
              </Button>
              <IconButton size="small" onClick={() => onDeleteSection(section.id)} color="error">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Service Groups */}
        {section.serviceGroups.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" color="text.secondary">
              Belum ada grup jasa. Klik "Tambah Grup Jasa" untuk mulai.
            </Typography>
          </Box>
        ) : (
          section.serviceGroups.map((group, groupIndex) => (
            <Box key={group.id} mb={3}>
              {groupIndex > 0 && <Divider sx={{ my: 2 }} />}

              {/* Group Header */}
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <TextField
                  value={group.group_label}
                  onChange={(e) => handleUpdateGroupLabel(group.id, e.target.value)}
                  variant="standard"
                  placeholder="Nama Grup Jasa (misal: Jasa Instalasi CCTV)"
                  fullWidth
                  sx={{ fontWeight: 600 }}
                  disabled={readOnly}
                />
                {!readOnly && (
                  <IconButton size="small" onClick={() => handleDeleteGroup(group.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* Service Search */}
              {!readOnly && (
                <Box mb={2}>
                  <Autocomplete
                  freeSolo
                  options={[
                    ...searchResults,
                    { id: "add-new", service_name: "", service_code: "", unit: "" } as any,
                  ]}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.service_name} (${option.service_code})`
                  }
                  loading={searchLoading}
                  onInputChange={(_, value) => {
                    setCreatingServiceName(value);
                    handleSearchService(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== "string") {
                      if ((value as any).id === "add-new") {
                        setCreatingForGroupId(group.id);
                        setCreateServiceOpen(true);
                      } else {
                        handleAddServiceItem(group.id, value as ServiceSearchResult);
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cari Tipe Jasa..."
                      placeholder="Ketik nama jasa atau kode jasa"
                      size="small"
                    />
                  )}
                  renderOption={(props, option) => {
                    if ((option as any).id === "add-new" && creatingServiceName.length >= 2 && searchResults.length === 0) {
                      return (
                        <li {...props} key="add-new">
                          <Box display="flex" alignItems="center" width="100%" py={1}>
                            <AddIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
                            <Typography variant="body2" color="primary">
                              + Tambah "{creatingServiceName}" sebagai Jasa Baru
                            </Typography>
                          </Box>
                        </li>
                      );
                    }
                    return (
                      <li {...props} key={(option as any).id}>
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            {(option as any).service_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(option as any).service_code} | {(option as any).unit} | Internal: {formatCurrency((option as any).internal_cost_per_unit || 0)} | Freelance: {formatCurrency((option as any).freelance_cost_per_unit || 0)}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  filterOptions={(options, state) => {
                    const filtered = options.filter((opt: any) => opt.id !== "add-new");
                    if (state.inputValue.length >= 2 && filtered.length === 0) {
                      const addNew = options.find((opt: any) => opt.id === "add-new");
                      return addNew ? [...filtered, addNew] : filtered;
                    }
                    return filtered;
                  }}
                  />
                </Box>
              )}

              {/* Service Items Table (Bill of Labor) */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Tipe Jasa</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 120 }}>Sumber</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 100 }}>Jumlah</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Cost/Unit
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
                    {group.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Belum ada komponen jasa. Gunakan pencarian di atas untuk menambah.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      group.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2">{item.service_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.service_code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={item.source}
                                onChange={(e) =>
                                  handleUpdateServiceItem(
                                    group.id,
                                    item.id,
                                    "source",
                                    e.target.value as "Internal" | "Freelance",
                                  )
                                }
                                disabled={readOnly}
                              >
                                <MenuItem value="Internal">Internal</MenuItem>
                                <MenuItem value="Freelance">Freelance</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateServiceItem(
                                  group.id,
                                  item.id,
                                  "quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              size="small"
                              inputProps={{ min: 0, step: 0.1 }}
                              sx={{ width: 80 }}
                              disabled={readOnly}
                            />
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(item.cost_per_unit)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600">
                              {formatCurrency(item.total_hpp)}
                            </Typography>
                          </TableCell>
                          {!readOnly && (
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteServiceItem(group.id, item.id)}
                              >
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
            </Box>
          ))
        )}
      </CardContent>
      {/* Create Service via unified Items form */}
      {!readOnly && (
        <ServiceFormModal
          open={createServiceOpen}
          onClose={async (refresh) => {
            setCreateServiceOpen(false);
            if (refresh && creatingServiceName && creatingForGroupId) {
              try {
                // reuse the same search API used above
                const token = localStorage.getItem("token") || localStorage.getItem("authToken");
                const resp = await fetch(
                  `http://localhost:4001/api/v1/services/search?q=${encodeURIComponent(creatingServiceName)}`,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      ...(token && { Authorization: `Bearer ${token}` }),
                    },
                  },
                );
                if (resp.ok) {
                  const data: ServiceSearchResult[] = await resp.json();
                  if (data && data.length > 0) {
                    handleAddServiceItem(creatingForGroupId, data[0]);
                  }
                }
              } catch {
                // ignore
              }
            }
          }}
          service={null}
          mode="create"
          initialServiceName={creatingServiceName}
        />
      )}
    </Card>
  );
};

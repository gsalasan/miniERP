import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  TextField,
  TableSortLabel,
  InputAdornment,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import RfpConfirmationModal from "./RfpConfirmationModal";
import ConfirmDialog from "./ConfirmDialog";
import { useCreateRfp } from "../hooks/useRfpHooks";
import AllocateStockModal from './AllocateStockModal';
import { inventoryApi } from '../api/inventoryApi';

interface BomRow {
  id: string;
  itemId: string;
  itemName: string;
  itemType: "MATERIAL" | "SERVICE";
  quantity: number;
  available_stock?: number;
  procurement_need?: number;
  procurement_status?: string;
}

interface Props {
  projectId: string;
  projectName?: string;
  bomItems: BomRow[];
  canEdit: boolean;
  onRfpCreated?: () => void;
  onBomChange?: (rows: BomRow[]) => void;
}

const SimpleBomTable: React.FC<Props> = ({
  projectId,
  projectName,
  bomItems,
  canEdit,
  onRfpCreated,
  onBomChange,
}) => {
  const [selection, setSelection] = useState<string[]>([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const createRfp = useCreateRfp(projectId);
  const [localRows, setLocalRows] = useState<BomRow[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [stockMap, setStockMap] = useState<Record<string, any>>({});
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocTarget, setAllocTarget] = useState<BomRow | null>(null);
  const [searchText, setSearchText] = useState("");
  const [orderBy, setOrderBy] = useState<keyof BomRow>("itemName");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const safeItems = Array.isArray(bomItems) ? bomItems : [];
    const processedRows = safeItems.map((r) => ({
      ...r,
      id: r.id || `temp-${Date.now()}-${Math.random()}`,
      procurement_need: r.procurement_need || r.quantity,
      procurement_status: r.procurement_status || "NOT_STARTED",
    }));
    setLocalRows(processedRows);
    setIsInitialized(true);
    // fetch stock info for these items
    (async () => {
      try {
        const mats = await inventoryApi.getBomMaterials(projectId);
        const map: Record<string, any> = {};
        mats.forEach((m: any) => {
          // try to key by material id or item id
          const key = m.material_id || m.itemId || m.id;
          if (key) map[key] = m;
        });
        setStockMap(map);
      } catch (e) {
        // ignore failures for now
      }
    })();
  }, [bomItems]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelection(filteredAndSortedRows.map((r) => r.id));
    } else {
      setSelection([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const openModal = () => setOpenConfirm(true);

  const handleConfirm = async (payload: { items: any[]; notes?: string }) => {
    const items = payload.items.map((it) => ({
      itemId: it.itemId,
      itemType: it.itemType,
      quantity: it.quantity,
    }));

    try {
      await createRfp.mutateAsync({ items, notes: payload.notes });
      setOpenConfirm(false);
      setSelection([]);
      if (typeof onRfpCreated === "function") onRfpCreated();
    } catch (err) {
      console.error("Error creating RFP:", err);
    }
  };

  const handleDeleteRow = (id: string) => {
    const updated = localRows.filter((r) => r.id !== id);
    setLocalRows(updated);
    if (typeof onBomChange === "function") onBomChange(updated);
    setSelection((prev) => prev.filter((s) => s !== id));
  };

  const handleConfirmDelete = () => {
    if (confirmTargetId) {
      handleDeleteRow(confirmTargetId);
    }
    setConfirmTargetId(null);
    setConfirmOpen(false);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    const updated = localRows.map((r) =>
      r.id === id
        ? {
            ...r,
            quantity: newQuantity,
            procurement_need: newQuantity, // Update procurement need as well
          }
        : r
    );
    setLocalRows(updated);
    if (typeof onBomChange === "function") onBomChange(updated);
  };

  const handleRequestSort = (property: keyof BomRow) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredAndSortedRows = React.useMemo(() => {
    let filtered = localRows;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter((row) =>
        row.itemName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return order === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [localRows, searchText, orderBy, order]);

  const getStatusColor = (
    status: string
  ): "default" | "warning" | "success" | "info" | "error" => {
    const map: Record<
      string,
      "default" | "warning" | "success" | "info" | "error"
    > = {
      NOT_STARTED: "default",
      WAITING_RFP: "warning",
      RFP_SUBMITTED: "info",
      IN_PROCUREMENT: "warning",
      PO_CREATED: "info",
      RECEIVED: "success",
      STOCK_AVAILABLE: "success",
    };
    return map[status] || "default";
  };

  const getStatusLabel = (status: string): string => {
    const labelMap: Record<string, string> = {
      NOT_STARTED: "Belum Diproses",
      WAITING_RFP: "Menunggu RFP",
      RFP_SUBMITTED: "RFP Terkirim",
      IN_PROCUREMENT: "Sedang Dipesan",
      PO_CREATED: "PO Dibuat",
      RECEIVED: "Sudah Diterima",
      STOCK_AVAILABLE: "Stok Tersedia",
    };
    return labelMap[status] || status;
  };

  if (!isInitialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (localRows.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
        sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          Belum ada item BoM. Salin dari BoQ atau tambah manual.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and RFP Button */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <TextField
          size="small"
          placeholder="Cari nama item..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {selection.length > 0 && `${selection.length} item terpilih`}
          </Typography>
          <Button
            id="create-rfp-btn"
            variant="contained"
            disabled={selection.length === 0 || !canEdit || createRfp.isPending}
            onClick={openModal}
          >
            {createRfp.isPending ? (
              <CircularProgress size={18} />
            ) : (
              "Create RFP"
            )}
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selection.length > 0 && selection.length < filteredAndSortedRows.length
                  }
                  checked={
                    filteredAndSortedRows.length > 0 && selection.length === filteredAndSortedRows.length
                  }
                  onChange={handleSelectAll}
                  disabled={!canEdit}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "itemName"}
                  direction={orderBy === "itemName" ? order : "asc"}
                  onClick={() => handleRequestSort("itemName")}
                >
                  Nama Item
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "itemType"}
                  direction={orderBy === "itemType" ? order : "asc"}
                  onClick={() => handleRequestSort("itemType")}
                >
                  Tipe
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "quantity"}
                  direction={orderBy === "quantity" ? order : "asc"}
                  onClick={() => handleRequestSort("quantity")}
                >
                  Qty BoM
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Kebutuhan Pengadaan</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "procurement_status"}
                  direction={orderBy === "procurement_status" ? order : "asc"}
                  onClick={() => handleRequestSort("procurement_status")}
                >
                  Status Pengadaan
                </TableSortLabel>
              </TableCell>
              {canEdit && <TableCell align="center">Aksi</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selection.includes(row.id)}
                    onChange={() => handleSelectOne(row.id)}
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell>{row.itemName}</TableCell>
                <TableCell>
                  <Chip label={row.itemType} size="small" />
                </TableCell>
                <TableCell align="right">
                  {canEdit ? (
                    <TextField
                      type="number"
                      size="small"
                      value={row.quantity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          handleQuantityChange(row.id, value);
                        }
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 80 }}
                    />
                  ) : (
                    row.quantity
                  )}
                </TableCell>
                <TableCell align="right">
                  {row.procurement_need || 0}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(row.procurement_status || "NOT_STARTED")}
                    size="small"
                    color={getStatusColor(row.procurement_status || "NOT_STARTED")}
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setConfirmTargetId(row.id);
                          setConfirmOpen(true);
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                      {/* Allocate button: show when available stock > 0 and project still needs */}
                      {(() => {
                        const stock = stockMap[row.itemId] || {};
                        const allocatedForProject = Number(stock.allocated_for_project ?? stock.allocatedForProject ?? 0);
                        const needRemaining = (row.procurement_need || row.quantity) - (allocatedForProject || 0);
                        // Show the button whenever the project still needs quantity (>0).
                        // The modal will fetch latest availability and validate before confirming.
                        if (needRemaining > 0) {
                          return (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const available = Number(stock.available ?? stock.available_qty ?? 0);
                                setAllocTarget({ ...row, available_stock: available, procurement_need: row.procurement_need });
                                setAllocOpen(true);
                              }}
                            >
                              Alokasikan Stok
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredAndSortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {searchText
                      ? `Tidak ada item yang cocok dengan "${searchText}"`
                      : "Belum ada item BoM"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <AllocateStockModal
        open={allocOpen}
        onClose={() => setAllocOpen(false)}
        projectId={projectId}
        materialId={allocTarget?.itemId || ''}
        materialName={allocTarget?.itemName || ''}
        needQty={allocTarget?.procurement_need}
        availableQty={allocTarget?.available_stock}
        onAllocated={async () => {
          // refresh stock info and local rows
          try {
            const mats = await inventoryApi.getBomMaterials(projectId);
            const map: Record<string, any> = {};
            mats.forEach((m: any) => { const key = m.material_id || m.itemId || m.id; if (key) map[key] = m; });
            setStockMap(map);
          } catch (e) {}
          // notify parent with updated rows if needed
          if (typeof onBomChange === 'function') onBomChange(localRows);
        }}
      />

      {/* Modals */}
      <RfpConfirmationModal
        open={openConfirm}
        projectName={projectName}
        items={localRows
          .filter((r) => selection.includes(r.id))
          .map((r) => ({
            itemId: r.itemId,
            itemType: r.itemType,
            itemName: r.itemName,
            quantity: r.quantity,
          }))}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Hapus item BoM"
        description="Yakin ingin menghapus item ini dari BoM? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default SimpleBomTable;

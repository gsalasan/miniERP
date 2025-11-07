import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";

interface CreateTaxonomyDialogProps {
  open: boolean;
  title: string;
  label?: string; // default: "Name"
  initialValue?: string;
  onClose: () => void;
  onCreate: (value: string) => Promise<void> | void;
}

const CreateTaxonomyDialog: React.FC<CreateTaxonomyDialogProps> = ({
  open,
  title,
  label = "Name",
  initialValue = "",
  onClose,
  onCreate,
}) => {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initialValue || "");
    }
  }, [open, initialValue]);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onCreate(value.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={!saving ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box mt={1}>
          <TextField
            fullWidth
            label={label}
            value={value}
            onChange={(e) => setValue((e.target as HTMLInputElement).value)}
            disabled={saving}
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !value.trim()}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaxonomyDialog;

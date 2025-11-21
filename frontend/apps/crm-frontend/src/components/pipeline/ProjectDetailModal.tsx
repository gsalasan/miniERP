import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  ListItemAvatar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  Engineering as EngineeringIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { Project, PIPELINE_COLUMNS, ProjectStatus, ProjectActivity } from "../../types/pipeline";
import { customersApi } from "../../api/customers";
import { Customer } from "../../types/customer";
import { pipelineApi } from "../../api/pipeline";
import { usersApi, SalesUserOption } from "../../api/users";
import { useAuth } from "../../contexts/AuthContext";
import { estimationsApi, Estimation } from "../../api/engineering";
import EstimationRequestModal from "./EstimationRequestModal";
import GenerateQuotationButton from "../GenerateQuotationButton";
import GenerateQuotationWithDiscountButton from "../GenerateQuotationWithDiscountButton";
import DiscountRequestSection from "../DiscountRequestSection";
import DiscountDecisionSection from "../DiscountDecisionSection";
import MarkAsWonLostButtons from "../MarkAsWonLostButtons";
import SalesOrderDetails from "../SalesOrderDetails";

interface ProjectDetailModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  open,
  onClose,
  project,
  onProjectUpdate,
}) => {
  const { user, token } = useAuth();
  const userDisplay =
    user?.name || (user as any)?.fullName || (user as any)?.full_name || user?.email || user?.id || "System";
  // Helper to extract error messages from unknown errors
  const extractErrorMessage = (err: unknown, fallback = "Terjadi kesalahan") => {
    if (!err) return fallback;
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const maybe = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return maybe.response?.data?.message || maybe.message || fallback;
    }
    return fallback;
  };

  interface Label {
    id: string;
    name: string;
    color: string;
  }

  interface ChecklistItem {
    id: string;
    title: string;
    notes?: string;
    is_done: boolean;
    due_date?: string | null;
    label_id?: string; // Single label ID
  }

  interface ProjectForm {
    project_name: string;
    description: string;
    estimated_value: number;
    lead_score: number;
    priority: string;
    expected_close_date: string | undefined;
  }
  const [tabValue, setTabValue] = useState(0);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    project_name: project.project_name,
    description: project.description || "",
    estimated_value: project.estimated_value || 0,
    lead_score: project.lead_score || 0,
    priority: project.priority || "MEDIUM",
    expected_close_date: project.expected_close_date || "",
  });
  const [salesUserId, setSalesUserId] = useState<string>(project.sales_user_id);
  const [salesOptions, setSalesOptions] = useState<SalesUserOption[]>([]);
  // Local fallback for enriched sales info if prop lacks it
  const [salesInfo, setSalesInfo] = useState<{
    name: string;
    email: string;
  } | null>(
    project.sales_user ? { name: project.sales_user.name, email: project.sales_user.email } : null,
  );

  // Estimation state
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [estimationsLoading, setEstimationsLoading] = useState(false);
  const [estimationRequestModalOpen, setEstimationRequestModalOpen] = useState(false);
  const [estimationError, setEstimationError] = useState("");
  // Preview state for attachments/documents
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return "Belum ditentukan";
    const n = Number(amount);
    if (!Number.isFinite(n)) return "Belum ditentukan";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  };

  // Format date
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "Belum ditentukan";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Compute final contract value for SO confirmation: use backend computed_total_with_tax (already includes discount + PPN 11%)
  const computeSalesOrderContractValue = (): number => {
    try {
      const chosen =
        estimations.find((e) => e.status === "DISCOUNT_APPROVED") ||
        estimations.find((e) => e.status === "APPROVED") ||
        estimations[0];
      if (!chosen) return Number(project.estimated_value || project.contract_value || 0);
      const anyChosen = chosen as any;
      // Prefer backend-computed value (from items sum - discount + VAT)
      const computed = Number(anyChosen?.computed_total_with_tax ?? 0);
      if (computed > 0) return computed;
      // Fallback: compute from subtotal (which backend also computed from items)
      const subtotal = Number(anyChosen?.subtotal ?? 0);
      const discPct = Number(anyChosen?.computed_discount_pct ?? anyChosen?.approved_discount ?? 0);
      const afterDisc = subtotal - subtotal * (discPct / 100);
      const VAT_RATE = 0.11;
      const total = afterDisc + afterDisc * VAT_RATE;
      return Number.isFinite(total) && total > 0 ? total : Number(project.estimated_value || project.contract_value || 0);
    } catch {
      return Number(project.estimated_value || project.contract_value || 0);
    }
  };

  // (maps removed) -- location will still show as text fields below

  const renderStatusChip = (status: string) => {
    const map: Record<
      string,
      {
        label: string;
        color: "default" | "primary" | "success" | "warning" | "error";
      }
    > = {
      WON: { label: "Menang", color: "success" },
      LOST: { label: "Kalah", color: "error" },
      ON_HOLD: { label: "On Hold", color: "warning" },
      DRAFT: { label: "Draft", color: "default" },
      PROSPECT: { label: "Prospek", color: "primary" },
      PRE_SALES: { label: "Pre-Sales", color: "primary" },
    };
    const cfg = map[status] || {
      label: PIPELINE_COLUMNS[status as ProjectStatus]?.title || status,
      color: "default",
    };
    return <Chip label={cfg.label} color={cfg.color} size="small" />;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Load full customer details when modal opens
  useEffect(() => {
    const load = async () => {
      if (!open || !project?.customer?.id) return;
      try {
        const detail = await customersApi.getCustomerById(project.customer.id);
        setCustomerDetails(detail);
      } catch {
        // ignore; we keep fallback minimal data from pipeline
      }
    };
    load();
  }, [open, project?.customer?.id]);

  // Load sales options when modal opens
  useEffect(() => {
    const fetchSales = async () => {
      if (!open) return;
      try {
        const list = await usersApi.getSalesUsers();
        setSalesOptions(list);
      } catch {
        setSalesOptions([]);
      } finally {
        // no-op
      }
    };
    fetchSales();
  }, [open]);

  // Load estimations function (defined outside useEffect so it can be reused)
  const loadEstimations = async () => {
    if (!open || !project?.id) return;
    try {
      setEstimationsLoading(true);
      setEstimationError("");
      const list = await estimationsApi.listByProject(project.id);
      console.log('Loaded estimations:', list);
      setEstimations(list);
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      const errorMsg =
        status === 404
          ? "Engineering service tidak tersedia. Pastikan service berjalan di port 4001."
          : extractErrorMessage(err, "Gagal memuat data estimasi");
      setEstimationError(errorMsg);
      setEstimations([]);
    } finally {
      setEstimationsLoading(false);
    }
  };

  // Load estimations when modal opens and tab is Estimasi
  useEffect(() => {
    loadEstimations();
  }, [open, project?.id]);

  // Activities (from backend)
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      if (!open || !project?.id) return;
      try {
        setActivitiesLoading(true);
        const list = await pipelineApi.getProjectActivities(project.id);
        setActivities(Array.isArray(list) ? list : []);
      } catch {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadActivities();
  }, [open, project?.id]);

  // Helper to refresh activities (used after creating activity entries)
  const refreshActivities = async () => {
    if (!project?.id) return;
    try {
      setActivitiesLoading(true);
      const list = await pipelineApi.getProjectActivities(project.id);
      setActivities(Array.isArray(list) ? list : []);
    } catch {
      // ignore
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Local checklist stored in localStorage per project (MVP without backend)
  const checklistStorageKey = (projId?: string) => `pipeline_checklist_${projId}`;
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDate, setNewTodoDate] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string | null>(null);

  // Label management - Global labels for the page
  const labelsStorageKey = (projId?: string) => `pipeline_labels_${projId}`;
  const checkedLabelsStorageKey = (projId?: string) => `pipeline_labels_checked_${projId}`;
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [checkedLabelIds, setCheckedLabelIds] = useState<Set<string>>(new Set());
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelSearchQuery, setLabelSearchQuery] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);

  // Predefined colors for new labels
  const labelColors = [
    "#4caf50",
    "#2196f3",
    "#ff9800",
    "#f44336",
    "#9c27b0",
    "#00bcd4",
    "#ffeb3b",
    "#795548",
    "#607d8b",
    "#e91e63",
  ];

  useEffect(() => {
    if (!open || !project?.id) {
      setChecklistItems([]);
      setAvailableLabels([]);
      return;
    }
    try {
      // Load checklist items
      const raw = localStorage.getItem(checklistStorageKey(project.id));
      if (raw) setChecklistItems(JSON.parse(raw));
      else setChecklistItems([]);

      // Load labels
      const labelsRaw = localStorage.getItem(labelsStorageKey(project.id));
      if (labelsRaw) setAvailableLabels(JSON.parse(labelsRaw));
      else setAvailableLabels([]);

      // Load checked labels
      const checkedRaw = localStorage.getItem(checkedLabelsStorageKey(project.id));
      if (checkedRaw) {
        setCheckedLabelIds(new Set(JSON.parse(checkedRaw)));
      } else {
        setCheckedLabelIds(new Set());
      }
    } catch {
      setChecklistItems([]);
      setAvailableLabels([]);
      setCheckedLabelIds(new Set());
    }
  }, [open, project?.id]);

  const persistChecklist = (items: ChecklistItem[]) => {
    try {
      if (project?.id) localStorage.setItem(checklistStorageKey(project.id), JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const addTodo = () => {
    if (!newTodoTitle.trim() || !project?.id) return;
    const item = {
      id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      title: newTodoTitle.trim(),
      is_done: false,
      due_date: newTodoDate || null,
    };
    const next = [item, ...checklistItems];
    setChecklistItems(next);
    persistChecklist(next);
    setNewTodoTitle("");
    setNewTodoDate(null);
    // Optimistically add activity entry so user sees history immediately
    try {
      const optimisticActivity: ProjectActivity = {
        id: `local_${Date.now()}`,
        project_id: project.id,
        activity_type: "TODO_CREATED",
        description: `To-Do '${item.title}' ditambahkan pada project '${project.project_name}' oleh ${userDisplay}`,
        created_by: user?.id || "local",
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticActivity, ...(prev || [])]);
    } catch {
      // ignore optimistic UI failure
    }

    // Create activity log asynchronously and reconcile with backend
    (async () => {
      try {
        await pipelineApi.createProjectActivity(
          project.id,
          "TODO_CREATED",
          `To-Do '${item.title}' ditambahkan pada project '${project.project_name}' oleh ${userDisplay}`,
          { todo_id: item.id, title: item.title },
        );
        // Refresh activities list to replace optimistic entry with server entry
        await refreshActivities();
      } catch {
        // ignore activity creation failure for now
      }
    })();
  };

  const toggleTodo = (it: ChecklistItem) => {
    const next = checklistItems.map((i) => (i.id === it.id ? { ...i, is_done: !i.is_done } : i));
    setChecklistItems(next);
    persistChecklist(next);
    // Optimistically add activity entry so the change shows immediately
    try {
      const newDone = !it.is_done;
      const optimisticActivity: ProjectActivity = {
        id: `local_${Date.now()}`,
        project_id: project.id,
        activity_type: "TODO_TOGGLED",
        description: `To-Do '${it.title}' ditandai sebagai ${newDone ? "selesai" : "belum selesai"} oleh ${userDisplay}`,
        created_by: user?.id || "local",
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticActivity, ...(prev || [])]);
    } catch {
      // ignore optimistic UI failure
    }

    // Create activity log asynchronously and reconcile with backend
    (async () => {
      try {
        const newDone = !it.is_done;
        await pipelineApi.createProjectActivity(
          project.id,
          "TODO_TOGGLED",
          `To-Do '${it.title}' ditandai sebagai ${newDone ? "selesai" : "belum selesai"} oleh ${userDisplay}`,
          { todo_id: it.id, title: it.title, is_done: newDone },
        );
        await refreshActivities();
      } catch {
        // ignore
      }
    })();
  };

  const updateTodoTitle = (it: ChecklistItem, title: string) => {
    const next = checklistItems.map((i) => (i.id === it.id ? { ...i, title } : i));
    setChecklistItems(next);
    persistChecklist(next);
  };

  const updateTodoDate = (it: ChecklistItem, dueDate: string | null) => {
    const next = checklistItems.map((i) => (i.id === it.id ? { ...i, due_date: dueDate } : i));
    setChecklistItems(next);
    persistChecklist(next);
  };

  const persistLabels = (labels: Label[]) => {
    try {
      if (project?.id) localStorage.setItem(labelsStorageKey(project.id), JSON.stringify(labels));
    } catch {
      // ignore
    }
  };

  const persistCheckedLabels = (checkedIds: Set<string>) => {
    try {
      if (project?.id)
        localStorage.setItem(
          checkedLabelsStorageKey(project.id),
          JSON.stringify(Array.from(checkedIds)),
        );
    } catch {
      // ignore
    }
  };

  const toggleLabelChecked = (labelId: string) => {
    const newChecked = new Set(checkedLabelIds);
    if (newChecked.has(labelId)) {
      newChecked.delete(labelId);
    } else {
      newChecked.add(labelId);
    }
    setCheckedLabelIds(newChecked);
    persistCheckedLabels(newChecked);
  };

  const openLabelDialog = () => {
    setLabelDialogOpen(true);
    setLabelSearchQuery("");
  };

  const closeLabelDialog = () => {
    setLabelDialogOpen(false);
    setLabelSearchQuery("");
    setNewLabelName("");
  };

  const createNewLabel = () => {
    if (!newLabelName.trim()) return;
    const newLabel: Label = {
      id: `label_${Date.now()}`,
      name: newLabelName.trim(),
      color: labelColors[availableLabels.length % labelColors.length],
    };
    const updated = [...availableLabels, newLabel];
    setAvailableLabels(updated);
    persistLabels(updated);

    // Auto-check new label
    const newChecked = new Set(checkedLabelIds);
    newChecked.add(newLabel.id);
    setCheckedLabelIds(newChecked);
    persistCheckedLabels(newChecked);

    setNewLabelName("");
  };

  const deleteLabel = (labelId: string) => {
    const updated = availableLabels.filter((l) => l.id !== labelId);
    setAvailableLabels(updated);
    persistLabels(updated);

    // Remove from checked set
    const newChecked = new Set(checkedLabelIds);
    newChecked.delete(labelId);
    setCheckedLabelIds(newChecked);
    persistCheckedLabels(newChecked);

    // Remove label from all items
    const updatedItems = checklistItems.map((item) =>
      item.label_id === labelId ? { ...item, label_id: undefined } : item,
    );
    setChecklistItems(updatedItems);
    persistChecklist(updatedItems);
  };

  const updateLabelName = (labelId: string, newName: string) => {
    const updated = availableLabels.map((l) => (l.id === labelId ? { ...l, name: newName } : l));
    setAvailableLabels(updated);
    persistLabels(updated);
  };

  const assignLabelToItem = (itemId: string, labelId: string | undefined) => {
    const next = checklistItems.map((i) => (i.id === itemId ? { ...i, label_id: labelId } : i));
    setChecklistItems(next);
    persistChecklist(next);
  };

  const filteredLabels = availableLabels.filter((l) =>
    l.name.toLowerCase().includes(labelSearchQuery.toLowerCase()),
  );

  const filteredTodoItems = selectedLabelFilter
    ? checklistItems.filter((item) => item.label_id === selectedLabelFilter)
    : checklistItems;

  const openDateEditor = (it: ChecklistItem) => {
    setEditingDateId(it.id);
    setEditingDateValue(it.due_date ? new Date(it.due_date).toISOString().split("T")[0] : "");
  };

  const closeDateEditor = () => {
    setEditingDateId(null);
    setEditingDateValue(null);
  };

  const saveEditedDate = async () => {
    if (!editingDateId) return closeDateEditor();
    updateTodoDate(
      {
        id: editingDateId,
        title: "",
        is_done: false,
      },
      editingDateValue ? editingDateValue : null,
    );
    closeDateEditor();
  };

  const deleteTodo = (it: ChecklistItem) => {
    if (!confirm("Hapus item checklist ini?")) return;
    const next = checklistItems.filter((i) => i.id !== it.id);
    setChecklistItems(next);
    persistChecklist(next);
    // Optimistically add activity entry so deletion is visible instantly
    try {
      const optimisticActivity: ProjectActivity = {
        id: `local_${Date.now()}`,
        project_id: project.id,
        activity_type: "TODO_DELETED",
        description: `To-Do '${it.title}' dihapus oleh ${userDisplay}`,
        created_by: user?.id || "local",
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [optimisticActivity, ...(prev || [])]);
    } catch {
      // ignore optimistic UI failure
    }

    // Create activity log asynchronously and reconcile with backend
    (async () => {
      try {
        await pipelineApi.createProjectActivity(
          project.id,
          "TODO_DELETED",
          `To-Do '${it.title}' dihapus oleh ${userDisplay}`,
          { todo_id: it.id, title: it.title },
        );
        await refreshActivities();
      } catch {
        // ignore
      }
    })();
  };

  // Ensure Sales Information populated even if project from card lacks sales_user
  useEffect(() => {
    const maybeFetchSales = async () => {
      if (!open) return;
      if (project?.sales_user) {
        setSalesInfo({
          name: project.sales_user.name,
          email: project.sales_user.email,
        });
        return;
      }
      if (project?.sales_user_id) {
        try {
          const detail = await pipelineApi.getProjectById(project.id);
          const su = (detail as Project)?.sales_user;
          if (su?.name || su?.email) {
            setSalesInfo({ name: su.name, email: su.email });
          }
        } catch {
          // ignore
        }
      }
    };
    maybeFetchSales();
  }, [open, project?.id, project?.sales_user_id, project?.sales_user]);

  // Sync form when project changes (e.g., after save)
  useEffect(() => {
    setForm({
      project_name: project.project_name,
      description: project.description || "",
      estimated_value: project.estimated_value || 0,
      lead_score: project.lead_score || 0,
      priority: project.priority || "MEDIUM",
      expected_close_date: project.expected_close_date || "",
    });
    setSalesUserId(project.sales_user_id);
  }, [project]);

  const handleFormChange = (field: string, value: ProjectForm[keyof ProjectForm]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: import("../../types/pipeline").UpdateProjectRequest = {
        project_name: form.project_name,
        description: form.description,
        estimated_value: Number(form.estimated_value) || 0,
        lead_score: Number(form.lead_score) || 0,
        priority: form.priority,
        expected_close_date: form.expected_close_date || undefined,
        sales_user_id: salesUserId,
      };
      const updated = await pipelineApi.updateProject(project.id, payload);
      setEditMode(false);
      onProjectUpdate(updated);
    } catch {
      // TODO: surface error via snackbar if needed
    } finally {
      setSaving(false);
    }
  };

  // Handle create estimation request
  const handleCreateEstimationRequest = async (data: {
    assignedToUserId?: string;
    technicalBrief: string;
    attachmentUrls: string[];
  }) => {
    try {
      await estimationsApi.create({
        projectId: project.id,
        requestedByUserId: user?.id, // ID sales yang login
        assignedToUserId: data.assignedToUserId,
        technicalBrief: data.technicalBrief,
        attachmentUrls: data.attachmentUrls,
      });
      // Refresh estimations list
      const list = await estimationsApi.listByProject(project.id);
      setEstimations(list);
      setEstimationRequestModalOpen(false);
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, "Gagal membuat permintaan estimasi"));
    }
  };

  // Render estimation status chip
  const renderEstimationStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        color: "warning" | "info" | "success" | "error" | "default";
      }
    > = {
      PENDING: { label: "Menunggu Dikerjakan", color: "warning" },
      IN_PROGRESS: { label: "Sedang Dikerjakan", color: "info" },
      APPROVED: { label: "Disetujui", color: "success" },
      REJECTED: { label: "Ditolak", color: "error" },
      DRAFT: { label: "Draft", color: "default" },
      PENDING_DISCOUNT_APPROVAL: { label: "Menunggu Approval Diskon", color: "warning" },
      DISCOUNT_APPROVED: { label: "Diskon Disetujui", color: "success" },
      DISCOUNT_REJECTED: { label: "Diskon Ditolak", color: "error" },
    };
    const config = statusConfig[status] || {
      label: status,
      color: "default" as const,
    };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // Open preview for an attachment url which may be:
  // - data:<mime>;base64,... (data URL)
  // - localStorage://some_key (we store attachments as JSON in localStorage)
  // - regular http(s) URL
  const openPreview = async (attachmentUrl: string, suggestedName?: string) => {
    try {
      // localStorage stored attachment reference
      if (attachmentUrl.startsWith("localStorage://")) {
        const storageKey = attachmentUrl.replace("localStorage://", "");
        let raw = localStorage.getItem(storageKey);

        // If exact key not found, try to find similar key (fallback for old data)
        if (!raw) {
          console.warn("Exact key not found:", storageKey);
          const allKeys = Object.keys(localStorage);
          const estimationKeys = allKeys.filter((k) => k.includes("estimation_attachment"));
          console.log("Available estimation keys:", estimationKeys);

          // Try to find a partial match based on the attachment ID
          const attachIdMatch = storageKey.match(/attach_\d+/);
          if (attachIdMatch) {
            const attachId = attachIdMatch[0];
            const matchingKey = estimationKeys.find((k) => k.includes(attachId));
            if (matchingKey) {
              console.log("Found matching key:", matchingKey);
              raw = localStorage.getItem(matchingKey);
            }
          }
        }

        if (!raw) {
          console.error("localStorage key not found:", storageKey);
          setPreviewSrc(null);
          setPreviewMime(null);
          setPreviewTitle("File Tidak Tersedia");
          setPreviewOpen(true);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (parseErr) {
          console.error("Failed to parse localStorage data:", parseErr);
          setPreviewSrc(null);
          setPreviewMime(null);
          setPreviewTitle("File Rusak");
          setPreviewOpen(true);
          return;
        }

        // EstimationAttachment has: id, name, size, type (mime), fileData
        // ProjectDocument has: id, name, type (category), size, uploadedAt, fileData, mimeType
        const fileData = parsed.fileData || parsed.data;
        if (!fileData) {
          console.error("No fileData in stored object:", parsed);
          setPreviewSrc(null);
          setPreviewMime(null);
          setPreviewTitle("File Data Kosong");
          setPreviewOpen(true);
          return;
        }

        const name = parsed.name || suggestedName || storageKey;
        const mime = parsed.mimeType || parsed.type || null;

        setPreviewSrc(fileData);
        setPreviewMime(mime || null);
        setPreviewTitle(name);
        setPreviewOpen(true);
        return;
      }

      // data URL -> preview directly
      if (attachmentUrl.startsWith("data:")) {
        setPreviewSrc(attachmentUrl);
        // try to extract mime
        const mimeMatch = attachmentUrl.match(/^data:([^;]+);/);
        setPreviewMime(mimeMatch ? mimeMatch[1] : null);
        setPreviewTitle(suggestedName || attachmentUrl.split("/").pop() || "Preview");
        setPreviewOpen(true);
        return;
      }

      // regular URL (http/https) -> try to preview in iframe (may be blocked by CORS)
      if (/^https?:\/\//i.test(attachmentUrl)) {
        setPreviewSrc(attachmentUrl);
        setPreviewMime(null);
        setPreviewTitle(suggestedName || attachmentUrl.split("/").pop() || "Preview");
        setPreviewOpen(true);
        return;
      }

      // fallback: open in new tab
      window.open(attachmentUrl, "_blank");
    } catch (err) {
      console.error("openPreview error", err);
      setPreviewSrc(null);
      setPreviewMime(null);
      setPreviewTitle("Error");
      setPreviewOpen(true);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: "85vh",
          maxHeight: "920px",
          width: "1100px",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 44,
                height: 44,
                fontWeight: "bold",
              }}
            >
              {project.project_name
                ? project.project_name
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join("")
                : "PR"}
            </Avatar>
            <Box>
              {editMode ? (
                <TextField
                  size="small"
                  value={form.project_name}
                  onChange={(e) => handleFormChange("project_name", e.target.value)}
                  sx={{ minWidth: 320 }}
                />
              ) : (
                <Typography variant="h6" fontWeight="bold">
                  {project.project_name}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {customerDetails?.customer_name || project.customer?.name}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {renderStatusChip(project.status)}
            <Tooltip title="Hapus project">
              <IconButton size="small" onClick={() => setConfirmDeleteOpen(true)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Detail" />
          <Tab label="Aktivitas" />
          <Tab label="Dokumen" />
          <Tab label="Estimasi" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2, overflowY: "auto" }}>
        {/* Tab 1: Detail */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Left column: Project Information + Sales Information (stacked) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informasi Proyek
                    </Typography>
                    <Box sx={{ "& > *": { mb: 1 } }}>
                      <Box display="flex" alignItems="center">
                        <BusinessIcon sx={{ mr: 1, color: "text.secondary" }} />
                        <Typography variant="body2">
                          <strong>Status:</strong>{" "}
                          {PIPELINE_COLUMNS[project.status as ProjectStatus]?.title ||
                            project.status}
                        </Typography>
                      </Box>

                      {/* Contract Value intentionally hidden in UI until engineering provides/approves it */}

                      <Box display="flex" alignItems="center">
                        <MoneyIcon sx={{ mr: 1, color: "text.secondary" }} />
                        {editMode ? (
                          <TextField
                            size="small"
                            type="number"
                            value={form.estimated_value}
                            onChange={(e) => handleFormChange("estimated_value", e.target.value)}
                            sx={{ width: 180 }}
                          />
                        ) : (
                          <Typography variant="body2">
                            <strong>Estimated Value:</strong>{" "}
                            {formatCurrency(project.estimated_value)}
                          </Typography>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center">
                        <StarIcon sx={{ mr: 1, color: "text.secondary" }} />
                        {editMode ? (
                          <TextField
                            size="small"
                            type="number"
                            value={form.lead_score}
                            onChange={(e) => handleFormChange("lead_score", e.target.value)}
                            sx={{ width: 120 }}
                          />
                        ) : (
                          <Typography variant="body2">
                            <strong>Skor Lead:</strong> {project.lead_score}
                          </Typography>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center">
                        <CalendarIcon sx={{ mr: 1, color: "text.secondary" }} />
                        {editMode ? (
                          <TextField
                            size="small"
                            type="date"
                            value={
                              form.expected_close_date
                                ? new Date(form.expected_close_date).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              handleFormChange("expected_close_date", e.target.value)
                            }
                          />
                        ) : (
                          <Typography variant="body2">
                            <strong>Expected Close:</strong>{" "}
                            {formatDate(project.expected_close_date)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Sales Information moved to left column to occupy empty space */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sales Information
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                      {editMode ? (
                        <FormControl size="small" sx={{ minWidth: 240 }}>
                          <InputLabel id="sales-user-label">Sales Person</InputLabel>
                          <Select
                            labelId="sales-user-label"
                            label="Sales Person"
                            value={
                              salesOptions.some((o) => o.id === salesUserId) ? salesUserId : ""
                            }
                            onChange={(e) => setSalesUserId(e.target.value as string)}
                          >
                            {user?.id && (
                              <MenuItem value={user.id}>
                                Assign to me {user.email ? `(${user.email})` : ""}
                              </MenuItem>
                            )}
                            {(!salesOptions || salesOptions.length === 0) && (
                              <MenuItem value="">Tidak ada data</MenuItem>
                            )}
                            {salesOptions.map((u) => (
                              <MenuItem key={u.id} value={u.id}>
                                {u.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body2">
                          <strong>Sales Person:</strong>{" "}
                          {salesInfo?.name ||
                            project.sales_user?.name ||
                            (project.sales_user_id && project.sales_user_id === user?.id
                              ? user?.email || "Anda"
                              : salesOptions.find((u) => u.id === project.sales_user_id)?.name) ||
                            "Belum ditentukan"}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Email:</strong>{" "}
                      {salesInfo?.email ||
                        project.sales_user?.email ||
                        (project.sales_user_id && project.sales_user_id === user?.id
                          ? user?.email || undefined
                          : undefined) ||
                        "Belum ada"}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* Customer Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informasi Customer
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={12}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            <strong>Nama:</strong>{" "}
                            {customerDetails?.customer_name || project.customer?.name}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Email:</strong>{" "}
                            {customerDetails?.customer_contacts?.[0]?.email || "Belum ada"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Phone:</strong>{" "}
                            {customerDetails?.customer_contacts?.[0]?.phone || "Belum ada"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Kota:</strong>{" "}
                            {customerDetails?.city || project.customer?.city || "Belum ada"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>District:</strong> {customerDetails?.district || "Belum ada"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Alamat:</strong> {customerDetails?.alamat || "Belum ada"}
                          </Typography>
                          {/* Google Maps pin tied to alamat */}
                          <AddressMap
                            address={
                              customerDetails?.alamat ||
                              // some older data models may use 'address' or fall back to city/district
                              (project.customer as any)?.address ||
                              [
                                customerDetails?.city,
                                customerDetails?.district,
                                (project.customer as any)?.city,
                                (project.customer as any)?.district,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            }
                            height={220}
                          />
                        </Box>

                        <Box sx={{ flex: 1 }} />
                      </Box>
                    </Grid>

                    {/* map removed by request */}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Sales Information (placed under Project Information on wide screens) */}

            {/* Description */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Deskripsi
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      multiline
                      minRows={3}
                      fullWidth
                      value={form.description}
                      onChange={(e) => handleFormChange("description", e.target.value)}
                    />
                  ) : (
                    <Typography variant="body2">{project.description}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Aktivitas & To-Do */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Typography variant="h6">Aktivitas & To-Do</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={openLabelDialog}
            >
              Labels
            </Button>
          </Box>

          {/* Label Filter Chips - Only show checked labels */}
          {availableLabels.filter((l) => checkedLabelIds.has(l.id)).length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Chip
                label="All"
                size="small"
                onClick={() => setSelectedLabelFilter(null)}
                color={selectedLabelFilter === null ? "primary" : "default"}
                sx={{ cursor: "pointer" }}
              />
              {availableLabels
                .filter((label) => checkedLabelIds.has(label.id))
                .map((label) => (
                  <Chip
                    key={label.id}
                    label={label.name}
                    size="small"
                    onClick={() => setSelectedLabelFilter(label.id)}
                    sx={{
                      bgcolor: selectedLabelFilter === label.id ? label.color : "transparent",
                      color: selectedLabelFilter === label.id ? "white" : label.color,
                      borderColor: label.color,
                      border: "1px solid",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: `${label.color}30`,
                      },
                    }}
                  />
                ))}
            </Box>
          )}

          {/* Two-column layout: To-Do (left) | Activities (right) */}
          <Grid container spacing={2}>
            {/* Left: To-Do (wider) */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle1">To-Do</Typography>
                {/* Add todo: input + add button on one row, due date below */}
                <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={9}>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Tambahkan tugas (Enter untuk simpan)"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTodo();
                      }}
                      inputProps={{
                        style: {
                          whiteSpace: "pre-wrap",
                          overflowWrap: "break-word",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      onClick={addTodo}
                      disabled={!newTodoTitle.trim()}
                    >
                      Tambah
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      sx={{ maxWidth: 260 }}
                      value={newTodoDate ? new Date(newTodoDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => setNewTodoDate(e.target.value ? e.target.value : null)}
                      helperText="Due date (optional)"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ maxHeight: "72vh", overflowY: "auto", pr: 1 }}>
                  {filteredTodoItems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {selectedLabelFilter ? "Tidak ada item dengan label ini" : "Belum ada item"}
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {filteredTodoItems.map((it) => (
                        <ListItem
                          key={it.id}
                          sx={{
                            bgcolor: "background.paper",
                            mb: 0.5,
                            borderRadius: 1,
                            alignItems: "center",
                            py: 0.5,
                            pl: 0.5,
                          }}
                        >
                          {/* Left side: action buttons + avatar */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mr: 0.5,
                            }}
                          >
                            <Tooltip title="Hapus">
                              <IconButton
                                size="small"
                                onClick={() => deleteTodo(it)}
                                sx={{ mr: 0.5 }}
                              >
                                <CancelIcon color="error" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={it.is_done ? "Tandai belum selesai" : "Tandai selesai"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleTodo(it)}
                                sx={{ ml: 0.5 }}
                              >
                                <CheckCircleIcon color={it.is_done ? "success" : "action"} />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          {/* Main content: title and notes. Add right padding so right-side chip doesn't overlap */}
                          <Box sx={{ flex: 1, pr: "180px" }}>
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              maxRows={4}
                              value={it.title}
                              onChange={(e) => updateTodoTitle(it, e.target.value)}
                              sx={{
                                "& .MuiInputBase-input": {
                                  py: 0.75,
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "break-word",
                                },
                              }}
                            />
                            {it.notes && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5, display: "block" }}
                              >
                                {it.notes}
                              </Typography>
                            )}
                          </Box>

                          {/* Right side: due date (centered vertically) */}
                          <ListItemSecondaryAction
                            sx={{
                              top: "50%",
                              transform: "translateY(-50%)",
                              pr: 1,
                              right: 8,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openDateEditor(it)}
                              sx={{
                                minWidth: 64,
                                py: 0.25,
                                px: 0.5,
                                fontSize: "0.7rem",
                              }}
                              startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
                            >
                              <Typography variant="caption" sx={{ fontSize: "0.72rem" }}>
                                {it.due_date ? formatDate(it.due_date) : "No due"}
                              </Typography>
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Right: Activities (narrower) */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  borderLeft: { xs: "none", md: "1px solid" },
                  borderColor: "divider",
                  pl: { xs: 0, md: 2 },
                }}
              >
                <Typography variant="subtitle1">Aktivitas</Typography>
                <Box sx={{ maxHeight: "56vh", overflowY: "auto" }}>
                  {activitiesLoading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : activities.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Belum ada aktivitas untuk proyek ini.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {activities.map((a) => (
                        <ListItem
                          key={a.id}
                          alignItems="flex-start"
                          sx={{
                            bgcolor: "background.paper",
                            mb: 1,
                            borderRadius: 1,
                            boxShadow: 0,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "secondary.main" }}>
                              {a.activity_type === "STATUS_CHANGE" ? (
                                <CheckCircleIcon />
                              ) : (
                                <HourglassIcon />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600}>
                                {a.description}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Dokumen */}
        <TabPanel value={tabValue} index={2}>
          <DocumentTab
            projectId={project.id}
            projectName={project.project_name}
            onPreview={(url, name, mime) => openPreview(url, name)}
          />
        </TabPanel>

        {/* Tab 4: Estimasi */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Estimasi Engineering
          </Typography>

          {estimationsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : estimationError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {estimationError}
            </Alert>
          ) : estimations.length === 0 ? (
            // State: Belum ada estimasi
            <Box textAlign="center" py={4}>
              <EngineeringIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Belum ada estimasi untuk proyek ini.
              </Typography>
              {project.status === "PRE_SALES" ? (
                <Button
                  variant="contained"
                  onClick={() => setEstimationRequestModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Buat Permintaan Estimasi
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                  Permintaan estimasi hanya dapat dibuat saat proyek berada di tahap Pre-Sales
                </Typography>
              )}
            </Box>
          ) : (
            // State: Ada estimasi
            <Box>
              {/* Sales Order Details - Show if project is WON */}
              {project.status === 'WON' && (
                <Box sx={{ mb: 2 }}>
                  <SalesOrderDetails projectId={project.id} />
                </Box>
              )}
              
              {/* WON/LOST Buttons - Show if Proposal Delivered */}
              {project.status === 'PROPOSAL_DELIVERED' && (
                <Box sx={{ mb: 2 }}>
                  <MarkAsWonLostButtons
                    projectId={project.id}
                    projectName={project.project_name}
                    projectStatus={project.status}
                    contractValue={computeSalesOrderContractValue()}
                    onSuccess={() => {
                      onProjectUpdate({ ...project, status: 'WON' });
                      loadEstimations();
                    }}
                  />
                </Box>
              )}
              
              {estimations.map((est) => (
                <Card key={est.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6">Estimasi v{est.version}</Typography>
                      {renderEstimationStatusChip(est.status)}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    
                    {/* Status Indicators */}
                    <Box sx={{ mb: 2 }}>
                      {/* Show if discount requested */}
                      {est.status === 'PENDING_DISCOUNT_APPROVAL' && (
                        <Alert severity="info" sx={{ mb: 1 }}>
                          <strong>Diskon sudah diajukan</strong> - Menunggu approval CEO untuk diskon {(est as any).requested_discount}%
                        </Alert>
                      )}
                      
                      {/* Show if discount approved */}
                      {est.status === 'DISCOUNT_APPROVED' && (
                        <Alert severity="success" sx={{ mb: 1 }}>
                          <strong>Diskon sudah disetujui</strong> - CEO menyetujui diskon {(est as any).approved_discount}%
                        </Alert>
                      )}
                      
                      {/* Show if discount rejected */}
                      {est.status === 'DISCOUNT_REJECTED' && (
                        <Alert severity="warning" sx={{ mb: 1 }}>
                          <strong>Diskon ditolak</strong> - Silakan ajukan ulang dengan nilai diskon yang sesuai
                        </Alert>
                      )}
                      
                      {/* Show if quotation already generated (check project status) */}
                      {project.status === 'PROPOSAL_DELIVERED' && est.status !== 'PENDING_DISCOUNT_APPROVAL' && (
                        <Alert severity="success" sx={{ mb: 1 }}>
                          <strong>Quotation sudah di-generate</strong> - Project dalam status Proposal Delivered
                        </Alert>
                      )}
                    </Box>
                    
                    {/* Display quotation action if already generated */}
                    {project.status === 'PROPOSAL_DELIVERED' && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.main' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark', mb: 0.5 }}>
                              📄 Quotation Tersedia
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Quotation untuk estimasi ini sudah pernah di-generate
                              {est.status === 'DISCOUNT_APPROVED' && ` dengan diskon ${(est as any).approved_discount}%`}
                            </Typography>
                          </Box>
                          <GenerateQuotationWithDiscountButton
                            opportunityId={project.id}
                            estimationId={est.id}
                            estimationStatus="DISCOUNT_APPROVED"
                            approvedDiscount={(est as any).approved_discount || 0}
                            projectName={project.project_name}
                            subtotal={(est as any).subtotal || (est as any).total_sell_price || project.estimated_value}
                            projectStatus="APPROVED"
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                    )}
                    
                    {/* Discount Approval Sections - Only show if quotation NOT yet generated */}
                    {project.status !== 'PROPOSAL_DELIVERED' && (
                      <>
                        {(user?.roles?.includes('SALES') || user?.roles?.includes('SALES_MANAGER')) && (
                          <DiscountRequestSection
                            estimationId={est.id}
                            currentStatus={est.status}
                            currentDiscount={(est as any).approved_discount || null}
                            requestedDiscount={(est as any).requested_discount || null}
                            onSuccess={loadEstimations}
                          />
                        )}
                        
                        {user?.roles?.includes('CEO') && (
                          <DiscountDecisionSection
                            estimationId={est.id}
                            currentStatus={est.status}
                            requestedDiscount={(est as any).requested_discount || null}
                            approvedDiscount={(est as any).approved_discount || null}
                            onSuccess={loadEstimations}
                          />
                        )}
                      </>
                    )}
                    
                    {/* Generate Quotation with Discount */}
                    <Box display="flex" justifyContent="flex-end" mt={2} mb={2}>
                      <GenerateQuotationWithDiscountButton
                        opportunityId={project.id}
                        estimationId={est.id}
                        estimationStatus={est.status}
                        approvedDiscount={(est as any).approved_discount || null}
                        projectName={project.project_name}
                        subtotal={(est as any).subtotal || (est as any).total_sell_price || project.estimated_value}
                        projectStatus={project.status}
                        variant="contained"
                        size="medium"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Diminta oleh:</strong>{" "}
                      {(
                        est as Estimation & {
                          requested_by_user_name?: string;
                        }
                      ).requested_by_user_name || userDisplay}{" "}
                      pada{" "}
                      {est.created_at ? new Date(est.created_at).toLocaleDateString("id-ID") : "-"}
                    </Typography>
                    {((est as Estimation & { assigned_to_user_name?: string })
                      .assigned_to_user_name ||
                      est.assigned_to_user_id) && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Ditugaskan ke:</strong>{" "}
                        {(est as Estimation & { assigned_to_user_name?: string })
                          .assigned_to_user_name || "Belum ditentukan"}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Brief Teknis:</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {est.technical_brief || "-"}
                    </Typography>
                    {est.attachments &&
                      Array.isArray(est.attachments) &&
                      est.attachments.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="body2">
                            <strong>Lampiran:</strong>
                          </Typography>
                          {est.attachments.map((url: string, idx: number) => (
                            <Box
                              key={idx}
                              component="button"
                              sx={{
                                cursor: "pointer",
                                textDecoration: "underline",
                                color: "primary.main",
                                fontSize: "0.75rem",
                                display: "block",
                                padding: "8px",
                                border: "1px solid",
                                borderColor: "primary.main",
                                borderRadius: 1,
                                backgroundColor: "transparent",
                                margin: "4px 0",
                                textAlign: "left",
                                "&:hover": {
                                  backgroundColor: "primary.light",
                                  color: "white",
                                },
                              }}
                              onClick={() => openPreview(url)}
                            >
                              📎{" "}
                              {url.includes("unais.jpg")
                                ? "unais.jpg"
                                : url.split("/").pop() || `File ${idx + 1}`}
                            </Box>
                          ))}
                        </Box>
                      )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!editMode ? (
          <>
            <Button onClick={onClose}>Tutup</Button>
            <Button variant="contained" onClick={() => setEditMode(true)}>
              Edit Project
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setEditMode(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </>
        )}
      </DialogActions>

      {/* Delete confirmation dialog for project (from modal) */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Hapus Project</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus project "{project.project_name}"? Tindakan ini akan
            menghapus data dari database dan tidak dapat dikembalikan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Batal</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              setDeletingProject(true);
              try {
                await pipelineApi.deleteProject(project.id);
                // Trigger parent to refresh and close modal
                try {
                  onProjectUpdate(project);
                } catch {
                  // ignore
                }
                setConfirmDeleteOpen(false);
                onClose();
              } catch (err) {
                alert((err as Error)?.message || "Gagal menghapus project");
              } finally {
                setDeletingProject(false);
              }
            }}
            disabled={deletingProject}
          >
            {deletingProject ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date editor dialog for todo items */}
      <Dialog
        open={!!editingDateId}
        onClose={closeDateEditor}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { width: { xs: "360px", sm: "520px" }, p: 1.5 } }}
      >
        <DialogTitle>Ubah Tanggal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              fullWidth
              size="medium"
              type="date"
              value={editingDateValue || ""}
              onChange={(e) => setEditingDateValue(e.target.value ? e.target.value : "")}
              inputProps={{ style: { fontSize: 14, padding: "10px 12px" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDateEditor}>Batal</Button>
          <Button variant="contained" onClick={saveEditedDate}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
      {/* Estimation Request Modal */}
      <EstimationRequestModal
        open={estimationRequestModalOpen}
        onClose={() => setEstimationRequestModalOpen(false)}
        projectId={project.id}
        projectName={project.project_name}
        customerName={customerDetails?.customer_name || project.customer?.name || "Customer"}
        onSubmit={handleCreateEstimationRequest}
      />

      {/* Attachment Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pr: 2 }}>{previewTitle || "Preview"}</DialogTitle>
        <DialogContent
          dividers
          sx={{ minHeight: 360, display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          {!previewSrc ? (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>
                File Tidak Tersedia
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {previewTitle === "File Tidak Tersedia"
                  ? "File tidak ditemukan di penyimpanan lokal. File mungkin sudah dihapus atau belum tersimpan dengan benar."
                  : previewTitle === "File Rusak"
                    ? "Data file rusak dan tidak dapat dibaca."
                    : previewTitle === "File Data Kosong"
                      ? "File tidak memiliki data yang valid."
                      : "File tidak dapat ditampilkan."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tip: Upload ulang file di estimasi baru untuk menyimpan lampiran dengan benar.
              </Typography>
            </Box>
          ) : previewMime && previewMime.startsWith("image/") ? (
            <Box
              component="img"
              src={previewSrc}
              alt={previewTitle || "preview"}
              sx={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 1 }}
            />
          ) : /(\.pdf$)|(^data:application\/pdf;)/i.test(previewSrc) ||
            previewMime === "application/pdf" ? (
            <Box sx={{ width: "100%", height: "70vh" }}>
              <iframe
                title={previewTitle || "pdf-preview"}
                src={previewSrc}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </Box>
          ) : /^https?:\/\//i.test(previewSrc) ? (
            <Box sx={{ width: "100%", height: "70vh" }}>
              <iframe
                title={previewTitle || "url-preview"}
                src={previewSrc}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </Box>
          ) : (
            (() => {
              // For Office documents, try to use Google Docs Viewer or Office Online
              const isOfficeDoc =
                previewTitle &&
                (/\.(docx?|xlsx?|pptx?)$/i.test(previewTitle) ||
                  (previewMime &&
                    /application\/(vnd\.openxmlformats-officedocument|msword|vnd\.ms-excel|vnd\.ms-powerpoint)/.test(
                      previewMime,
                    )));

              if (isOfficeDoc && previewSrc.startsWith("data:")) {
                // For base64 data URLs of Office docs, we need to download first as viewers need actual URLs
                return (
                  <Box sx={{ textAlign: "center", p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {previewTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      File dokumen Office tidak dapat di-preview langsung dari penyimpanan lokal.
                      Silakan download file untuk membukanya.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => {
                        try {
                          const link = document.createElement("a");
                          link.href = previewSrc as string;
                          link.download = previewTitle || "download";
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (err) {
                          console.error("download error", err);
                          alert("Gagal mendownload file");
                        }
                      }}
                    >
                      Download untuk Membuka
                    </Button>
                  </Box>
                );
              }

              // For other file types, show download option
              return (
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Preview tidak tersedia untuk tipe file ini.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      try {
                        const link = document.createElement("a");
                        link.href = previewSrc as string;
                        link.download = previewTitle || "download";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) {
                        console.error("download from preview error", err);
                        alert("Gagal mendownload file");
                      }
                    }}
                  >
                    Download
                  </Button>
                </Box>
              );
            })()
          )}
        </DialogContent>
        <DialogActions>
          {previewSrc && (
            <Button
              variant="contained"
              onClick={() => {
                try {
                  const link = document.createElement("a");
                  link.href = previewSrc as string;
                  link.download = previewTitle || "download";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (err) {
                  console.error("download from preview error", err);
                  alert("Gagal mendownload file");
                }
              }}
            >
              Download
            </Button>
          )}
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Label Management Dialog */}
      <Dialog open={labelDialogOpen} onClose={closeLabelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          Labels
          <IconButton
            onClick={closeLabelDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Search Labels */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search labels..."
            value={labelSearchQuery}
            onChange={(e) => setLabelSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Labels List */}
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ mb: 1, fontSize: "0.875rem", color: "text.secondary" }}
          >
            Labels
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
            {filteredLabels.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                {labelSearchQuery ? "No labels found" : "No labels yet"}
              </Typography>
            ) : (
              filteredLabels.map((label) => (
                <Box
                  key={label.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                      "& .edit-icon": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box
                    component="input"
                    type="checkbox"
                    checked={checkedLabelIds.has(label.id)}
                    onChange={() => toggleLabelChecked(label.id)}
                    sx={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      accentColor: label.color,
                    }}
                  />
                  <Box
                    component="input"
                    type="color"
                    value={label.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const updated = availableLabels.map((l) =>
                        l.id === label.id ? { ...l, color: e.target.value } : l,
                      );
                      setAvailableLabels(updated);
                      persistLabels(updated);
                    }}
                    sx={{
                      width: 0,
                      height: 0,
                      opacity: 0,
                      position: "absolute",
                      pointerEvents: "none",
                    }}
                    id={`color-picker-${label.id}`}
                  />
                  <Box
                    component="label"
                    htmlFor={`color-picker-${label.id}`}
                    sx={{
                      flex: 1,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: label.color,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "white",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      transition: "opacity 0.2s",
                      "&:hover": {
                        opacity: 0.9,
                      },
                    }}
                  >
                    {label.name}
                  </Box>
                  <IconButton
                    size="small"
                    className="edit-icon"
                    onClick={() => {
                      const newName = prompt("Edit label name:", label.name);
                      if (newName && newName.trim()) {
                        updateLabelName(label.id, newName.trim());
                      }
                    }}
                    sx={{
                      opacity: 0,
                      transition: "opacity 0.2s",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))
            )}
          </Box>

          {/* Create New Label */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Create a new label
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createNewLabel();
              }}
            />
            <Button variant="contained" onClick={createNewLabel} disabled={!newLabelName.trim()}>
              Create
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLabelDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

// Small helper component to show a map for an address.
// Behavior:
// - If a Google Maps API key is available at build/runtime (import.meta.env.VITE_GOOGLE_MAPS_API_KEY or process.env.REACT_APP_GOOGLE_MAPS_API_KEY),
//   it will load the Google Maps JS API, geocode the address and render a map with a marker.
// - If no API key is present, it falls back to an embedded Google Maps iframe using a simple query.
const AddressMap: React.FC<{ address?: string | null; height?: number | string }> = ({
  address,
  height = 220,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiKey = () => {
    try {
      // Support common env var patterns used in React/Vite projects
      const viteKey = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY;
      const reactKey = (process.env as any)?.REACT_APP_GOOGLE_MAPS_API_KEY;
      return viteKey || reactKey || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!address) return;
    const key = getApiKey();
    if (!key) return; // nothing to do here - iframe fallback will be used in render

    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load the script if necessary
        if (!(window as any).google || !(window as any).google.maps) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(
              `script[data-google-maps]`,
            ) as HTMLScriptElement | null;
            if (existing) {
              existing.addEventListener("load", () => resolve());
              existing.addEventListener("error", () => reject());
              if ((window as any).google && (window as any).google.maps) resolve();
              return;
            }
            const s = document.createElement("script");
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
              key,
            )}&libraries=places`;
            s.async = true;
            s.defer = true;
            s.setAttribute("data-google-maps", "true");
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Gagal memuat Google Maps"));
            document.head.appendChild(s);
          });
        }

        if (cancelled) return;
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ address }, (results: any, status: string) => {
          if (cancelled) return;
          if (status !== "OK" || !results || results.length === 0) {
            setError("Gagal menemukan lokasi dari alamat");
            setLoading(false);
            return;
          }
          const loc = results[0].geometry.location;
          const latLng = { lat: loc.lat(), lng: loc.lng() };
          // initialize map
          if (mapRef.current) {
            const map = new (window as any).google.maps.Map(mapRef.current, {
              center: latLng,
              zoom: 15,
            });
            new (window as any).google.maps.Marker({ position: latLng, map });
          }
          setLoading(false);
        });
      } catch (err) {
        setError(typeof err === "string" ? err : "Gagal memuat peta");
        setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // No address
  if (!address) {
    return null;
  }

  const apiKey = getApiKey();

  return (
    <Box sx={{ mt: 1 }}>
      {loading && (
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <CircularProgress size={18} />
          <Typography variant="caption">Memuat peta...</Typography>
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error" display="block" mb={1}>
          {error}
        </Typography>
      )}
      {apiKey ? (
        <div ref={mapRef} style={{ width: "100%", height, borderRadius: 6, overflow: "hidden" }} />
      ) : (
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`}
          width="100%"
          height={height}
          style={{ border: 0, borderRadius: 6 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Customer Location"
        />
      )}
    </Box>
  );
};

// Document Management Component for localStorage
interface ProjectDocument {
  id: string;
  name: string;
  type: "PROPOSAL" | "PO" | "INVOICE" | "CONTRACT" | "OTHER";
  size: number;
  uploadedAt: string;
  fileData: string; // Base64 encoded file data
  mimeType: string;
}

interface DocumentTabProps {
  projectId: string;
  projectName: string;
  onPreview?: (attachmentUrl: string, name?: string, mime?: string) => void;
}

const DocumentTab: React.FC<DocumentTabProps> = ({ projectId, projectName, onPreview }) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from localStorage on mount
  useEffect(() => {
    const storageKey = `project_documents_${projectId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setDocuments(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to load documents from localStorage:", err);
    }
  }, [projectId]);

  // Save documents to localStorage
  const saveDocuments = (docs: ProjectDocument[]) => {
    const storageKey = `project_documents_${projectId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(docs));
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to save documents to localStorage:", err);
      alert("Gagal menyimpan dokumen. Storage penuh atau terbatas.");
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Ukuran file maksimal 10MB");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as string;

        const newDocument: ProjectDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: "OTHER",
          size: file.size,
          uploadedAt: new Date().toISOString(),
          fileData,
          mimeType: file.type,
        };

        const updatedDocs = [...documents, newDocument];
        saveDocuments(updatedDocs);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setUploading(false);
      };

      reader.onerror = () => {
        alert("Gagal membaca file");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Gagal mengunggah file");
      setUploading(false);
    }
  };

  // Handle file download (or preview via parent handler)
  const handleDownload = (doc: ProjectDocument) => {
    try {
      if (onPreview) {
        onPreview(doc.fileData, doc.name, doc.mimeType);
        return;
      }
      const link = document.createElement("a");
      link.href = doc.fileData;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Gagal mengunduh file");
    }
  };

  // Handle estimation attachment download
  const handleEstimationAttachmentDownload = (attachmentUrl: string) => {
    console.log("=== ATTACHMENT DOWNLOAD DEBUG ===");
    console.log("Attempting to download:", attachmentUrl);

    // Show all localStorage keys for debugging
    const allKeys = Object.keys(localStorage);
    const estimationKeys = allKeys.filter((key) => key.includes("estimation"));
    console.log("All localStorage keys:", allKeys.length);
    console.log("Estimation-related keys:", estimationKeys);

    try {
      // Check if it's a localStorage URL
      if (attachmentUrl.startsWith("localStorage://")) {
        const storageKey = attachmentUrl.replace("localStorage://", "");
        console.log("Looking for storage key:", storageKey);

        const storedData = localStorage.getItem(storageKey);
        console.log("Raw stored data length:", storedData ? storedData.length : "null");

        if (!storedData) {
          console.error("No data found for key:", storageKey);
          alert(
            `File tidak ditemukan!\n\nKey dicari: ${storageKey}\n\nKeys tersedia: ${estimationKeys.join(", ") || "tidak ada"}\n\nCoba upload ulang file estimasi.`,
          );
          return;
        }

        let attachment;
        try {
          attachment = JSON.parse(storedData);
          console.log("Parsed attachment:", {
            name: attachment.name,
            size: attachment.size,
            hasFileData: !!attachment.fileData,
          });
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          alert("Data file rusak (JSON parse error)");
          return;
        }

        if (!attachment.fileData) {
          console.error("No fileData in attachment");
          alert("File data tidak ditemukan dalam attachment");
          return;
        }

        if (!attachment.fileData.startsWith("data:")) {
          console.error("Invalid fileData format");
          alert("Format file data tidak valid (bukan base64)");
          return;
        }

        try {
          const link = document.createElement("a");
          link.href = attachment.fileData;
          link.download = attachment.name || "download";
          link.style.display = "none";
          document.body.appendChild(link);
          console.log("Triggering download for:", attachment.name);
          link.click();
          document.body.removeChild(link);
          console.log("Download triggered successfully");
          alert(`File ${attachment.name} berhasil didownload!`);
        } catch (downloadErr) {
          console.error("Download error:", downloadErr);
          alert("Error saat download: " + (downloadErr as Error).message);
        }
      } else {
        // Fallback for regular URLs
        console.log("Opening regular URL:", attachmentUrl);
        window.open(attachmentUrl, "_blank");
      }
    } catch (err) {
      console.error("General error in download function:", err);
      alert("Error umum: " + (err as Error).message);
    }
    console.log("=== END DEBUG ===");
  };

  // Handle file delete
  const handleDelete = (documentId: string) => {
    if (!confirm("Hapus dokumen ini?")) return;

    const updatedDocs = documents.filter((doc) => doc.id !== documentId);
    saveDocuments(updatedDocs);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Document type helpers removed — types are no longer selectable/displayed

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dokumen Project
      </Typography>

      {/* Upload Section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Upload Dokumen Baru
          </Typography>

          <Grid container spacing={2} alignItems="center">
            {/* Document type selection removed */}
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                />
                <Button
                  variant="contained"
                  startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  fullWidth
                >
                  {uploading ? "Mengupload..." : "Pilih File"}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT (Max: 10MB)
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Box textAlign="center" py={4}>
          <FileIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Belum ada dokumen untuk project ini
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upload dokumen pertama menggunakan tombol di atas
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} key={doc.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                      <FileIcon color="primary" />
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {doc.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(doc.size)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box display="flex" gap={1}>
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(doc)}
                          color="primary"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus">
                        <IconButton size="small" onClick={() => handleDelete(doc.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Storage Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          📁 Dokumen disimpan secara lokal di browser Anda. Data akan hilang jika browser cache
          dibersihkan atau menggunakan browser/komputer lain.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ProjectDetailModal;

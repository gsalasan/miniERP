import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  getPipelineStages,
  getOpportunities,
  createOpportunity,
  PipelineStage,
  Opportunity,
  CreateOpportunityData,
} from "../../api/opportunity";
import KanbanBoard from "../../components/pipeline/KanbanBoard";
import AddOpportunityModal from "../../components/pipeline/AddOpportunityModal";

const PipelinePage: React.FC = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Load stages and opportunities
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [stagesData, opportunitiesData] = await Promise.all([
        getPipelineStages(),
        getOpportunities(),
      ]);

      // Sort stages by stage_order
      const sortedStages = stagesData.sort((a, b) => a.stage_order - b.stage_order);
      setStages(sortedStages);
      setOpportunities(opportunitiesData.data || []);
    } catch (err) {
      setError((err as Error)?.message || "Gagal memuat data pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    loadData();
  };

  // Handle create opportunity
  const handleCreateOpportunity = async (data: CreateOpportunityData) => {
    try {
      setSubmitting(true);

      // If no stage specified, use first stage
      if (!data.stage && stages.length > 0) {
        data.stage = stages[0].id;
      }

      await createOpportunity(data);
      setAddModalOpen(false);
      
      // Reload data
      await loadData();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Handle card click
  const handleCardClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    // TODO: Open detail modal
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Sales Pipeline
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            disabled={loading}
          >
            Tambah Opportunity
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Kanban Board */}
      <Box sx={{ overflowX: "auto", width: "100%" }}>
        <KanbanBoard
          stages={stages}
          opportunities={opportunities}
          onOpportunitiesUpdate={setOpportunities}
          onCardClick={handleCardClick}
          loading={loading}
          viewportOffset={160}
        />
      </Box>

      {/* Add Opportunity Modal */}
      <AddOpportunityModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateOpportunity}
        loading={submitting}
      />
    </Box>
  );
};

export default PipelinePage;

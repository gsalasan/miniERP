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
import ProjectDetailModal from "../../components/pipeline/ProjectDetailModal";
import { Project, ProjectStatus } from "../../types/pipeline";
import { useAuth } from "../../contexts/AuthContext";

// Convert Opportunity to Project format for ProjectDetailModal
const convertOpportunityToProject = (opportunity: Opportunity): Project => {
  return {
    id: opportunity.id,
    project_name: opportunity.title,
    description: opportunity.description || "",
    status: opportunity.status?.toUpperCase() as ProjectStatus || ProjectStatus.PROSPECT,
    contract_value: opportunity.estimated_value,
    estimated_value: opportunity.estimated_value,
    lead_score: opportunity.lead_score,
    sales_user_id: opportunity.sales_pic || "",
    customer_id: opportunity.customer_id || "",
    estimation_status: undefined,
    priority: undefined,
    expected_close_date: opportunity.expected_close_date,
    created_at: opportunity.created_at,
    updated_at: opportunity.updated_at,
    customer: {
      id: opportunity.customer?.id || "",
      name: opportunity.customer?.customer_name || "",
      city: opportunity.customer?.city || "",
    },
    sales_user: opportunity.sales_pic_user ? {
      id: opportunity.sales_pic_user.id,
      name: opportunity.sales_pic_user.employee?.full_name || opportunity.sales_pic_user.email,
      email: opportunity.sales_pic_user.email,
    } : undefined,
  };
};

const PipelinePage: React.FC = () => {
  const { user } = useAuth();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Load stages and opportunities
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine filter parameters based on user role
      const isSales = user?.roles?.includes('SALES') && !user?.roles?.includes('SALES_MANAGER') && !user?.roles?.includes('CEO');
      const params: any = {};
      
      // If user is SALES (not manager or CEO), filter by their user ID
      if (isSales && user?.id) {
        params.sales_pic = user.id;
      }

      const [stagesData, opportunitiesData] = await Promise.all([
        getPipelineStages(),
        getOpportunities(params),
      ]);

      // Filter out unwanted stages (Negotiation, On Hold)
      const filteredStages = stagesData.filter(
        (stage) => !['Negotiation', 'On Hold'].includes(stage.stage_name)
      );

      // Sort stages by stage_order
      const sortedStages = filteredStages.sort((a, b) => a.stage_order - b.stage_order);
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

      // Auto-set sales_pic to current user if not specified
      if (!data.sales_pic && user?.id) {
        data.sales_pic = user.id;
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
  const handleCardClick = async (opportunity: Opportunity) => {
    // If opportunity has project_id, fetch the real Project data
    if (opportunity.project_id) {
      try {
        const { pipelineApi } = await import("../../api/pipeline");
        const realProject = await pipelineApi.getProjectById(opportunity.project_id);
        setSelectedProject(realProject);
      } catch (err) {
        console.error("Failed to load project:", err);
        // Fallback to converted data if fetch fails
        const project = convertOpportunityToProject(opportunity);
        setSelectedProject(project);
      }
    } else {
      // No project_id, use converted data
      const project = convertOpportunityToProject(opportunity);
      setSelectedProject(project);
    }
  };

  // Handle close detail modal
  const handleCloseDetail = () => {
    setSelectedProject(null);
  };

  // Handle project update from modal
  const handleProjectUpdate = (updatedProject: Project) => {
    setSelectedProject(updatedProject);
    // Reload opportunities to reflect changes
    loadData();
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

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          open={!!selectedProject}
          onClose={handleCloseDetail}
          project={selectedProject}
          onProjectUpdate={handleProjectUpdate}
          isOpportunity={false}
        />
      )}
    </Box>
  );
};

export default PipelinePage;

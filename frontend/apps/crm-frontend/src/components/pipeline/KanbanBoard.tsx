import React, { useState, useCallback } from "react";
import { Box, Alert, Snackbar, CircularProgress, Typography } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  Opportunity, 
  PipelineStage, 
  moveOpportunityStage 
} from "../../api/opportunity";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  stages: PipelineStage[];
  opportunities: Opportunity[];
  onOpportunitiesUpdate: (newOpportunities: Opportunity[]) => void;
  onCardClick: (opportunity: Opportunity) => void;
  loading?: boolean;
  onAddStage?: () => void;
  onEditStage?: (stageId: string) => void;
  onDeleteStage?: (stageId: string) => void;
  canDeleteStage?: (stageId: string) => boolean;
  onStagesReorder?: (newStages: PipelineStage[]) => void;
  viewportOffset?: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  opportunities,
  onOpportunitiesUpdate,
  onCardClick,
  onAddStage,
  onEditStage,
  onDeleteStage,
  canDeleteStage,
  onStagesReorder,
  loading = false,
  viewportOffset = 200,
}) => {
  const [dragLoading, setDragLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Delete an opportunity card
  const handleDeleteCard = (opportunityId: string) => {
    try {
      const newOpportunities = opportunities.filter((o) => o.id !== opportunityId);
      onOpportunitiesUpdate(newOpportunities);
      setSnackbarMessage("Opportunity berhasil dihapus");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage("Gagal memperbarui UI setelah penghapusan");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Handle drag end event
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId, type } = result;

      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
      }

      // Handle stage reordering
      if (type === "STAGE") {
        const newStages = Array.from(stages);
        const [reorderedStage] = newStages.splice(source.index, 1);
        newStages.splice(destination.index, 0, reorderedStage);

        if (onStagesReorder) {
          onStagesReorder(newStages);
        }

        setSnackbarMessage("Urutan stage berhasil diubah");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        return;
      }

      // Handle card dragging (opportunity stage change)
      const newStageId = destination.droppableId;
      const opportunityId = draggableId;

      // Find the opportunity being moved
      const opportunity = opportunities.find((o) => o.id === opportunityId);
      if (!opportunity) return;

      // Create optimistic update
      const updatedOpportunities = opportunities.map((o) =>
        o.id === opportunityId ? { ...o, stage: newStageId } : o
      );
      onOpportunitiesUpdate(updatedOpportunities);
      setDragLoading(true);

      try {
        // Call API to update backend
        await moveOpportunityStage(opportunityId, { stage: newStageId });

        const newStage = stages.find((s) => s.id === newStageId);
        setSnackbarMessage(
          `Berhasil memindahkan "${opportunity.title}" ke ${newStage?.stage_name || newStageId}`,
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error: any) {
        // Revert optimistic update on error
        onOpportunitiesUpdate(opportunities);
        setSnackbarMessage(error.message || "Gagal memindahkan kartu");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setDragLoading(false);
      }
    },
    [stages, opportunities, onOpportunitiesUpdate, onStagesReorder],
  );

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Memuat data pipeline...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-stages" direction="horizontal" type="STAGE">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                display: "flex",
                overflowX: "auto",
                overflowY: "hidden",
                height: `calc(100vh - ${viewportOffset}px)`,
                pb: 2,
                "&::-webkit-scrollbar": {
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f1f1f1",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#c1c1c1",
                  borderRadius: "4px",
                  "&:hover": {
                    background: "#a1a1a1",
                  },
                },
              }}
            >
              {stages.map((stage, index) => {
                const stageOpportunities = opportunities.filter((o) => o.stage === stage.id);
                const totalValue = stageOpportunities.reduce(
                  (sum, o) => sum + (Number(o.estimated_value) || 0),
                  0
                );
                
                return (
                  <Draggable key={stage.id} draggableId={`stage-${stage.id}`} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          opacity: snapshot.isDragging ? 0.5 : 1,
                        }}
                      >
                        <KanbanColumn
                          stage={stage}
                          opportunities={stageOpportunities}
                          totalValue={totalValue}
                          onCardClick={onCardClick}
                          onEdit={() => onEditStage?.(stage.id)}
                          onDelete={() => onDeleteStage?.(stage.id)}
                          deletable={canDeleteStage ? canDeleteStage(stage.id) : true}
                          onDeleteCard={handleDeleteCard}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {/* Add another stage placeholder */}
              <Box
                onClick={onAddStage}
                sx={{
                  width: 320,
                  minWidth: 320,
                  height: `calc(100vh - ${viewportOffset}px)`,
                  mr: 2,
                  borderRadius: 2,
                  border: "2px dashed #90CAF9",
                  color: "#1976d2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  bgcolor: "rgba(25,118,210,0.04)",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  + Tambah Stage Baru
                </Typography>
              </Box>
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {/* Loading overlay for drag operations */}
      {dragLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              backgroundColor: "white",
              p: 3,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              boxShadow: 3,
            }}
          >
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Memindahkan kartu...</Typography>
          </Box>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default KanbanBoard;

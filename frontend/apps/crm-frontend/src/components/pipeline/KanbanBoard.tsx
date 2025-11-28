import React, { useState, useCallback } from "react";
import { Box, Alert, Snackbar, CircularProgress, Typography } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Pipeline, Project, ProjectStatus, MovePipelineRequest } from "../../types/pipeline";
import { pipelineApi } from "../../api/pipeline";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  pipeline: Pipeline;
  onPipelineUpdate: (newPipeline: Pipeline) => void;
  onCardClick: (project: Project) => void;
  loading?: boolean;
  boards: {
    status: string;
    title?: string;
    description?: string;
    color?: string;
  }[]; // dynamic ordered boards
  onAddList?: () => void;
  onEditBoard?: (status: string) => void;
  onDeleteBoard?: (status: string) => void;
  canDelete?: (status: string) => boolean;
  onBoardsReorder?: (
    newBoards: {
      status: string;
      title?: string;
      description?: string;
      color?: string;
    }[],
  ) => void;
  // Number of pixels to subtract from 100vh when computing Kanban height
  viewportOffset?: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  pipeline,
  onPipelineUpdate,
  onCardClick,
  boards,
  onAddList,
  onEditBoard,
  onDeleteBoard,
  canDelete,
  onBoardsReorder,
  loading = false,
  viewportOffset = 200,
}) => {
  const [dragLoading, setDragLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Delete a project card from the pipeline state (called after backend deletion)
  const handleDeleteCard = (projectId: string, status: string) => {
    try {
      const col = pipeline[status];
      if (!col) return;
      const nextItems = col.items.filter((p) => p.id !== projectId);
      const nextCol = {
        ...col,
        items: nextItems,
        count: nextItems.length,
        totalValue: nextItems.reduce(
          (sum, p) => sum + (p.contract_value ?? p.estimated_value ?? 0),
          0,
        ),
      };
      const nextPipeline = { ...pipeline, [status]: nextCol };
      onPipelineUpdate(nextPipeline);
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

      // If dropped outside droppable area
      if (!destination) return;

      // If dropped in same position
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
      }

      // Handle board reordering (column reordering)
      if (type === "BOARD") {
        const newBoards = Array.from(boards);
        const [reorderedBoard] = newBoards.splice(source.index, 1);
        newBoards.splice(destination.index, 0, reorderedBoard);

        if (onBoardsReorder) {
          onBoardsReorder(newBoards);
        }

        setSnackbarMessage("Urutan board berhasil diubah");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        return;
      }

      // Handle card dragging (project status change)
      const sourceStatus = source.droppableId;
      const destinationStatus = destination.droppableId;
      const projectId = draggableId;

      // Find the project being moved
      const sourceColumn = pipeline[sourceStatus];
      const project = sourceColumn.items[source.index];

      if (!project) return;

      // Helper: coerce contract/estimated values to numbers (strip formatting)
      const toNumber = (v: any) => {
        if (typeof v === "number") return v;
        if (v === null || v === undefined) return 0;
        try {
          // strip non-numeric (e.g., formatting like 'Rp', dots, commas)
          const cleaned = String(v).replace(/[^0-9.-]+/g, "");
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : 0;
        } catch {
          return 0;
        }
      };

      // Create optimistic update
      const newPipeline = { ...pipeline };

      // Remove from source column
      const sourceItems = [...sourceColumn.items];
      const [movedProject] = sourceItems.splice(source.index, 1);
      newPipeline[sourceStatus] = {
        ...sourceColumn,
        items: sourceItems,
        count: sourceItems.length,
        totalValue: sourceItems.reduce(
          (sum, p) => sum + toNumber(p.contract_value ?? p.estimated_value ?? 0),
          0,
        ),
      };

      // Add to destination column (with updated status)
      const destinationColumn = newPipeline[destinationStatus];
      const destinationItems = [...destinationColumn.items];
      const updatedProject = {
        ...movedProject,
        status: destinationStatus as ProjectStatus,
      };
      destinationItems.splice(destination.index, 0, updatedProject);
      newPipeline[destinationStatus] = {
        ...destinationColumn,
        items: destinationItems,
        count: destinationItems.length,
        totalValue: destinationItems.reduce(
          (sum, p) => sum + toNumber(p.contract_value ?? p.estimated_value ?? 0),
          0,
        ),
      };

      // Apply optimistic update
      onPipelineUpdate(newPipeline);
      setDragLoading(true);

      try {
        // Call API to update backend
        const moveRequest: MovePipelineRequest = {
          projectId,
          newStatus: destinationStatus as ProjectStatus,
        };

        await pipelineApi.movePipelineCard(moveRequest);

        // Show success message
        setSnackbarMessage(
          `Berhasil memindahkan "${project.project_name}" ke ${destinationStatus}`,
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error: any) {
        // Revert optimistic update on error
        onPipelineUpdate(pipeline);

        // Show error message
        setSnackbarMessage(error.message || "Gagal memindahkan kartu");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setDragLoading(false);
      }
    },
    [pipeline, onPipelineUpdate],
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
        <Droppable droppableId="all-boards" direction="horizontal" type="BOARD">
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
              {boards.map(({ status, title, description, color }, index) => {
                const column = pipeline[status] || {
                  items: [],
                  totalValue: 0,
                  count: 0,
                };
                return (
                  <Draggable key={status} draggableId={`board-${status}`} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          opacity: snapshot.isDragging ? 0.5 : 1,
                        }}
                      >
                        <KanbanColumn
                          status={status}
                          column={column}
                          onCardClick={onCardClick}
                          title={title}
                          description={description}
                          color={color}
                          onEdit={() => onEditBoard?.(status)}
                          onDelete={() => onDeleteBoard?.(status)}
                          deletable={canDelete ? canDelete(status) : true}
                          onDeleteCard={(projectId: string) => handleDeleteCard(projectId, status)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {/* Add another list placeholder */}
              <Box
                onClick={onAddList}
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
                  + Add another list
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

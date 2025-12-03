import React from "react";
import { Paper, Box, Typography, Chip, Divider, IconButton, Tooltip } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import { Droppable, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { Opportunity, PipelineStage } from "../../api/opportunity";
import OpportunityCard from "./OpportunityCard";

interface KanbanColumnProps {
  stage: PipelineStage;
  opportunities: Opportunity[];
  totalValue: number;
  onCardClick: (opportunity: Opportunity) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deletable?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onDeleteCard?: (opportunityId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  opportunities,
  totalValue,
  onCardClick,
  onEdit,
  onDelete,
  deletable = true,
  dragHandleProps,
  onDeleteCard,
}) => {

  // Format currency to Indonesian Rupiah
  const formatCurrency = (amount: number): string => {
    // Ensure amount is a valid number
    const validAmount = Number(amount) || 0;
    
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 320,
        minWidth: 320,
        height: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        mr: 2,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: stage.color || "#607D8B",
          position: "sticky",
          top: 0,
          zIndex: 1,
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          {/* Left: Drag handle + Title + Description + Total */}
          <Box flex={1} sx={{ pr: 3 }}>
            {/* Title Row */}
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <Box {...dragHandleProps} sx={{ cursor: "grab", display: "flex" }}>
                <DragIcon sx={{ fontSize: "1.2rem", opacity: 0.7 }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                {stage.stage_name}
              </Typography>
            </Box>

            {/* Description - Tepat di bawah judul */}
            {stage.description && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  opacity: 0.9,
                  fontSize: "0.7rem",
                  mb: 0.75,
                }}
              >
                {stage.description}
              </Typography>
            )}

            {/* Total Value - Di bawah description */}
            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: "0.85rem" }}>
              Total: {formatCurrency(totalValue)}
            </Typography>
          </Box>

          {/* Right: Count + Actions (vertical) */}
          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
            <Chip
              label={opportunities.length}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.25)",
                color: "white",
                fontWeight: "bold",
              }}
            />
            {(onEdit || (onDelete && deletable)) && (
              <Box display="flex" flexDirection="column" gap={0.25}>
                {onEdit && (
                  <Tooltip title="Edit stage" placement="left">
                    <IconButton
                      size="small"
                      onClick={onEdit}
                      sx={{
                        color: "white",
                        padding: "4px",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                      }}
                    >
                      <EditIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && deletable && (
                  <Tooltip title="Hapus stage" placement="left">
                    <IconButton
                      size="small"
                      onClick={onDelete}
                      sx={{
                        color: "white",
                        padding: "4px",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {/* Column Body - Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              p: 1,
              backgroundColor: snapshot.isDraggingOver ? "rgba(33, 150, 243, 0.1)" : "transparent",
              transition: "background-color 0.2s ease",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "3px",
                "&:hover": {
                  background: "#a1a1a1",
                },
              },
            }}
          >
            {/* Cards */}
            {opportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                onCardClick={onCardClick}
                onDeleteCard={() => onDeleteCard?.(opportunity.id)}
              />
            ))}

            {provided.placeholder}

            {/* Empty State */}
            {opportunities.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  Tidak ada opportunity
                </Typography>
                <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                  Drag kartu ke sini
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
};

export default KanbanColumn;

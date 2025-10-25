import React from "react";
import MaterialsList from "../../components/MaterialsList";

interface MaterialsPageProps {
  embedded?: boolean;
}

export const MaterialsPage: React.FC<MaterialsPageProps> = ({ embedded = false }) => {
  if (embedded) {
    // When embedded in ItemsPage with tabs
    return <MaterialsList />;
  }

  // When accessed directly via /items/materials route
  return <MaterialsList />;
};

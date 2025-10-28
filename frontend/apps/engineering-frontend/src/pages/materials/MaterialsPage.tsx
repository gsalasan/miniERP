import React from "react";
import MaterialsList from "../../components/MaterialsList";

interface MaterialsPageProps {
  embedded?: boolean;
  globalSearch?: string;
}

export const MaterialsPage: React.FC<MaterialsPageProps> = ({ embedded = false, globalSearch }) => {
  if (embedded) {
    // When embedded in ItemsPage with tabs
    return <MaterialsList globalSearch={globalSearch} />;
  }

  // When accessed directly via /items/materials route
  return <MaterialsList globalSearch={globalSearch} />;
};

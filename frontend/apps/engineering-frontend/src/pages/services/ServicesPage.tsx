import React from "react";
import ServicesList from "../../components/ServicesList";

interface ServicesPageProps {
  embedded?: boolean;
  globalSearch?: string;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ embedded = false, globalSearch }) => {
  if (embedded) {
    // When embedded in ItemsPage with tabs
    return <ServicesList globalSearch={globalSearch} />;
  }

  // When accessed directly via /items/services route
  return <ServicesList globalSearch={globalSearch} />;
};
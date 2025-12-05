import { useQuery } from '@tanstack/react-query';
import { getProjectDashboard } from '../api/dashboardApi';

export const useProjectDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['projectDashboard', projectId],
    queryFn: async () => {
      const resp = await getProjectDashboard(projectId);
      // normalize: if backend wraps { success, data }
      return resp?.data ?? resp;
    },
    enabled: !!projectId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export default useProjectDashboard;

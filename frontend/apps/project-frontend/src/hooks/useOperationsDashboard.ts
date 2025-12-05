import { useQuery } from '@tanstack/react-query';
import { getOperationsDashboard } from '../api/dashboardApi';

export const useOperationsDashboard = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['operationsDashboard', params],
    queryFn: async () => {
      const resp = await getOperationsDashboard(params);
      return resp?.data ?? resp;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export default useOperationsDashboard;

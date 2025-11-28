import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rfpService } from '../services/rfpService';

export function useCreateRfp(projectId: string) {
  const qc = useQueryClient();

  return useMutation((payload: { items: any[]; notes?: string }) => rfpService.createRfp(projectId, payload), {
    onSuccess: (data) => {
      // invalidate project detail/project BOM related queries
      qc.invalidateQueries(['project', projectId]);
      qc.invalidateQueries(['project-bom', projectId]);
    },
  });
}

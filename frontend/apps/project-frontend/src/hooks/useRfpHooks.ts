import { useMutation } from '@tanstack/react-query';
import { rfpService } from '../services/rfpService';

export const useCreateRfp = (projectId: string) => {
  return useMutation(async (payload: { items: any[]; notes?: string }) => {
    return await rfpService.createRfp(projectId, payload);
  });
};

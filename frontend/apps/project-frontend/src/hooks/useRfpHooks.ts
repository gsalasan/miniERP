import { useMutation } from '@tanstack/react-query';
import { rfpService } from '../services/rfpService';
import { toast } from 'react-toastify';

export const useCreateRfp = (projectId: string) => {
  return useMutation({
    mutationFn: async (payload: { items: any[]; notes?: string }) => {
      return await rfpService.createRfp(projectId, payload);
    },
    onSuccess: (data) => {
      toast.success(`RFP ${data.rfp_number || 'berhasil'} dibuat!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Gagal membuat RFP';
      toast.error(message);
      console.error('Error creating RFP:', error);
    },
  });
};

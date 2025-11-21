import axios from 'axios';
import { config, auth } from '../config';

/**
 * Upload a single file to a configured upload endpoint.
 * Behavior:
 * - If VITE_STORAGE_UPLOAD_URL is set, POST FormData to that URL and expect { url: string } per file in response.
 * - Otherwise, fall back to returning a fake placeholder URL (useful for local/dev without an upload service).
 */

const uploadEndpoint = (import.meta as any)?.env?.VITE_STORAGE_UPLOAD_URL || '';

/**
 * Upload helper supporting two modes:
 * 1) If VITE_STORAGE_UPLOAD_URL is provided, it will POST multipart/form-data to that endpoint and expect { url }
 * 2) Otherwise, it will try CRM presign endpoint: POST `${config.CRM_SERVICE_URL}/pipeline/uploads/presign` to get uploadUrl + publicUrl,
 *    then PUT the file bytes to uploadUrl and return publicUrl.
 */
export const storageApi = {
  async uploadFile(
    file: File,
    projectId?: string,
    onProgress?: (percentage: number) => void,
  ): Promise<string> {
    // Mode A: direct upload endpoint (upload service)
    if (uploadEndpoint) {
      const form = new FormData();
      form.append('file', file);
      if (projectId) form.append('projectId', projectId);

      const res = await axios.post(uploadEndpoint, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization:
            localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY)
              ? `Bearer ${
                  localStorage.getItem(auth.TOKEN_KEY) ||
                  localStorage.getItem(auth.LEGACY_TOKEN_KEY)
                }`
              : undefined,
        },
        timeout: 60000,
      });

      const data = res.data;
      if (data && (data.url || data.data?.url)) {
        return data.url || data.data.url;
      }

      if (Array.isArray(data) && data.length > 0 && data[0].url) {
        return data[0].url;
      }

      throw new Error('Upload gagal: respons tidak valid dari server upload');
    }

    // Mode B: use CRM presign endpoint + PUT to signed URL
    try {
      const presignRes = await axios.post(
        `${config.CRM_SERVICE_URL}/pipeline/uploads/presign`,
        {
          filename: file.name,
          contentType: file.type,
          projectId,
        },
        {
          headers: {
            Authorization:
              localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY)
                ? `Bearer ${
                    localStorage.getItem(auth.TOKEN_KEY) ||
                    localStorage.getItem(auth.LEGACY_TOKEN_KEY)
                  }`
                : undefined,
          },
          timeout: 10000,
        },
      );

      const { uploadUrl, publicUrl, readUrl } = presignRes.data || {};
      if (!uploadUrl) throw new Error('Presign gagal: tidak menerima uploadUrl');

      // Upload file bytes to signed URL using axios so we can report progress
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
        timeout: 120000,
      });

      // Prefer publicUrl if provided, otherwise return readUrl or constructed storage URL
      if (publicUrl) return publicUrl;
      if (readUrl) return readUrl;
      // As fallback construct canonical GCS url (may be private)
      const fallback = uploadUrl.split('?')[0] || uploadUrl;
      return fallback;
    } catch (err: any) {
      console.error('storageApi.uploadFile error', err);
      throw err;
    }
  },
};

export default storageApi;

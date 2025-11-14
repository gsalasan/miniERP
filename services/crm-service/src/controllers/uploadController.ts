import { Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';

// Generates a signed URL for uploading a single file to GCS (v4 signed URL)
export const presignUpload = async (req: Request, res: Response) => {
  try {
    const bucketName = process.env.GCS_BUCKET;
    if (!bucketName) {
      return res.status(500).json({ message: 'GCS_BUCKET not configured' });
    }

    const { filename, contentType, projectId } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'filename is required' });
    }

    const storage = new Storage();
    const objectName = `attachments/${projectId || 'general'}/${Date.now()}-${filename.replace(/\s+/g, '_')}`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    // Signed URL for upload (write)
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires,
      contentType: contentType || 'application/octet-stream',
    });

    // A public URL (if bucket objects are publicly readable) or canonical Storage URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(objectName)}`;

    // Also generate a signed URL for reading (short-lived) so frontend can preview if needed
    const [readUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return res.json({ uploadUrl, publicUrl, readUrl, objectName });
  } catch (err: any) {
    console.error('presignUpload error', err);
    return res.status(500).json({ message: err?.message || 'Failed to create presigned URL' });
  }
};

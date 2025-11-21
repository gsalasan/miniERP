import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getPipeline,
  movePipelineCard,
  getProjectActivities,
  createProjectActivity,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
} from '../controllers/pipelineController';
import { presignUpload, uploadFileLocal } from '../controllers/uploadController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Konfigurasi Multer untuk menyimpan file ke local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/po-documents');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// Filter file types
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Public routes (tanpa auth untuk development)
// POST /api/v1/pipeline/uploads/local - Upload file ke local storage
router.post('/uploads/local', upload.single('file'), uploadFileLocal);

// POST /api/v1/pipeline/uploads/presign - Generate GCS presigned upload URL (juga public untuk presign)
router.post('/uploads/presign', presignUpload);

// Apply auth middleware to all other pipeline routes
router.use(verifyToken);

// GET /api/v1/pipeline - Get pipeline data grouped by status
router.get('/', getPipeline);

// PUT /api/v1/pipeline/move - Move a project card between pipeline columns
router.put('/move', movePipelineCard);

// GET /api/v1/pipeline/activities/:projectId - Get project activities
router.get('/activities/:projectId', getProjectActivities);

// POST /api/v1/pipeline/activities - Create a project activity (e.g., checklist actions)
router.post('/activities', createProjectActivity);

// POST /api/v1/pipeline/projects - Create a new project
router.post('/projects', createProject);

// GET /api/v1/pipeline/projects/:projectId - Get project detail
router.get('/projects/:projectId', getProjectById);

// PUT /api/v1/pipeline/projects/:projectId - Update project details
router.put('/projects/:projectId', updateProject);

// DELETE /api/v1/pipeline/projects/:projectId - Delete project
router.delete('/projects/:projectId', deleteProject);

export default router;
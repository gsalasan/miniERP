import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const permissionController = new PermissionController();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/v1/permissions
 * @desc    Create a new permission request
 * @access  Private (Employee)
 */
router.post('/', (req, res) => permissionController.createPermission(req, res));

/**
 * @route   GET /api/v1/permissions/my
 * @desc    Get my permission requests
 * @access  Private (Employee)
 */
router.get('/my', (req, res) => permissionController.getMyPermissions(req, res));

/**
 * @route   GET /api/v1/permissions
 * @desc    Get all permission requests (HR/Manager)
 * @access  Private (HR/Manager)
 */
router.get('/', (req, res) => permissionController.getAllPermissions(req, res));

/**
 * @route   GET /api/v1/permissions/:id
 * @desc    Get permission request by ID
 * @access  Private
 */
router.get('/:id', (req, res) => permissionController.getPermissionById(req, res));

/**
 * @route   PUT /api/v1/permissions/:id/status
 * @desc    Approve/Reject permission request
 * @access  Private (HR/Manager)
 */
router.put('/:id/status', (req, res) => permissionController.updatePermissionStatus(req, res));

/**
 * @route   POST /api/v1/permissions/:id/cancel
 * @desc    Cancel permission request
 * @access  Private (Employee - own request only)
 */
router.post('/:id/cancel', (req, res) => permissionController.cancelPermission(req, res));

export default router;

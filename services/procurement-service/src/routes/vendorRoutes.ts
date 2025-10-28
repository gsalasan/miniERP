import { Router } from 'express';
import { VendorController } from '../controllers/vendorController';

const router = Router();
const vendorController = new VendorController();

// GET /api/v1/vendors - Get all vendors with pagination and filters
router.get('/', vendorController.getAllVendors);

// GET /api/v1/vendors/stats - Get vendor statistics
router.get('/stats', vendorController.getVendorStats);

// GET /api/v1/vendors/:id - Get vendor by ID
router.get('/:id', vendorController.getVendorById);

// POST /api/v1/vendors - Create new vendor
router.post('/', vendorController.createVendor);

// PUT /api/v1/vendors/:id - Update vendor
router.put('/:id', vendorController.updateVendor);

// DELETE /api/v1/vendors/:id - Delete vendor
router.delete('/:id', vendorController.deleteVendor);

export default router;
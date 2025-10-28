import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import searchController from '../controllers/searchController';

const router = Router();

// Health check endpoint (public)
router.get('/health/search', searchController.healthCheck);

// Search endpoints (protected with authentication)
router.get('/api/v1/search/items', verifyToken, searchController.searchItems);

router.get('/api/v1/search/quick', verifyToken, searchController.quickSearch);

export default router;

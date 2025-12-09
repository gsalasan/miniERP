import { Router } from 'express';
import { getProjectMaterials, postAllocate, postIssue } from '../controllers/inventoryController';

const router = Router();

router.get('/materials', getProjectMaterials);
router.post('/allocate', postAllocate);
router.post('/issue', postIssue);

export default router;

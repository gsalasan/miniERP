import { Router } from 'express';
import { getHRStats } from '../controllers/hr.controller';

const router = Router();

router.get('/stats', getHRStats);

export default router;

import { Router } from 'express';
import {
  getCategories,
  postCategory,
  removeCategory,
  getClassifications,
  postClassification,
  removeClassification,
} from '../controllers/vendorLookupControllers';

const router = Router();

// Categories
router.get('/vendor-categories', getCategories);
router.post('/vendor-categories', postCategory);
router.delete('/vendor-categories/:value', removeCategory);

// Classifications
router.get('/vendor-classifications', getClassifications);
router.post('/vendor-classifications', postClassification);
router.delete('/vendor-classifications/:value', removeClassification);

export default router;

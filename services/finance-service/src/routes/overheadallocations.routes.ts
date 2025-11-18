import express from 'express';
import {
  getAllOverheadAllocations,
  getOverheadAllocationById,
  getOverheadAllocationByCategory,
  createOverheadAllocation,
  updateOverheadAllocation,
  deleteOverheadAllocation
} from '../controllers/overheadallocations.controllers';

const router = express.Router();

// GET all overhead allocations
router.get('/', getAllOverheadAllocations);

// GET overhead allocation by ID
router.get('/:id', getOverheadAllocationById);

// GET overhead allocation by category
router.get('/category/:category', getOverheadAllocationByCategory);

// POST create new overhead allocation
router.post('/', createOverheadAllocation);

// PUT update overhead allocation
router.put('/:id', updateOverheadAllocation);

// DELETE overhead allocation
router.delete('/:id', deleteOverheadAllocation);

export default router;

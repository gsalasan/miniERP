const express = require('express');
const router = express.Router();
const payablesController = require('../controllers/payablesController');

/**
 * MIN-140: Accounts Payable Routes
 * /api/payables
 */

// Get all payables with optional filters
router.get('/', payablesController.getAllPayables);

// Get payable summary/statistics
router.get('/summary', payablesController.getPayableSummary);

// Get single payable by ID
router.get('/:id', payablesController.getPayableById);

// Create new payable (manual entry)
router.post('/', payablesController.createPayable);

// Bulk create payables from CSV
router.post('/bulk', payablesController.bulkCreatePayables);

// Process payment for a payable
router.post('/:id/pay', payablesController.processPayment);
router.post('/:id/payments', payablesController.processPayment); // Alternative endpoint

// Update payable status
router.patch('/:id/status', payablesController.updatePayableStatus);

module.exports = router;

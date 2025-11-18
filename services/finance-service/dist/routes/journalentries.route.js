"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Journal Entries Routes
const express_1 = require("express");
const journalentries_controllers_1 = __importDefault(require("../controllers/journalentries.controllers"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/finance/journal-entries
 * @desc    Get all journal entries with optional filters
 * @query   account_id, start_date, end_date
 */
router.get('/', journalentries_controllers_1.default.getAllJournalEntries);
/**
 * @route   GET /api/finance/journal-entries/account/:accountId
 * @desc    Get journal entries by account ID
 */
router.get('/account/:accountId', journalentries_controllers_1.default.getByAccountId);
/**
 * @route   GET /api/finance/journal-entries/account/:accountId/balance
 * @desc    Get account balance summary
 */
router.get('/account/:accountId/balance', journalentries_controllers_1.default.getAccountBalance);
/**
 * @route   GET /api/finance/journal-entries/:id
 * @desc    Get a single journal entry by ID
 */
router.get('/:id', journalentries_controllers_1.default.getJournalEntryById);
/**
 * @route   POST /api/finance/journal-entries
 * @desc    Create a new journal entry
 */
router.post('/', journalentries_controllers_1.default.createJournalEntry);
/**
 * @route   PUT /api/finance/journal-entries/:id
 * @desc    Update a journal entry
 */
router.put('/:id', journalentries_controllers_1.default.updateJournalEntry);
/**
 * @route   DELETE /api/finance/journal-entries/:id
 * @desc    Delete a journal entry
 */
router.delete('/:id', journalentries_controllers_1.default.deleteJournalEntry);
exports.default = router;

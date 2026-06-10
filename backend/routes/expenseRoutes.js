import express from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  upsertBudget,
  deleteBudget,
  getExpenseAnalytics,
} from '../controllers/expenseController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { uploadReceiptFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Enforce auth check on all expense routes
router.use(authenticateUser);

// Expense routes
router.get('/', getExpenses);
router.post('/', uploadReceiptFile.single('receipt'), createExpense);
router.put('/:id', uploadReceiptFile.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

// Budget routes
router.get('/budgets', getBudgets);
router.post('/budgets', upsertBudget);
router.delete('/budgets/:id', deleteBudget);

// Analytics route
router.get('/analytics', getExpenseAnalytics);

export default router;

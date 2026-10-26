import { Router } from 'express';
import {
  getLoanAdvanceEntries,
  createLoanAdvanceEntry,
  deleteLoanAdvanceEntry,
} from '../controllers/loanAdvanceController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuth);

router.get('/', getLoanAdvanceEntries);
router.post('/', createLoanAdvanceEntry);
router.delete('/:id', deleteLoanAdvanceEntry);

export default router;

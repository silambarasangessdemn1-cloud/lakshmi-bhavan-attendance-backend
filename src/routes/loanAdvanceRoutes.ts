import { Router } from 'express';
import {
  getLoanAdvanceEntries,
  createLoanAdvanceEntry,
  deleteLoanAdvanceEntry,
} from '../controllers/loanAdvanceController.js';

const router = Router();

router.get('/', getLoanAdvanceEntries);
router.post('/', createLoanAdvanceEntry);
router.delete('/:id', deleteLoanAdvanceEntry);

export default router;

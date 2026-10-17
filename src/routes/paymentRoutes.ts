import { Router } from 'express';
import {
  getPayments,
  recordPayment,
  deletePayment,
} from '../controllers/paymentController.js';

const router = Router();

router.get('/', getPayments);
router.post('/', recordPayment);
router.delete('/:id', deletePayment);

export default router;

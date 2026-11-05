import { Router } from 'express';
import {
  getTransferRequests,
  createTransferRequest,
  respondToTransferRequest,
} from '../controllers/transferController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTransferRequests);
router.post('/', createTransferRequest);
router.put('/:id/respond', respondToTransferRequest);

export default router;


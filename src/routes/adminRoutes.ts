import { Router } from 'express';
import {
  getHealth,
  resetAllData,
  exportAllData,
  importAllData,
} from '../controllers/adminController.js';

const router = Router();

router.get('/health', getHealth);
router.post('/reset', resetAllData);
router.get('/export', exportAllData);
router.post('/import', importAllData);

export default router;

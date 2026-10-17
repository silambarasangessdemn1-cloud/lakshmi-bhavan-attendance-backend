import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  resetSettings,
} from '../controllers/settingsController.js';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/reset', resetSettings);

export default router;

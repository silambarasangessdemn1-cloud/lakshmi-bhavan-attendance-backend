import { Router } from 'express';
import {
  getAttendance,
  saveAttendanceRecord,
  saveBulkAttendance,
  replaceDateAttendance,
  markAllPresentForDate,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuth);

router.get('/', getAttendance);
router.post('/record', saveAttendanceRecord);
router.post('/bulk', saveBulkAttendance);
router.post('/replace-date', replaceDateAttendance);
router.post('/mark-all-present', markAllPresentForDate);
router.delete('/', deleteAttendance);

export default router;

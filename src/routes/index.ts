import { Router } from 'express';
import authRoutes from './authRoutes.js';
import branchRoutes from './branchRoutes.js';
import userRoutes from './userRoutes.js';
import staffRoutes from './staffRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import loanAdvanceRoutes from './loanAdvanceRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Authentication and Multi-Branch Management
router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);

// Core Modules
router.use('/staff', staffRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/loans-advances', loanAdvanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);

export default router;

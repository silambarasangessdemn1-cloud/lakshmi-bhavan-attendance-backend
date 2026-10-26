import { Router } from 'express';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Logged in users can get branch list (filtered automatically by role)
router.get('/', authenticateToken, getBranches);
router.get('/:id', authenticateToken, getBranchById);

// Only Super Admin can create, edit, or delete branches
router.post('/', authenticateToken, requireSuperAdmin, createBranch);
router.put('/:id', authenticateToken, requireSuperAdmin, updateBranch);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteBranch);

export default router;

import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
} from '../controllers/userController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Only Super Admin can view, create, edit, delete, or restore users
router.use(authenticateToken, requireSuperAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/restore', restoreUser);
router.delete('/:id', deleteUser);

export default router;

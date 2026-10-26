"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branchController_js_1 = require("../controllers/branchController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
// Logged in users can get branch list (filtered automatically by role)
router.get('/', authMiddleware_js_1.authenticateToken, branchController_js_1.getBranches);
router.get('/:id', authMiddleware_js_1.authenticateToken, branchController_js_1.getBranchById);
// Only Super Admin can create, edit, or delete branches
router.post('/', authMiddleware_js_1.authenticateToken, authMiddleware_js_1.requireSuperAdmin, branchController_js_1.createBranch);
router.put('/:id', authMiddleware_js_1.authenticateToken, authMiddleware_js_1.requireSuperAdmin, branchController_js_1.updateBranch);
router.delete('/:id', authMiddleware_js_1.authenticateToken, authMiddleware_js_1.requireSuperAdmin, branchController_js_1.deleteBranch);
exports.default = router;
